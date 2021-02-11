export type callback_connect = (error: Error, connection: type.connection) => any;
/**
 * @param {type.constructor_options} option
 * @return {type.constructor_options}
 */
export function options_beautify(option: type.constructor_options): type.constructor_options;
/**
 * @param {type.constructor_options} option
 * @return {tds.ConnectionConfig}
 */
export function options_to_tds(option: type.constructor_options): any;
/**
 * @callback callback_connect
 * @param {Error} error
 * @param {type.connection} connection
 */ /**
* @param {tds.ConnectionConfig} connection_option_tds
* @param {type.exec_result_end} result_funded
* @param {callback_connect} callback
*/
export function open(connection_option_tds: any, result_funded: type.exec_result_end, callback: callback_connect): void;
/**
 * @param {type.connection} connection
 */
export function close(connection: type.connection): void;
import type = require("./@type.js");
