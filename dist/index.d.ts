export type app = lib_app;
export type options = {
    /**
     * ms sql instance, examples - 'localhost', 'myserver/myinstance'
     */
    instance: string;
    /**
     * login for ms sql authentication, if need domain authentication, set undefined
     */
    login?: string;
    /**
     * password for ms sql authentication, if need domain authentication, set undefined
     */
    password?: string;
    additional?: type.connection_option_additional;
};
export type exec_result = {
    type: "end" | "spid" | "chunk";
    end?: type.exec_result_end;
    spid?: number;
    chunk?: type.exec_result_chunk;
};
export type exec_result_end = {
    error: Error;
    error_type: "lock" | "connect" | "exec";
    duration: number;
    /**
     * work void exec time (from start to callback end) in msec
     */
    database: string;
    table_list: type.exec_result_table[];
    message_list: type.exec_result_message[];
    query_list: type.exec_query[];
    get_beauty_query: type.function_get_beauty_query;
};
export type exec_result_table = {
    query_index: number;
    table_index: number;
    column_list: type.exec_result_column[];
    row_list: any[];
};
export type exec_lock = {
    database?: string;
    /**
     * lock name
     */
    key: string;
    /**
     * 0 - no wait or time wait in msec
     */
    wait: number;
};
export type row_name_beauty = "original" | "first_letter_to_lower";
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
