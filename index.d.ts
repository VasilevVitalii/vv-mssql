export type app = lib_app;
export type options = type.constructor_options;
export type exec_result = type.exec_result;
export type exec_result_end = type.exec_result_end;
export type exec_result_table = type.exec_result_table;
export type exec_lock = type.exec_lock;
export type row_name_beauty = type.type_row_name_beauty;
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
 * @typedef {type.type_row_name_beauty} row_name_beauty
 */
/**
 * @param {options} [options]
 */
export function create(options?: options): lib_app;
/**
 * convert object or string with object to options
 * @param {Object|string} raw raw options
 * @param {boolean} [example]   //write in empty properties example data
 * @returns {type.constructor_options}
 */
export function options_beautify(raw: any | string, example?: boolean): type.constructor_options;
import lib_app = require("./app.js");
import type = require("./@type.js");
