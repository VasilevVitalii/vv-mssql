//@ts-check
const os = require('os')
const tds = require('tedious')
const { performance } = require('perf_hooks')
const vvs = require('vv-shared')
const shared = require('vv-mssql-shared')
const app_connection = require('./app_connection.js')
const app_exec = require('./app_exec.js')
const type = require('./@type.js')

class App {
    /**
     * @param {type.constructor_options} options
     */
    constructor(options) {
        /** @private @type {type.ping_server_info} */
        this._info = undefined
        /** @private @type {type.constructor_options} */
        this._connection_option = undefined
        /** @private @type {tds.ConnectionConfig} */
        this._connection_option_tds = undefined
        /** @private @type {string[]} */
        this._newid_list = []

        try {
            if (vvs.isEmpty(options)) {
                throw Error('connection options to MS SQL Server can not be empty');
            }
            let options_beauty = app_connection.options_beautify(options)
            if (vvs.isEmptyString(options_beauty.instance)) {
                throw Error('instance can not be empty')
            }
            if (vvs.isEmptyString(options_beauty.login) !== vvs.isEmptyString(options_beauty.password)) {
                throw Error(vvs.format('login "{0}" and password "{1}" must be both empty or both not empty', [options_beauty.login, options_beauty.password]))
            }

            this._connection_option = options_beauty
            this._connection_option_tds = app_connection.options_to_tds(options_beauty)
        } catch (error) {
            throw error
        }
    }

    /**
     * @callback callback_ping
     * @param {Error} error
     */
    /**
     * check connect to MS SQL, load MS SQL server info
     * @param {callback_ping} [callback]
     */
    ping(callback) {
        this.exec(["PRINT 'timeout'", shared.depot_server_info()], undefined, (callback_exec => {
            if (callback_exec.type === "end") {
                if (vvs.isEmpty(callback_exec.end.error)) {
                    this._info = {
                        version: vvs.findPropertyValueInObject(callback_exec.end.table_list[0].row_list[0], 'version', ''),
                        timezone: vvs.findPropertyValueInObject(callback_exec.end.table_list[0].row_list[0], 'timezone', 0),
                        ping_duration_msec: callback_exec.end.query_list[0].duration
                    }
                    if (vvs.isFunction(callback)) {
                        callback(undefined)
                    }
                } else {
                    if (vvs.isFunction(callback)) {
                        callback(callback_exec.end.error)
                    }
                }
            }
        }))
    }

    /**
     * return MS SQL info (non empty after exec ping())
     * @returns {type.connection_server_info}
     */
    server_info() {
        return {
            ping: this._info,
            connection: this._connection_option
        }
    }

    /**
     * @callback callback_exec
     * @param {type.exec_result} callback
     */
    /**
     * exec one query or many queries in one batch
     * @param {string|string[]} query
     * @param {type.exec_option} options
     * @param {callback_exec} [callback]
     */
    exec(query, options, callback) {
        let perf_start = performance.now()

        let callback_end_sended = false

        /** @type {type.exec_result_end} */
        let result_funded = {
            error: undefined,
            error_type: undefined,
            duration: 0,
            database: this._connection_option.additional.database,
            table_list: [],
            message_list: [],
            query_list: [],
            get_beauty_query: undefined
        }

        try {
            let options_beauty = app_exec.exec_option_beautify(options)
            app_exec.add_function_get_beauty_query(result_funded, options_beauty)

            if (!vvs.isEmpty(query)) {
                if (Array.isArray(query)) {
                    result_funded.query_list = query.map(m => { return {type: 'query', query: vvs.toString(m,'')} })
                } else {
                    result_funded.query_list.push({type: 'query', query: vvs.toString(query, '')})
                }
            }
            result_funded.query_list = result_funded.query_list.filter(f => !vvs.isEmptyString(f.query))
            if (result_funded.query_list.length <= 0) {
                if (vvs.isFunction(callback)) {
                    options_beauty = undefined
                    callback({type: 'end', end: result_funded})
                }
                return
            }

            app_connection.open(this._connection_option_tds, result_funded, (error, connection) => {
                if (!vvs.isEmpty(error)) {
                    if (!callback_end_sended) {
                        result_funded.error = error
                        result_funded.error_type = 'connect'
                        if (options_beauty.stop_on_error === false) {
                            result_funded.query_list.forEach(query => {
                                query.error = result_funded.error
                                query.error_type = result_funded.error_type
                            })
                        }
                        options_beauty = undefined
                        if (vvs.isFunction(callback)) {
                            callback({
                                type: 'end',
                                end: result_funded
                            })
                        }
                    }
                    return
                }

                if (!vvs.isEmpty(options_beauty.lock)) {
                    result_funded.query_list.unshift({
                        query: shared.depot_lock_sp_getapplock(options_beauty.lock.key, options_beauty.lock.wait, options_beauty.lock.database),
                        type: 'lock'
                    })
                }

                if (!vvs.isEmptyString(options_beauty.database)) {
                    result_funded.query_list.unshift({
                        query: vvs.format("USE {0}", vvs.border_add(options_beauty.database)),
                        type: 'database'
                    })
                }

                if (options_beauty.get_spid === true) {
                    result_funded.query_list.unshift({
                        query: 'SELECT @@SPID [spid]',
                        type: 'get_spid'
                    })
                }

                app_exec.exec(connection, result_funded, options_beauty, -1, (exec_result) => {
                    if (exec_result.type === 'end') {
                        result_funded.duration = performance.now() - perf_start
                        callback_end_sended = true
                        if (options_beauty.stop_on_error === false && exec_result.end.error_type === 'lock') {
                            result_funded.query_list.forEach(query => {
                                query.error = result_funded.error
                                query.error_type = result_funded.error_type
                            })
                        }
                        app_connection.close(connection)
                        options_beauty = undefined
                    }
                    if (vvs.isFunction(callback)) {
                        callback(exec_result)
                    }
                })
            })

        } catch (error) {
            if (vvs.isFunction(callback)) {
                result_funded.error = error
                callback({type: 'end', end: result_funded})
            }
        }
    }

    /**
     * @callback callback_newid
     * @param {Error} error
     * @param {string[]} guid_list
     */
    /**
     * get ms sql generated guid's
     * @param {number} count count guid
     * @param {callback_newid} callback
     */
    newid(count, callback) {
        let count_beauty = vvs.toInt(count, 0)
        if (count_beauty <= 0) {
            callback(undefined, [])
            return
        }
        let guid_list = this._newid_list.splice(0, count_beauty)
        if (guid_list.length >= count_beauty) {
            callback(undefined, guid_list)
            return
        }

        let fj_count = Math.floor(Math.log(count_beauty - guid_list.length)/Math.log(2))
        if (fj_count < 6) fj_count = 6
        let query = [
            vvs.format("SELECT TOP {0} NEWID() guid FROM (SELECT 1 f UNION ALL SELECT 1 f) q", count_beauty - guid_list.length + 100)
        ]
        for (let i = 0; i < fj_count; i++) {
            query.push(vvs.format("FULL JOIN (SELECT 1 f UNION ALL SELECT 1 f) q{0} ON q{0}.f = q.f", i))
        }
        this.exec(query.join(os.EOL), undefined, callback_exec => {
            if (callback_exec.type !== 'end') return
            if (!vvs.isEmpty(callback_exec.end.error)) {
                callback(callback_exec.end.error, [])
                return
            }
            this._newid_list = callback_exec.end.table_list[0].row_list.map(m => { return m.guid })
            callback_exec = undefined
            guid_list = guid_list.concat(this._newid_list.splice(0, count_beauty - guid_list.length))
            callback(undefined, guid_list)
        })
    }
}

module.exports = App