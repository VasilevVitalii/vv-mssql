// @ts-check
const lib_tds = require('tedious')
function stub () {}

exports.stub = stub

/**
 * @typedef constructor_options
 * @property {string} instance ms sql instance, examples - 'localhost', 'myserver/myinstance'
 * @property {string} [login] login for ms sql authentication, if need domain authentication, set undefined
 * @property {string} [password] password for ms sql authentication, if need domain authentication, set undefined
 * @property {connection_option_additional} [additional]
 * @property {'no' | 'check' | 'change'} [beautify_instance] work in ping function if ping fail and server name in instance like comp name, find ip for this comp name and change instance. default = 'no'
 */

/**
 * @typedef {'original'|'first_letter_to_lower'} type_row_name_beauty
 */

/**
 * @typedef connection_option_additional
 * @property {string} [database] name database for connect, default - 'tempdb'
 * @property {string} [app_name] app name, which will be visible in MS SQL profiler, default - 'vv-mssql'
 * @property {boolean} [use_utc] default - true
 * @property {type_row_name_beauty} [row_name_beauty] default - 'original'
 * @property {number} [connection_timeout] connection timeout in milliseconds, default - 15000
 * @property {number} [execution_timeout] execution timeout in milliseconds, default - 0 (infinity)
 * @property {boolean} [encrypt_connection] encrypt connection, default - false
 */

/**
 * @typedef ping_server_info
 * @property {string} version MS SQL Server version
 * @property {number} timezone OS timezone (in minutes), where MS SQL running, examples:  +180 = Saint-Petersburg, +120 = Paris, 0 = London, -300 = New York
 * @property {number} ping_duration_msec time (in millisecond) for sucess connect to MS SQL and exec small simpe query
 * @property {string} instance_ip
 */
/**s
 * @typedef connection_server_info
 * @property {ping_server_info} ping
 * @property {constructor_options} connection
 */

//#region connection
/**
 * @private
 * @typedef connection
 * @property {lib_tds.Connection} tds_connection
 * @property {connection_current_state} current_state
 */

/**
 * @private
 * @typedef connection_current_state
 * @property {boolean} allow_message
 * @property {number} table_index
 * @property {number} query_index
 */
//#endregion

//#region go exec

/**
 * @typedef exec_option
 * @property {string} [database] use this database before start query
 * @property {boolean} [get_spid] get spid, for (example) kill process, default - false
 * @property {exec_chunk} [chunk] chunked return result, default - undefined (off)
 * @property {exec_lock} [lock] protect competitive exec query, based on sp_getapplock, default - undefined (off)
 * @property {boolean} [stop_on_error] for exec many queries in one batch - if in step error exists, next steps not run, default - true
 * @property {boolean} [null_to_undefined] convert null in cell to undefined, default - false
 */

/**
 * @typedef exec_query
 * @property {'query'|'get_spid'|'database'|'lock'} type
 * @property {string} query
 * @property {number} [query_index]
 * @property {number} [duration] query exec time in msec
 * @property {number} [duration_beautify_columns] event 'columnMetadata' (with function column_list_beautify) work time in msec
 * @property {number} [duration_beautify_rows] event 'row' (with function row_beautify_function) work time in msec
 * @property {Error} [error]
 * @property {'connect'|'exec'|'lock'} [error_type]
 */

/**
 * @typedef exec_lock sp_getapplock
 * @property {string} [database]
 * @property {string} key lock name
 * @property {number} wait 0 - no wait or time wait in msec
 */

/**
 * @typedef exec_chunk
 * @property {'row'|'msec'} type
 * @property {number} chunk
 */

//#endregion

/**
 * @typedef exec_result
 * @property {'end'|'spid'|'chunk'} type
 * @property {exec_result_end} [end]
 * @property {number} [spid]
 * @property {exec_result_chunk} [chunk]
 */

/**
 * @callback function_get_beauty_query
 * @param {'actual'|'estimate'} kind
 * @returns {string}
 */

/**
 * @typedef exec_result_end
 * @property {Error} error
 * @property {'connect'|'exec'|'lock'} error_type
 * @property {number} duration
 * @property {string} database work void exec time (from start to callback end) in msec
 * @property {exec_result_table[]} table_list
 * @property {exec_result_message[]} message_list
 * @property {exec_query[]} query_list
 * @property {function_get_beauty_query} get_beauty_query
 */

/**
 * @typedef exec_result_table
 * @property {number} query_index
 * @property {number} table_index
 * @property {exec_result_column[]} column_list
 * @property {Object[]} row_list
 */

/**
 * @typedef exec_result_column
 * @property {string} name
 * @property {string} name_original
 * @property {string} type
 * @property {string} jstype
 * @property {number} len
 * @property {number} len_chars
 * @property {number} scale
 * @property {number} precision
 * @property {string} declararion
 * @property {boolean} nullable
 * @property {boolean} identity
 * @property {boolean} readonly
 */

/**
 * @typedef exec_result_message
 * @property {'info'|'error'} type
 * @property {number} query_index
 * @property {string} message
 * @property {string} proc_name
 * @property {number} line
 */

/**
 * @typedef exec_result_chunk
 * @property {exec_result_table} table
 * @property {exec_result_message[]} message_list
 */