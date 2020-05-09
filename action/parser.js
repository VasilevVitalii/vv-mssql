//@ts-check

const vvs = require('vv-shared')
//const vvms = require('vv-mssql-shared')
const action = require('vv-mssql-action')
//const os = require('os')
const partial = require('./parser.partial.js')

exports.sql_param_from_raw = sql_param_from_raw

/**
 * @param {string} text
 * @returns {action.type_sql_param[]}
 */
function sql_param_from_raw (text) {
    /** @type {action.type_sql_param[]} */
    let result = []

    let lexems = partial.helper_split_array(partial.text_to_lexems(text), [';', ',']).filter(f => f.length > 0)

    lexems.forEach((lexem, index) => {
        let idx_name = lexem.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
        if (idx_name < 0) {
            throw new Error (vvs.format('can\'t find name for param #{0}(first param = 0) in text {1}', [index, text]))
        }
        let name = lexem.splice(idx_name, 1)[0]

        let idx_type = lexem.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
        if (idx_type < 0) {
            throw new Error (vvs.format('can\'t find type for param #{0}(first param = 0) in text {1}', [index, text]))
        }
        let type = lexem.splice(idx_type, 1)[0]

        if (vvs.equal(type, 'table')) {
            /** @type {action.type_sql_param} */
            let param = {
                type: 'table',
                table: {
                    name: name,
                    column_list: []
                }
            }

            let idx_description = lexem.findIndex(f => !vvs.isEmptyString(f) && ['"', '\''].includes(f.substring(0, 1)))
            if (idx_description >= 0) {
                param.table.description = lexem.splice(idx_description, 1)[0]
                param.table.description = param.table.description.substring(1, param.table.description.length - 1)
            }

            let idx_columns = lexem.findIndex(f => !vvs.isEmptyString(f) && ["("].includes(f.substring(0, 1)))
            if (idx_columns < 0) {
                throw new Error (vvs.format('can\'t find columns for table param #{0}(first param = 0) in text {1}', [index, text]))
            }
            let lexem_column =  partial.text_to_lexems(vvs.border_del(lexem.splice(idx_columns, 1)[0], '(', ')'))
            let lexems_column = partial.helper_split_array(lexem_column, [';', ','])
            lexems_column.forEach(column => {
                let scalar = partial.lexems_to_type_scalar(column)
                let fnd_exists = param.table.column_list.findIndex(f => vvs.equal(f.name, scalar.name))
                if (fnd_exists >= 0) {
                    param.table.column_list.splice(fnd_exists, 1)
                }
                param.table.column_list.push(scalar)
            })

            result.push(param)
        } else {
            /** @type {action.type_sql_param} */
            let param = {
                type: 'scalar',
                scalar: partial.lexems_to_type_scalar(lexem, name, type)
            }

            result.push(param)
        }
    })

    return result
}

// let a = 'aa\'bb'

// let aaaaaa = sql_param_from_raw([
//     '"тут" #rid1  table(*dbo.t "это постоянка" ,   f1 decimal(14,3) "это поле 1"; f2 nvarchar "это поле 2",  f3 decimal (10, 0) identity( 1 , 1 ) not null ); //aaaaaa',
//     '@rid varchar(MAX); //not null'].join(os.EOL))
// let b = 5