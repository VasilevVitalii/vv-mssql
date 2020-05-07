//@ts-check

const os = require('os')
const vvs = require('vv-shared')
const shared = require('vv-mssql-shared')
const type = require('./@type.js')
const connection = require('./../connection/app.js')
const connection_type = require('./../connection/@type.js')

exports.query_create_tables = query_create_tables
exports.query_get_stat = query_get_stat
exports.query_load = query_load

/**
 * @callback callback_query_create_tables
 * @param {connection_type.exec_result_end} callback_exec
 */
/**
 * create tables for storage actions in ms sql
 * @param {connection} connection
 * @param {string} schema
 * @param {string} table
 * @param {callback_query_create_tables} [callback]
 */
function query_create_tables(connection, schema, table, callback) {
    if (vvs.isEmpty(connection)) {
        if (vvs.isFunction(callback)) {
            callback(undefined)
        }
        return
    }

    schema = vvs.border_del(schema, '[', ']')
    table = vvs.border_del(table, '[', ']')

    let query = [
        shared.depot_sch_schema(schema),
        shared.depot_sch_table(schema, table, 'action storage', [
            {name: 'rid', type: 'varchar', nullable: false, len_chars: 100, pk_position: 1, description: 'primary key'},
            {name: 'fdm', type: 'datetime', nullable: false, description: 'date/time create'},
            {name: 'ldm', type: 'datetime', nullable: false, description: 'date/time last modify'},
            {name: 'lat', type: 'timestamp', nullable: false},
            {name: 'apps', type: 'nvarchar', nullable: true, len_chars: 'max', description: 'app list, format - {app1}{app2}'},
            {name: 'tags', type: 'nvarchar', nullable: true, len_chars: 'max', description: 'tag list, format - {tag1}{tag2}'},
            {name: 'title', type: 'nvarchar', nullable: true, len_chars: 200},
            {name: 'note', type: 'nvarchar', nullable: true, len_chars: 'max'},
            {name: 'sql_script', type: 'nvarchar', nullable: true, len_chars: 'max'},
            {name: 'sql_param', type: 'nvarchar', nullable: true, len_chars: 'max'},
            {name: 'sql_param_note', type: 'nvarchar', nullable: true, len_chars: 'max'},
            {name: 'sql_lock', type: 'varchar', nullable: true, len_chars: 100},
            {name: 'sql_lock_wait', type: 'int', nullable: true},
            {name: 'sql_lock_message', type: 'nvarchar', nullable: true, len_chars: 'max'},
            {name: 'preprocessor', type: 'nvarchar', nullable: true, len_chars: 'max', description: 'js function for request data before use it as query params'},
            {name: 'postprocessor', type: 'nvarchar', nullable: true, len_chars: 'max', description: 'js function for query result before reply'},
        ], 'error'),
        shared.depot_sch_table(schema, vvs.format("{0}_eav", table), 'additional info for action storage', [
            {name: 'parent_rid', type: 'varchar', nullable: false, len_chars: 100, pk_position: 1, description: 'link to action'},
            {name: 'rid', type: 'varchar', nullable: false, len_chars: 100, pk_position: 2, description: 'key'},
            {name: 'data', type: 'nvarchar', nullable: false, len_chars: 'max', description: 'info'}
        ], 'error'),
        shared.depot_sch_foreign(
            schema, vvs.format("{0}_eav", table),
            schema, table,
            [{parent_column: 'rid', child_column: 'parent_rid'}],"cascade", "cascade"
        )
    ].join(os.EOL)

    connection.exec(query, undefined, callback_exec => {
        if (callback_exec.type !== 'end') return
        if (vvs.isFunction(callback)) {
            callback(callback_exec.end)
        }
    })
}

/**
 * ms sql script for get state storage actions for to understand if stored data has changed
 * @param {string} [name_schema] ms sql schema name, default = 'dbo'
 * @param {string} [name_prefix_table] ms sql prefix for tables, default = 'action'
 * @return {string}
 */
function query_get_stat(name_schema, name_prefix_table) {
    let schema = name_schema_bautify(name_schema)
    let prefix_table = name_prefix_table_bautify(name_prefix_table)
    return vvs.format("SELECT COUNT(*) cnt, MAX(lat) lat FROM [{0}].[{1}]", [schema, prefix_table])
}

/**
 * ms sql script for load actions from ms msl tables
 * @param {string} [name_schema] ms sql schema name, default = 'dbo'
 * @param {string} [name_prefix_table] ms sql prefix for tables, default = 'action'
 * @param {boolean} [load_eav] default = 'false'
 * @param {string|string[]} [rids]
 * @return {string}
 */
function query_load(name_schema, name_prefix_table, load_eav, rids) {
    let rid_list = vvs.toArray(rids)

    let schema = name_schema_bautify(name_schema)
    let prefix_table = name_prefix_table_bautify(name_prefix_table)


    let filter_by_rids = ""
    let filter_by_parent_rids = ""
    if (rid_list.length > 0) {
        filter_by_rids = vvs.format(" WHERE [rid] IN ({0}) ", rid_list.map(m => { return shared.helper_js_to_sql(m, 'varchar') }).join(","))
        filter_by_parent_rids = vvs.format(" WHERE [parent_rid] IN ({0}) ", rid_list.map(m => { return shared.helper_js_to_sql(m, 'varchar') }).join(","))
    }
    let query = [vvs.format("SELECT [rid], [fdm], [ldm], [lat], [tags], [title], [note], [sql_script], [sql_param], [sql_param_note], [sql_lock], [sql_lock_wait], [sql_lock_message], [result_table], [result_postprocessor] FROM [{0}].[{1}] {2} ORDER BY [rid]", [schema, prefix_table, filter_by_rids])]
    if (load_eav === true) {
        query.push(vvs.format("SELECT [parent_rid], [rid], [data] FROM [{0}].[{1}_eav] {2} ORDER BY [parent_rid], [rid]", [schema, prefix_table, filter_by_parent_rids]))
    }

    return query.join(os.EOL)
}

/**
 * @param {string} name_schema
 * @returns {string}
 */
function name_schema_bautify (name_schema) {
    return (vvs.isEmptyString(name_schema) ? 'dbo' : vvs.border_del(name_schema, '[', ']'))
}

/**
 * @param {string} name_prefix_table
 * @returns {string}
 */
function name_prefix_table_bautify(name_prefix_table) {
    return (vvs.isEmptyString(name_prefix_table) ? 'action' : vvs.border_del(name_prefix_table, '[', ']'))
}