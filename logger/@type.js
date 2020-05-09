//@ts-check
const lib_tds = require('tedious')
function stub () {}

const connection = require('./../connection/app.js')
const connection_type = require('./../connection/@type.js')

exports.stub = stub

/**
 * @typedef env
 * @property {constructor_options} constructor_options
 * @property {env_callback} callback
 */

/**
 * @typedef constructor_options
 * @property {connection} connection where store log
 * @property {string} [schema] table schema name for storage logs, default - 'vv'
 * @property {string} [table] table name for storage logs, default - 'log'
 * @property {string} [app]
 * @property {string} [scope]
 * @property {boolean} [print_to_console]
 */

/**
 * @typedef env_callback
 * @property {env_callback_on_error} [on_error]
 */

/**
 * @callback env_callback_on_error
 * @param {connection_type.exec_result_end} error
 */

/**
  * @callback callback_error
  * @param {Error} error
  */