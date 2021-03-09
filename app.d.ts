export = App;
declare class App {
    /**
     * @param {type.constructor_options} options
     */
    constructor(options: type.constructor_options);
    /** @private @type {type.ping_server_info} */
    private _info;
    /** @private @type {type.constructor_options} */
    private _connection_option;
    /** @private @type {tds.ConnectionConfig} */
    private _connection_option_tds;
    /** @private @type {string[]} */
    private _newid_list;
    /**
     * @callback callback_ping
     * @param {Error} error
     */
    /**
     * check connect to MS SQL, load MS SQL server info
     * @param {callback_ping} [callback]
     */
    ping(callback?: callback_ping): void;
    /**
     * return MS SQL info (non empty after exec ping())
     * @returns {type.connection_server_info}
     */
    server_info(): type.connection_server_info;
    /**
     * @callback callback_exec
     * @param {type.exec_result} callback
     */
    /**
     * exec one query or many queries in one batch
     * @param {string|string[]} query
     * @param {type.exec_option} options
     * @param {callback_exec} [callback]
     */
    exec(query: string | string[], options: type.exec_option, callback?: callback_exec): void;
    /**
     * @callback callback_newid
     * @param {Error} error
     * @param {string[]} guid_list
     */
    /**
     * get ms sql generated guid's
     * @param {number} count count guid
     * @param {callback_newid} callback
     */
    newid(count: number, callback: callback_newid): void;
}
declare namespace App {
    export { callback_ping, callback_exec, callback_newid };
}
type callback_ping = (error: Error) => any;
import type = require("./@type.js");
type callback_exec = (callback: type.exec_result) => any;
type callback_newid = (error: Error, guid_list: string[]) => any;
