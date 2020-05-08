//@ts-check

const os = require('os')
const vvs = require('vv-shared')
const shared = require('vv-mssql-shared')
const lib_action = require('vv-mssql-action')
const type = require('./@type.js')
const connection = require('./../connection/app.js')
const connection_type = require('./../connection/@type.js')

let internal_action = new lib_action()
internal_action.add([
    {
        key: 'create_tables',
        sql_script: [
            shared.depot_sch_schema('${schema}'),
            shared.depot_sch_table('${schema}', '${table}', 'action storage', [
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
            shared.depot_sch_table('${schema}', vvs.format("{0}_eav", '${table}'), 'additional info for action storage', [
                {name: 'parent_rid', type: 'varchar', nullable: false, len_chars: 100, pk_position: 1, description: 'link to action'},
                {name: 'rid', type: 'varchar', nullable: false, len_chars: 100, pk_position: 2, description: 'key'},
                {name: 'data', type: 'nvarchar', nullable: false, len_chars: 'max', description: 'info'}
            ], 'error'),
            shared.depot_sch_foreign(
                '${schema}', vvs.format("{0}_eav", '${table}'),
                '${schema}', '${table}',
                [{parent_column: 'rid', child_column: 'parent_rid'}],"cascade", "cascade"
            )
        ].join(os.EOL)
    },
    {
        key: 'load_filtered',
        sql_script: [
            "DECLARE @r TABLE ([rid] VARCHAR(100) NOT NULL PRIMARY KEY)",
            "INSERT INTO @r(rid) SELECT [rid] FROM [${schema}].[${table}] WITH (NOLOCK)",
            "WHERE (NOT EXISTS (SELECT TOP 1 * FROM #rid) OR [rid] IN (SELECT [rid] FROM #rid))",
            "   OR (NOT EXISTS (SELECT TOP 1 * FROM #tag) OR [rid] IN (SELECT DISTINCT r.[rid] FROM [${schema}].[${table}] r WITH (NOLOCK) JOIN #tag t ON r.tags LIKE '%' + t.tag + '%'))",
            "   OR (NOT EXISTS (SELECT TOP 1 * FROM #app) OR [rid] IN (SELECT DISTINCT r.[rid] FROM [${schema}].[${table}] r WITH (NOLOCK) JOIN #app t ON r.apps LIKE '%' + t.app + '%'))",
            "SELECT [rid],[fdm],[ldm],[lat],[apps],[tags],[title],[note],[sql_script],[sql_param],[sql_param_note],[sql_lock],[sql_lock_wait],[sql_lock_message],[preprocessor],[postprocessor]",
            "FROM [${schema}].[${table}] WITH (NOLOCK) WHERE [rid] IN (SELECT [rid] FROM @r) ORDER BY [rid]",
            "IF @load_eav = 1 BEGIN",
            "   SELECT [parent_rid], [rid], [data] FROM [${schema}].[${table}_eav] WHERE [parent_rid] IN (SELECT rid FROM @r) ORDER BY [parent_rid], [rid]",
            "END"
        ].join(os.EOL),
        sql_param_list: [
            {type: 'scalar', scalar: {name: 'load_eav', type: 'bit', nullable: false}},
            {type: 'table', table: {name: 'rid', column_list: [{name: 'rid', type: 'varchar', len_chars: 100, nullable: false, pk_position: 1}]}},
            {type: 'table', table: {name: 'tag', column_list: [{name: 'tag', type: 'varchar', len_chars: 'max', nullable: false, pk_position: 1}]}},
            {type: 'table', table: {name: 'app', column_list: [{name: 'app', type: 'varchar', len_chars: 'max', nullable: false, pk_position: 1}]}},
        ]
    },
    {
        key: 'load_all',
        sql_script: [
            "SELECT [rid],[fdm],[ldm],[lat],[apps],[tags],[title],[note],[sql_script],[sql_param],[sql_param_note],[sql_lock],[sql_lock_wait],[sql_lock_message],[preprocessor],[postprocessor]",
            "FROM [${schema}].[${table}] WITH (NOLOCK) ORDER BY [rid]",
            "IF @load_eav = 1 BEGIN",
            "   SELECT [parent_rid], [rid], [data] FROM [${schema}].[${table}_eav] ORDER BY [parent_rid], [rid]",
            "END"
        ].join(os.EOL),
        sql_param_list: [
            {type: 'scalar', scalar: {name: 'load_eav', type: 'bit', nullable: false}}
        ]
    }
])

exports.internal_action = internal_action
exports.exec_create_tables = exec_create_tables
exports.exec_load = exec_load
exports.query_get_stat = query_get_stat

/**
 * @callback callback_exec_create_tables
 * @param {connection_type.exec_result_end} callback_exec
 */
/**
 * @param {connection} connection
 * @param {callback_exec_create_tables} [callback]
 */
function exec_create_tables(connection, callback) {
    if (vvs.isEmpty(connection)) {
        if (vvs.isFunction(callback)) {
            callback(undefined)
        }
        return
    }

    let action = internal_action.get('create_tables')
    if (vvs.isEmpty(action)) {
        if (vvs.isFunction(callback)) {
            callback(undefined)
        }
        return
    }

    connection.exec(internal_action.query(action, undefined), undefined, callback_exec => {
        if (callback_exec.type !== 'end') return
        if (vvs.isFunction(callback)) {
            callback(callback_exec.end)
        }
    })
}

/**
 * @callback callback_exec_load
 * @param {connection_type.exec_result_end} callback_exec
 */
/**
 * @param {connection} connection
 * @param {boolean} load_eav default = 'false'
 * @param {string|string[]} [apps] without '{','}'
 * @param {string|string[]} [tags] without '{','}'
 * @param {string|string[]} [rids]
 * @param {callback_exec_load} callback
 */
function exec_load(connection, load_eav, apps, tags, rids, callback) {
    let apps_list = vvs.toArray(apps).filter(f => !vvs.isEmptyString(f)).map(m => { return {app: vvs.border_add(m, '{', '}') }})
    let tags_list = vvs.toArray(tags).filter(f => !vvs.isEmptyString(f)).map(m => { return {tag: vvs.border_add(m, '{', '}') }})
    let rid_list = vvs.toArray(rids).filter(f => !vvs.isEmptyString(f)).map(m => { return {rid: vvs.border_add(m, '{', '}') }})

    let action = internal_action.get((apps_list.length === 0 && tags_list.length === 0 && rid_list.length === 0 ? 'load_all' : 'load_filtered'))
    if (vvs.isEmpty(action)) {
        if (vvs.isFunction(callback)) {
            callback(undefined)
        }
        return
    }

    connection.exec(internal_action.query(action, {load_eav: vvs.toBool(load_eav, false), app: apps_list, tag: tags_list, rid: rid_list}), undefined, callback_exec => {
        if (callback_exec.type !== 'end') return
        if (!vvs.isEmpty(callback_exec.end.error)) {
            if (vvs.isFunction(callback)) {
                callback(callback_exec.end)
            }
            return
        }
        /** @type {type.action[]} */
        let action_raw_list = []
        callback_exec.end.table_list[0].row_list.forEach(row => {
            action_raw_list.push({
                key: vvs.toString(vvs.findPropertyValueInObject(row, 'rid')),
                storage: {
                    fdm: vvs.toDate(vvs.findPropertyValueInObject(row, 'fdm')),
                    ldm: vvs.toDate(vvs.findPropertyValueInObject(row, 'ldm')),
                    app_list: vvs.split(vvs.toString(vvs.findPropertyValueInObject(row, 'apps')), '{', '}', 'collapse_with_lower'),
                    tag_list: vvs.split(vvs.toString(vvs.findPropertyValueInObject(row, 'tags')), '{', '}', 'collapse_with_lower'),
                    postprocessor: undefined,
                    preprocessor: undefined,
                    sql_lock: vvs.toString(vvs.findPropertyValueInObject(row, 'sql_lock')),
                    sql_param: vvs.toString(vvs.findPropertyValueInObject(row, 'sql_param')),
                    sql_param_note: vvs.toString(vvs.findPropertyValueInObject(row, 'sql_param_note')),
                    eav: []
                },
                title: vvs.toString(vvs.findPropertyValueInObject(row, 'title')),
                description: vvs.toString(vvs.findPropertyValueInObject(row, 'description')),
                sql_script: vvs.toString(vvs.findPropertyValueInObject(row, 'sql_script'))
            })
        })

        callback_exec.end.table_list[1].row_list.forEach(row => {
            let parent_rid = vvs.toString(vvs.findPropertyValueInObject(row, 'parent_rid'))
            let action = action_raw_list.find(f => vvs.equal(f.key, parent_rid))
            if (vvs.isEmpty(action)) return
            action.storage.eav.push({
                rid: vvs.toString(vvs.findPropertyValueInObject(row, 'rid')),
                data: vvs.toString(vvs.findPropertyValueInObject(row, 'data'))
            })
        })

        let a = action_raw_list

        /** @type {type.action} */
        let b = undefined

        //TODO work from this!
        //work from this!
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