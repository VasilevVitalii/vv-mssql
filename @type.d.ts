export type constructor_options = {
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
    additional?: connection_option_additional;
    /**
     * work in ping function if ping fail and server name in instance like comp name, find ip for this comp name and change instance. default = 'no'
     */
    beautify_instance?: 'no' | 'check' | 'change';
};
export type type_row_name_beauty = 'original' | 'first_letter_to_lower';
export type connection_option_additional = {
    /**
     * name database for connect, default - 'tempdb'
     */
    database?: string;
    /**
     * app name, which will be visible in MS SQL profiler, default - 'vv-mssql'
     */
    app_name?: string;
    /**
     * default - true
     */
    use_utc?: boolean;
    /**
     * default - 'original'
     */
    row_name_beauty?: type_row_name_beauty;
    /**
     * connection timeout in milliseconds, default - 15000
     */
    connection_timeout?: number;
    /**
     * execution timeout in milliseconds, default - 0 (infinity)
     */
    execution_timeout?: number;
    /**
     * encrypt connection, default - false
     */
    encrypt_connection?: boolean;
};
export type ping_server_info = {
    /**
     * MS SQL Server version
     */
    version: string;
    /**
     * OS timezone (in minutes), where MS SQL running, examples:  +180 = Saint-Petersburg, +120 = Paris, 0 = London, -300 = New York
     */
    timezone: number;
    /**
     * time (in millisecond) for sucess connect to MS SQL and exec small simpe query
     */
    ping_duration_msec: number;
    instance_ip: string;
};
/**
 * s
 */
export type connection_server_info = {
    ping: ping_server_info;
    connection: constructor_options;
};
export type connection = {
    tds_connection: any;
    current_state: connection_current_state;
};
export type connection_current_state = {
    allow_message: boolean;
    table_index: number;
    query_index: number;
};
export type exec_option = {
    /**
     * use this database before start query
     */
    database?: string;
    /**
     * get spid, for (example) kill process, default - false
     */
    get_spid?: boolean;
    /**
     * chunked return result, default - undefined (off)
     */
    chunk?: exec_chunk;
    /**
     * protect competitive exec query, based on sp_getapplock, default - undefined (off)
     */
    lock?: exec_lock;
    /**
     * for exec many queries in one batch - if in step error exists, next steps not run, default - true
     */
    stop_on_error?: boolean;
    /**
     * convert null in cell to undefined, default - false
     */
    null_to_undefined?: boolean;
    /**
     * read dataset result to array of tables, default - true
     */
    allow_tables?: boolean;
};
export type exec_query = {
    type: 'query' | 'get_spid' | 'database' | 'lock';
    query: string;
    query_index?: number;
    /**
     * query exec time in msec
     */
    duration?: number;
    /**
     * event 'columnMetadata' (with function column_list_beautify) work time in msec
     */
    duration_beautify_columns?: number;
    /**
     * event 'row' (with function row_beautify_function) work time in msec
     */
    duration_beautify_rows?: number;
    error?: Error;
    error_type?: 'connect' | 'exec' | 'lock';
};
/**
 * sp_getapplock
 */
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
export type exec_chunk = {
    type: 'row' | 'msec';
    chunk: number;
};
export type exec_result = {
    type: 'end' | 'spid' | 'chunk';
    end?: exec_result_end;
    spid?: number;
    chunk?: exec_result_chunk;
};
export type function_get_beauty_query = (kind: 'actual' | 'estimate') => string;
export type exec_result_end = {
    error: Error;
    error_type: 'connect' | 'exec' | 'lock';
    duration: number;
    /**
     * work void exec time (from start to callback end) in msec
     */
    database: string;
    table_list: exec_result_table[];
    message_list: exec_result_message[];
    query_list: exec_query[];
    get_beauty_query: function_get_beauty_query;
};
export type exec_result_table = {
    query_index: number;
    table_index: number;
    column_list: exec_result_column[];
    row_list: any[];
};
export type exec_result_column = {
    name: string;
    name_original: string;
    type: string;
    jstype: string;
    len: number;
    len_chars: number;
    scale: number;
    precision: number;
    declararion: string;
    nullable: boolean;
    identity: boolean;
    readonly: boolean;
};
export type exec_result_message = {
    type: 'info' | 'error';
    query_index: number;
    message: string;
    proc_name: string;
    line: number;
};
export type exec_result_chunk = {
    table: exec_result_table;
    message_list: exec_result_message[];
};
export function stub(): void;
