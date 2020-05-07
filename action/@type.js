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
 * @property {env_constructor_options_target} target where action will work
 * @property {env_constructor_options_store} [store] if action store in MS SQL
 */

/**
 * @typedef env_constructor_options_target
 * @property {connection} connection connection to MS SQL
 */

/**
 * @typedef env_constructor_options_store
 * @property {connection} connection connection to MS SQL
 * @property {string} [schema] table schema name for storage actions, default - 'vv'
 * @property {string} [table] table name for storage actions, default - 'action'
 * @property {number} [time_reload_store_sec] timeout (in seconds) reload actions for ensure their relevance, default = 60
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
