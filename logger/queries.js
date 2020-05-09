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
            shared.depot_sch_table('${schema}', '${table}', 'log storage: main table', [
                {name: 'rid', type: 'uniqueidentifier', nullable: false, pk_position: 1, description: 'primary key'},
                {name: 'app', type: 'varchar', nullable: false, len_chars: 20, description: 'log author: app'},
                {name: 'scope', type: 'varchar', nullable: false, len_chars: 10, description: 'log author: scope'},
                {name: 'data', type: 'nvarchar', nullable: false, len_chars: 'max', description: 'message'},
                {name: 'is_error', type: 'bit', nullable: false, description: 'error or debug'},
                {name: 'fdm', type: 'datetime', nullable: false, description: 'date/time create'},
                {name: 'lat', type: 'timestamp', nullable: false},
            ], 'error'),
            shared.depot_sch_table('${schema}', vvs.format("{0}_pipe", '${table}'), 'log storage: pipes', [
                {name: 'parent_rid', type: 'uniqueidentifier', nullable: false, pk_position: 1},
                {name: 'rid', type: 'varchar', nullable: false, len_chars: 100, pk_position: 2},
            ], 'error'),
            shared.depot_sch_table('${schema}', vvs.format("{0}_trace", '${table}'), 'log storage: traces', [
                {name: 'parent_rid', type: 'uniqueidentifier', nullable: false, pk_position: 1},
                {name: 'rid', type: 'varchar', nullable: false, len_chars: 100, pk_position: 2},
                {name: 'data', type: 'nvarchar', nullable: false, len_chars: 'max', description: 'trace'},
                {name: 'order_by', type: 'int', nullable: false},
            ], 'error'),
            shared.depot_sch_foreign(
                '${schema}', vvs.format("{0}_pipe", '${table}'),
                '${schema}', '${table}',
                [{parent_column: 'rid', child_column: 'parent_rid'}],"cascade", "cascade"
            ),
            shared.depot_sch_foreign(
                '${schema}', vvs.format("{0}_trace", '${table}'),
                '${schema}', '${table}',
                [{parent_column: 'rid', child_column: 'parent_rid'}],"cascade", "cascade"
            ),
        ].join(os.EOL)
    }
])

exports.internal_action = internal_action
exports.exec_create_tables = exec_create_tables
// exports.exec_load = exec_load
// exports.query_get_stat = query_get_stat

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