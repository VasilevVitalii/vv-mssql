//@ts-check

const vvs = require('vv-shared')
const vvms = require('vv-mssql-shared')
const action = require('vv-mssql-action')
const os = require('os')
const partial = require('./parser.partial.js')

/**
 * @param {string} text
 * @returns {action.type_sql_param[]}
 */
function sql_param_from_raw (text) {
    /** @type {action.type_sql_param[]} */
    let result = []
    /** @type {string[][]} */
    let lexems = []
    let lexem = []

    partial.text_to_lexems(text).forEach(line => {
        if (line === ';' || line === ',') {
            lexems.push(lexem)
            lexem = []
            return
        }
        lexem.push(line)
    })

    let idx = -1
    lexems.forEach((lexem, index) => {
        idx = lexem.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
        if (idx < 0) {
            throw new Error (vvs.format('can\'t find name for param #{0}(first param = 0) in text {1}', [index, text]))
        }

        let name = lexem[idx]
        lexem[idx] = ''

        idx = lexem.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
        if (idx < 0) {
            throw new Error (vvs.format('can\'t find type for param #{0}(first param = 0) in text {1}', [index, text]))
        }

        let type = lexem[idx]
        lexem[idx] = ''

        if (vvs.equal(type, 'table')) {

        } else {
            if (vvs.equal(type, 'guid')) type = 'uniqueidentifier'
            let sql_type = vvms.helper_get_types_sql().find(f => vvs.equal(type, f.type))
            if (vvs.isEmpty(sql_type)) {
                throw new Error (vvs.format('unknown type {0} in param #{1}(first param = 0) in text {2}', [type, index, text]))
            }

            result.push({
                type: 'scalar',
                scalar: {
                    name: name,
                    type: sql_type.type,
                    description: undefined,
                    len_chars: undefined,
                    nullable: undefined,
                    precision: undefined,
                    scale: undefined
                }
            })
        }

        let a = 5
    })

    return result
}

let a = 'aa\'bb'

let aaaaaa = sql_param_from_raw([
    '#rid1 table(f1 decimal(14,3) "это поле 1"; f2 nvarchar(max) "это поле 2", f3 int not null identity(1,1));',
    '@rid varchar(MAX) //not null'].join(os.EOL))
let b = 5