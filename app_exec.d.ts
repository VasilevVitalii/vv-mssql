export type type_duration_row = {
    table_index: number;
    duration: number;
};
export type callback_exec = (callback: type.exec_result) => any;
export type type_column_list_beautify = {
    column_list: type.exec_result_column[];
    row_beautify_function: Function;
};
/**
 * @typedef type_duration_row
 * @property {number} table_index
 * @property {number} duration
 */
/**
 * @callback callback_exec
 * @param {type.exec_result} callback
 */ /**
* @param {type.connection} connection
* @param {type.exec_result_end} result_funded
* @param {type.exec_option} exec_option
* @param {number} last_table_chunk_index
* @param {callback_exec} callback
*/
export function exec(connection: type.connection, result_funded: type.exec_result_end, exec_option: type.exec_option, last_table_chunk_index: number, callback: callback_exec): void;
/**
 * @param {type.exec_option} exec_option
 * @returns {type.exec_option}
 */
export function exec_option_beautify(exec_option: type.exec_option): type.exec_option;
/**
 * @param {type.exec_result_end} exec_result_end
 * @param {type.exec_option} options
 */
export function add_function_get_beauty_query(exec_result_end: type.exec_result_end, options: type.exec_option): void;
import type = require("./@type.js");
