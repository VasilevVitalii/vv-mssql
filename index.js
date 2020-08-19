//@ts-check
const vvs = require('vv-shared')
const lib_app = require('./app.js')
const type = require('./@type.js')

exports.create = create
exports.options_beautify = options_beautify

/**
 * @typedef {lib_app} app
 */
/**
 * @typedef {type.constructor_options} options
 */
/**
 * @typedef {type.exec_result} exec_result
 */
/**
 * @typedef {type.exec_result_end} exec_result_end
 */
/**
 * @typedef {type.exec_result_table} exec_result_table
 */
/**
 * @typedef {type.exec_lock} exec_lock
 */

/**
 * @param {options} [options]
 */
function create(options) {
    return new lib_app(options)
}

/**
 * convert object or string with object to options
 * @param {Object|string} raw raw options
 * @param {boolean} [example]   //write in empty properties example data
 * @returns {type.constructor_options}
 */
function options_beautify(raw, example) {
    example = vvs.toBool(example, false)

    /** @type {type.constructor_options} */
    let options = {
        login: example ? 'sa' : null,
        password: example ? 'password for sa' : null,
        instance: example ? '192.168.0.1\\instance1' : null,
        additional: {
            app_name: example ? 'vv-mssql' : null,
            database: example ? 'tempdb' : null,
            connection_timeout: example ? 15000 : null,
            execution_timeout: example ? 0 : null,
            encrypt_connection: example ? false : null,
            use_utc: example ? true : null,
        }
    }
    if (vvs.isEmpty(raw)) return options

    let object_raw = typeof raw === 'string' ? JSON.parse(raw) : raw

    options.login = vvs.findPropertyValueInObject(object_raw, 'login', options.login)
    options.password = vvs.findPropertyValueInObject(object_raw, 'password', options.password)
    options.instance = vvs.findPropertyValueInObject(object_raw, 'instance', options.instance)
    options.additional.app_name = vvs.findPropertyValueInObject(object_raw, ['additional', 'app_name'], options.additional.app_name)
    options.additional.database = vvs.findPropertyValueInObject(object_raw, ['additional', 'database'], options.additional.database)
    options.additional.connection_timeout = vvs.findPropertyValueInObject(object_raw, ['additional', 'connection_timeout'], options.additional.connection_timeout)
    options.additional.execution_timeout = vvs.findPropertyValueInObject(object_raw, ['additional', 'execution_timeout'], options.additional.execution_timeout)
    options.additional.encrypt_connection = vvs.findPropertyValueInObject(object_raw, ['additional', 'encrypt_connection'], options.additional.encrypt_connection)
    options.additional.use_utc = vvs.findPropertyValueInObject(object_raw, ['additional', 'use_utc'], options.additional.use_utc)
    return options
}