//@ts-check
const type = require('./@type.js')
const tds = require('tedious')
const os = require('os')
const vvs = require('vv-shared')
const shared = require('vv-mssql-shared')
const { performance } = require('perf_hooks')

exports.exec = exec
exports.exec_option_beautify = exec_option_beautify
exports.add_function_get_beauty_query = add_function_get_beauty_query

/**
 * @typedef type_duration_row
 * @property {number} table_index
 * @property {number} duration
 */

/**
 * @callback callback_exec
 * @param {type.exec_result} callback
 *//**
 * @param {type.connection} connection
 * @param {type.exec_result_end} result_funded
 * @param {type.exec_option} exec_option
 * @param {number} last_table_chunk_index
 * @param {callback_exec} callback
 */
function exec(connection, result_funded, exec_option, last_table_chunk_index, callback) {
    let perf_columnMetadata = 0
    let row_index_in_table = 0
    let row_index_in_table_chunk = 0

    /** @type {Error} */
    let error_in_event = undefined
    /** @type {number} */
    let perf_on_row_event_start = undefined
    /** @type {type_duration_row[]} */
    let perf_on_row_event_durations = []

    let row_beautify_function = function(row){}
    // @type {tds.ColumnValue[]}
    let row_raw = undefined

    let current_query = result_funded.query_list[connection.current_state.query_index]
    current_query.query_index = connection.current_state.query_index
    if (current_query.type === 'query') {
        connection.current_state.allow_message = true
    } else {
        connection.current_state.allow_message = false
    }

    let query = new tds.Request(current_query.query, (error) => {
        current_query.duration = performance.now() - perf_start

        current_query.duration_beautify_rows = 0
        if (perf_on_row_event_durations.length > 0) {
            result_funded.table_list.filter(f => f.query_index === current_query.query_index).forEach(table => {
                let row_list_length = table.row_list.length
                if (row_list_length > 0) {
                    let durations = perf_on_row_event_durations.filter(f => f.table_index === table.table_index).map(m => { return m.duration })
                    if (durations.length > 0) {
                        let avg = durations.reduce((previous, current) => current += previous) / durations.length
                        current_query.duration_beautify_rows += avg * row_list_length
                    }
                }
            })
        }

        current_query.duration_beautify_columns = perf_columnMetadata
        current_query.duration = current_query.duration - current_query.duration_beautify_columns - current_query.duration_beautify_rows

        query.removeAllListeners('columnMetadata')
        query.removeAllListeners('row')
        row_beautify_function = undefined

        if (
            !vvs.isEmptyString(exec_option.chunk.type) &&
            connection.current_state.table_index >= 0 &&
            (result_funded.table_list[connection.current_state.table_index].row_list.length > 0)
            ) {
            let chunk = exec_move_to_chunk(result_funded, connection.current_state.table_index, last_table_chunk_index)
            callback({
                type: 'chunk',
                chunk: chunk
            })
        }

        if (!vvs.isEmpty(error_in_event)) {
            error = error_in_event
        }

        if (!vvs.isEmpty(error)) {
            if (exec_option.stop_on_error === true || current_query.type === 'lock') {
                result_funded.error = error
                result_funded.error_type = (current_query.type === 'lock' ? 'lock' : 'exec')
                callback({
                    type: 'end',
                    end: result_funded
                })
                current_query = undefined
                row_raw = undefined
                perf_start = undefined
                perf_chunk = undefined
                perf_columnMetadata = undefined
                row_index_in_table = undefined
                row_index_in_table_chunk = undefined
                perf_on_row_event_start = undefined
                perf_on_row_event_durations = undefined
                row_beautify_function = undefined
                return
            }
            current_query.error = error
            current_query.error_type = 'exec'
        }

        if (current_query.type === 'get_spid') {
            callback({
                type: 'spid',
                spid: row_raw[0].value
            })
        }

        current_query = undefined
        row_raw = undefined
        perf_start = undefined
        perf_chunk = undefined
        perf_columnMetadata = undefined
        row_index_in_table = undefined
        row_index_in_table_chunk = undefined
        perf_on_row_event_start = undefined
        perf_on_row_event_durations = undefined
        row_beautify_function = undefined

        connection.current_state.query_index++
        if (result_funded.query_list.length > connection.current_state.query_index) {
            exec(connection, result_funded, exec_option, last_table_chunk_index, callback)
            return
        }

        callback({
            type: 'end',
            end: result_funded
        })
    })

    query.on('columnMetadata', function(columns) {
        if (!vvs.isEmpty(error_in_event)) return
        try {
            row_index_in_table = 0
            row_index_in_table_chunk = 0

            if (current_query.type !== 'query') return
            let perf_columnMetadata_start = performance.now()

            if (
                !vvs.isEmptyString(exec_option.chunk.type) &&
                connection.current_state.table_index >= 0 &&
                (result_funded.table_list[connection.current_state.table_index].row_list.length > 0)
                ) {
                let chunk = exec_move_to_chunk(result_funded, connection.current_state.table_index, last_table_chunk_index)
                callback({
                    type: 'chunk',
                    chunk: chunk
                })
            }

            connection.current_state.table_index++

            let column_list_beauty = column_list_beautify(columns, exec_option.null_to_undefined)

            // @ts-ignore
            row_beautify_function = column_list_beauty.row_beautify_function
            result_funded.table_list.push({
                query_index: connection.current_state.query_index,
                table_index: connection.current_state.table_index,
                column_list: column_list_beauty.column_list,
                row_list: [],
            })

            perf_columnMetadata = (performance.now() - perf_columnMetadata_start) + perf_columnMetadata
        } catch (error) {
            error_in_event = error
        }
    })

    query.on('row', function(row) {
        if (!vvs.isEmpty(error_in_event)) return
        try {
            row_index_in_table++
            row_index_in_table_chunk++

            let need_perf = (connection.current_state.table_index >= 0 && (row_index_in_table <= 100 || (row_index_in_table >= 1000 && row_index_in_table <= 1100)))
            if (need_perf === true) perf_on_row_event_start = performance.now()

            if (current_query.type === 'query') {
                result_funded.table_list[connection.current_state.table_index].row_list.push(row_beautify_function(row))

                let need_send_chunk = false
                if (exec_option.chunk.type === 'row' && row_index_in_table_chunk >= exec_option.chunk.chunk) {
                    need_send_chunk = true
                } else if (exec_option.chunk.type === 'msec' && row_index_in_table_chunk >= 100) {
                    let perf_chunk_now = performance.now()
                    if (perf_chunk_now - perf_chunk > exec_option.chunk.chunk) {
                        need_send_chunk = true
                        perf_chunk = perf_chunk_now
                    }
                }
                if (need_send_chunk === true) {
                    let chunk = exec_move_to_chunk(result_funded, connection.current_state.table_index, last_table_chunk_index)
                    row_index_in_table_chunk = 0
                    last_table_chunk_index = connection.current_state.table_index
                    callback({
                        type: 'chunk',
                        chunk: chunk
                    })
                }

            } else {
                row_raw = row
            }

            if (need_perf === true) perf_on_row_event_durations.push({table_index: connection.current_state.table_index, duration: performance.now() - perf_on_row_event_start})
        } catch (error) {
            error_in_event = error
        }
    })

    let perf_start = performance.now()
    let perf_chunk = perf_start
    connection.tds_connection.execSqlBatch(query)
}


/**
 * @param {type.exec_result_end} result_funded
 * @param {number} table_chunk_index
 * @param {number} last_table_chunk_index
 * @returns {type.exec_result_chunk}
 */
function exec_move_to_chunk(result_funded, table_chunk_index, last_table_chunk_index) {
    let table = result_funded.table_list[table_chunk_index]
    return {
        message_list: result_funded.message_list.splice(0, result_funded.message_list.length),
        table: {
            query_index: table.query_index,
            table_index: table_chunk_index,
            column_list: (last_table_chunk_index >= table_chunk_index ? [] : table.column_list),
            row_list: table.row_list.splice(0, table.row_list.length)
        }
    }
}

/**
 * @param {type.exec_option} exec_option
 * @returns {type.exec_option}
 */
function exec_option_beautify(exec_option) {
    if (vvs.isEmpty(exec_option)) {
        return {
            database: '',
            get_spid: false,
            chunk: {
                chunk: undefined,
                type: undefined
            },
            lock: undefined,
            stop_on_error: true,
            null_to_undefined: false
        }
    }

    /** @type {type.exec_chunk} */ let chunk = {
        chunk: undefined,
        type: undefined
    }
    if (!vvs.isEmpty(exec_option.chunk)) {
        let chunk_chunk = vvs.toInt(exec_option.chunk.chunk, 0)
        if (chunk_chunk > 0 && ['row','msec'].includes(exec_option.chunk.type)) {
            chunk = {
                chunk: chunk_chunk,
                type: exec_option.chunk.type
            }
        }
    }

    /** @type {type.exec_lock} */ let lock = undefined
    if (!vvs.isEmpty(exec_option.lock)) {
        let lock_key = vvs.replaceAll(vvs.toString(exec_option.lock.key, ""),"'","").trim()
        let lock_wait = vvs.toInt(exec_option.lock.wait, 0)
        if (lock_wait >= 0 && !vvs.isEmptyString(lock_key)) {
            lock = {
                database: vvs.toString(exec_option.lock.database, ''),
                key: lock_key,
                wait: lock_wait
            }
        }
    }

    return {
        database: vvs.toString(exec_option.database, ''),
        get_spid: vvs.toBool(exec_option.get_spid, false),
        chunk: chunk,
        lock: lock,
        stop_on_error: vvs.toBool(exec_option.stop_on_error, true),
        null_to_undefined: vvs.toBool(exec_option.null_to_undefined, true),
    }
}

/**
 * @typedef type_column_list_beautify
 * @property {type.exec_result_column[]} column_list
 * @property {function} row_beautify_function
 */

//@param {tds.ColumnMetaData[]} columns
/**
 * @param {Object[]} columns
 * @param {boolean} null_to_undefined
 * @return {type_column_list_beautify}
 */
function column_list_beautify(columns, null_to_undefined) {
    /** @type {type.exec_result_column[]} */ let column_list = columns.map(m => { return {
        name: vvs.toString(m.colName,''),
        name_original: vvs.toString(m.colName,''),
        type: m.type.name.toLowerCase(),
        jstype: undefined,
        len: m.dataLength,
        len_chars: undefined,
        scale: m.scale,
        precision: m.precision,
        declararion: undefined,
        // @ts-ignore
        nullable: !!(m.flags & 0x01),
        // @ts-ignore
        identity: !!(m.flags & 0x10),
        // @ts-ignore
        readonly: !(m.flags & 0x0C)
    }})

    column_list.forEach((column, index) => {
        //fill len_chars and declaration
        let info_by_column_type = shared.helper_get_declare(
            // @ts-ignore
            column.type,
            column.precision,
            column.scale,
            column.len,
            'byte'
            )
        if (!vvs.isEmpty(info_by_column_type)) {
            column.type = info_by_column_type.type
            column.jstype = info_by_column_type.type_sql.jstype
            column.len_chars = info_by_column_type.len_chars
            column.declararion = info_by_column_type.sql
        }

        //beautify columns with empty name
        if (vvs.isEmptyString(column.name)) {
            let noname_i = 0
            let maybe_column_name = "noname_".concat(noname_i.toString())
            while (column_list.some(f => !vvs.isEmptyString(f.name) && vvs.equal(f.name,maybe_column_name))) {
                noname_i++
                maybe_column_name = "noname_".concat(noname_i.toString())
            }
            column.name = maybe_column_name
        }
    })

    //beautify columns with same name
    for(let i1 = 0; i1 < column_list.length; i1++) {
        for(let i2 = i1 + 1; i2 < column_list.length; i2++) {
            if (column_list[i1].name.toLowerCase() === column_list[i2].name.toLowerCase()) {
                let copyname_i = 0
                let maybe_column_name = column_list[i2].name.concat("_copy_", copyname_i.toString())
                while (column_list.some(f => !vvs.isEmptyString(f.name) && vvs.equal(f.name.toLowerCase(), maybe_column_name))) {
                    copyname_i++
                    maybe_column_name = column_list[i2].name.concat("_copy_", copyname_i.toString())
                }
                column_list[i2].name = maybe_column_name
            }
        }
    }

    //generate function for beautify rows
    let row_beautify_text = null_to_undefined === true
        ? column_list.map((m, index) => { return m.name.concat(":row[",index.toString(),"].value === null ? undefined : row[",index.toString(),"].value")}).join(",")
        : column_list.map((m, index) => { return m.name.concat(":row[",index.toString(),"].value")}).join(",")
    row_beautify_text = "return {".concat(row_beautify_text, "}")
    let row_beautify_function = new Function('row', row_beautify_text)

    return {column_list: column_list, row_beautify_function: row_beautify_function}
}

/**
 * @param {type.exec_result_end} exec_result_end
 * @param {type.exec_option} options
 */
function add_function_get_beauty_query(exec_result_end, options) {
    exec_result_end.get_beauty_query = function (actual_estimate_execution) {
        if (!['actual', 'estimate'].includes(actual_estimate_execution)) return ''

        /** @type {string[]} */
        let query = []
        if (actual_estimate_execution === 'actual' && !vvs.isEmpty(this.error)) {
            query.push('--!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            query.push('--!!! SCRIPT WORKED WITH ERROR (SEE DETAILS IN END OF SCRIPT) !!!')
            query.push('--!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            query.push('')
        }

        if (actual_estimate_execution === 'actual') {
            let total_duration = 0
            let step_duration = []
            this.query_list.filter(f => !vvs.isEmpty(f.query_index)).forEach(q => {
                let step = vvs.toInt(q.query_index, 0)
                let duration = vvs.toFloat(q.duration, 0)
                if (duration > 0) {
                    if (duration < 2) {
                        duration = Math.round(duration * 10000) / 10000
                    } else if (duration < 10) {
                        duration = Math.round(duration * 1000) / 1000
                    } else if (duration < 100) {
                        duration = Math.round(duration * 100) / 100
                    } else if (duration < 1000) {
                        duration = Math.round(duration * 10) / 10
                    } else {
                        duration = Math.round(duration)
                    }
                    total_duration = total_duration + duration
                }
                step_duration.push({step: step, duration: duration})
            })

            if (step_duration.length === 1) {
                query.push('--durations (msec) '.concat(step_duration[0].duration))
            } else if (step_duration.length > 1) {
                query.push('/*')
                query.push('    durations (msec)')
                step_duration.forEach(item => {
                    let duration_s = item.duration.toString()
                    let duration_p_i = duration_s.indexOf('.')
                    let duration_len = (duration_p_i < 0 ? duration_s.length : duration_s.substring(0, duration_p_i).length)
                    let step_s = '    step #'.concat(item.step.toString(), ': ')
                    let info = (step_s.length > 20 || duration_len > 10 ? step_s.concat(duration_s) : step_s.concat(' '.repeat( (20 - step_s.length) + (10 - duration_len)), duration_s))
                    query.push(info)
                })
                let duration_s = total_duration.toString()
                let duration_p_i = duration_s.indexOf('.')
                let duration_len = (duration_p_i < 0 ? duration_s.length : duration_s.substring(0, duration_p_i).length)
                let info = (duration_len > 10 ? '    total: '.concat(duration_s) : '    total: '.concat(' '.repeat(19 - duration_len), duration_s))
                query.push(info)
                query.push('*/')
            }
        }

        //if no database override in the scripts
        if (this.query_list.some(f => f.type === 'database') === false) {
            query.push('')
            query.push('USE '.concat(vvs.border_add(this.database)))
            query.push('GO')
        }

        if (actual_estimate_execution === 'actual') {
            // print queries
            let query_list = this.query_list.filter(f => !vvs.isEmpty(f.query_index))
            let need_print_step = query_list.length > 1
            query_list.forEach(q => {
                query.push('')
                let step = vvs.toInt(q.query_index, 0)
                if (need_print_step === true) {
                    query.push('--#region step #'.concat(step.toString()))
                }
                query.push(q.query)
                if (need_print_step === true) {
                    query.push('--#endregion step #'.concat(step.toString()))
                }
                query.push('GO')
            })

            // print error
            if (!vvs.isEmpty(this.error)) {
                query.push('/*')
                query.push('ERROR:')
                query.push(this.error.message)
                query.push('*/')
            }
        } else {
            // print queries
            let need_print_step = this.query_list.length > 1
            this.query_list.forEach((q, step) => {
                query.push('')
                if (need_print_step === true) {
                    query.push('--#region step #'.concat(step.toString()))
                }
                query.push(q.query)
                if (need_print_step === true) {
                    query.push('--#endregion step #'.concat(step.toString()))
                }
                query.push('GO')
            })
        }

        // if lock present, lock off
        if (this.query_list.some(f => f.type === 'lock')) {
            query.push('')
            query.push(shared.depot_lock_sp_releaseapplock(options.lock.key, options.lock.database))
        }

        return query.join(os.EOL)
    }
}
