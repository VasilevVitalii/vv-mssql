//@ts-check
const type = require('./@type.js')
const os = require('os')
const tds = require('tedious')
const vvs = require('vv-shared')

exports.options_beautify = options_beautify
exports.options_to_tds = options_to_tds
exports.open = open
exports.close = close

/**
 * @param {type.constructor_options} option
 * @return {type.constructor_options}
 */
function options_beautify(option) {
    /** @type {type.constructor_options} */
    let connection_option = (!vvs.isEmpty(option)
        ?
        {
            instance: vvs.toString(option.instance, ''),
            login: vvs.toString(option.login, ''),
            password: vvs.toString(option.password, '')
        }
        :
        {
            instance: '',
            login: '',
            password: ''
        }
    )

    let additional = (vvs.isEmpty(option) || vvs.isEmpty(option.additional) ? {} : option.additional)

    let row_name_beauty = vvs.toString(additional.row_name_beauty, 'original')

    connection_option.additional = {
        database: vvs.toString(additional.database, 'tempdb'),
        app_name: vvs.toString(additional.app_name, 'vv-mssql'),
        row_name_beauty: row_name_beauty === 'original' || row_name_beauty === 'first_letter_to_lower' ? row_name_beauty : 'original',
        use_utc: vvs.toBool(additional.use_utc, true),
        encrypt_connection: vvs.toBool(additional.encrypt_connection, false),
        execution_timeout: vvs.toInt(additional.execution_timeout, 0),
        connection_timeout: vvs.toInt(additional.connection_timeout, 15000),
    }
    if (connection_option.additional.execution_timeout < 0) connection_option.additional.execution_timeout = 0
    if (connection_option.additional.connection_timeout < 0) connection_option.additional.connection_timeout = 15000

    if (!vvs.isEmptyString(connection_option.instance)) {
        if (connection_option.instance === '.') {
            connection_option.instance = 'localhost'
        }
        if (connection_option.instance.length > 2 && connection_option.instance.substring(0, 2) === '.\\') {
            connection_option.instance = connection_option.instance = 'localhost\\'.concat(connection_option.instance.substring(2, connection_option.instance.length))
        }
        if (connection_option.instance.length > 2 && connection_option.instance.substring(0, 2) === './') {
            connection_option.instance = connection_option.instance = 'localhost/'.concat(connection_option.instance.substring(2, connection_option.instance.length))
        }
    }
    return connection_option
}

/**
 * @param {type.constructor_options} option
 * @return {tds.ConnectionConfig}
 */
function options_to_tds(option) {
    if (vvs.isEmpty(option)) return undefined

    let sql_authentication = (!vvs.isEmptyString(option.login) && !vvs.isEmptyString(option.password))
    let server = option.instance.split("\\").join("/").split("/")

    /** @type {lib_tds.ConnectionConfig} */
    return {
        server: server[0],
        authentication: {
            type: (sql_authentication ? 'default' : 'ntlm'),
            options: {
                userName: (sql_authentication ? option.login : os.userInfo().username),
                password: (sql_authentication ? option.password : ''),
                domain: (sql_authentication ? '' : os.hostname().toUpperCase()),
            }
        },
        options: {
            appName: option.additional.app_name,
            connectTimeout: option.additional.connection_timeout,
            requestTimeout: option.additional.execution_timeout,
            database: option.additional.database,
            encrypt: option.additional.encrypt_connection,
            instanceName: (server.length > 1 ? server.splice(1, server.length).join("/") : undefined),
            useColumnNames: false,
            useUTC: option.additional.use_utc,
            camelCaseColumns: option.additional.row_name_beauty === 'first_letter_to_lower' ? true : false,
            trustServerCertificate: false,
            // @ts-ignore
            validateBulkLoadParameters: false
        }
    }
}

/**
 * @callback callback_connect
 * @param {Error} error
 * @param {type.connection} connection
 *//**
 * @param {tds.ConnectionConfig} connection_option_tds
 * @param {type.exec_result_end} result_funded
 * @param {callback_connect} callback
 */
function open(connection_option_tds, result_funded, callback) {
    let has_internal_error = false

    if (vvs.isEmpty(connection_option_tds)) {
        callback(new Error('connection not initialized'), undefined)
        return
    }

    /** @type {type.connection} */
    let connection = {
        tds_connection: new tds.Connection(connection_option_tds),
        current_state: {allow_message: true, table_index: -1, query_index: 0}
    }

    connection.tds_connection.on('error', (error) => {
        has_internal_error = true
        close(connection)
        callback(error, undefined)
    })

    connection.tds_connection.on('connect', (error) => {
        if (has_internal_error) {
            return
        }

        connection.tds_connection.on('databaseChange', (database) => {
            result_funded.database = database
        })

        connection.tds_connection.on('infoMessage', (info_message) => {
            if (connection.current_state.allow_message !== true) return
            result_funded.message_list.push({
                type: 'info',
                query_index: connection.current_state.query_index,
                message: info_message.message,
                proc_name: info_message.procName,
                line: info_message.lineNumber
            })
        })

        connection.tds_connection.on('errorMessage', (err_message) => {
            result_funded.message_list.push({
                type: 'error',
                query_index: connection.current_state.query_index,
                message: err_message.message,
                // @ts-ignore
                proc_name: err_message.procName,
                // @ts-ignore
                line: err_message.lineNumber
            })
        })

        // @ts-ignore
        if (!vvs.isEmpty(error) && error.code === 'EINSTLOOKUP') {
            return
        }

        if (!vvs.isEmpty(error)) {
            callback(error, undefined)
        } else {
            callback(undefined, connection)
        }
    })

    // @ts-ignore
    connection.tds_connection.connect()
}

/**
 * @param {type.connection} connection
 */
function close(connection) {
    if (vvs.isEmpty(connection)) return
    if (!vvs.isEmpty(connection.tds_connection)) {
        connection.tds_connection.removeAllListeners('connect')
        connection.tds_connection.removeAllListeners('databaseChange')
        connection.tds_connection.removeAllListeners('infoMessage')
        connection.tds_connection.removeAllListeners('errorMessage')
        connection.tds_connection.close()
        connection.tds_connection = undefined
    }
    connection = undefined
}