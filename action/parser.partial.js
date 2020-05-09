//@ts-check

const vvs = require('vv-shared')
const vvms = require('vv-mssql-shared')
const action = require('vv-mssql-action')
const os = require('os')
const REGEX_LIMITS = [new RegExp('\'','g'), new RegExp('"', 'g')]
const ESCAPED_SYMB = ['(', ')', '\'', '"', ',', ';']

exports.text_to_lexems = text_to_lexems
exports.lexems_to_type_scalar = lexems_to_type_scalar
exports.helper_split_array = helper_split_array

/**
 * @param {string} text
 * @returns {string}
 */
function remove_comment(text) {
    if (vvs.isEmptyString(text)) return text
    let find_comment = {find: false}
    let text_without_comment = []
    text.split(os.EOL).forEach(line => {
        let comment_index = line.lastIndexOf('//')
        if (comment_index < 0) {
            text_without_comment.push(line)
            return
        }
        if (comment_index === 0) {
            return
        }

        let maybe_without_comment = line.substring(0, comment_index)

        for (let i = 0; i < REGEX_LIMITS.length; i++) {
            let cnt = (maybe_without_comment.match(REGEX_LIMITS[i]) || []).length
            if (cnt > 0 && cnt % 2 !== 0) {
                text_without_comment.push(line)
                return
            }
        }
        find_comment.find = true
        text_without_comment.push(maybe_without_comment)
    })
    if (find_comment.find === true) {
        return remove_comment(text_without_comment.join(os.EOL))
    }
    return text_without_comment.join(os.EOL)
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function text_to_lexems(text) {
    let text_beauty = text
    let result = []
    let quote = ''
    let bracked = 0
    let line = ''

    let bad_symb = [
        String.fromCharCode(160),   //non-breaking space
        String.fromCharCode(9),     //tab
    ]
    bad_symb.forEach(b_s => {
        text_beauty = vvs.replaceAll(text_beauty, b_s, ' ')
    })
    text_beauty = remove_comment(text_beauty)
    text_beauty = text_beauty.trim()
    text_beauty = vvs.border_del(text_beauty, ",", undefined)
    text_beauty = vvs.border_add(text_beauty, undefined, ",")

    for (let i = 0; i < text_beauty.length; i++) {
        let lexem = text_beauty[i]
        if (lexem === os.EOL) lexem = ' '

        if (lexem === '\\') {
            let next_lexem = (text_beauty.length > i + 1 ? text_beauty[i + 1] : undefined)
            if (!vvs.isEmpty(next_lexem) && ESCAPED_SYMB.includes(next_lexem)) {
                line = line.concat(next_lexem)
                i++
            } else {
                line = line.concat(lexem)
            }
            continue
        }
        if (bracked === 0 && (lexem === '\'' || lexem === '"')) {
            if (quote === '') {
                if (!vvs.isEmptyString(line)) {
                    result.push(line)
                    line = ''
                }
                quote = lexem
                line = line.concat(lexem)
                continue
            }
            if (quote === lexem) {
                quote = ''
                line = line.concat(lexem)
                if (!vvs.isEmptyString(line)) {
                    result.push(line)
                    line = ''
                }
                continue
            }
        }

        if (quote !== '') {
            line = line.concat(lexem)
            continue
        }

        if (lexem === '(') {
            if (bracked === 0) {
                if (!vvs.isEmptyString(line)) {
                    result.push(line)
                    line = ''
                }
            }
            line = line.concat(lexem)
            bracked++
            continue
        }

        if (lexem === ')') {
            bracked--
            line = line.concat(lexem)
            if (bracked === 0) {
                if (!vvs.isEmptyString(line)) {
                    result.push(line)
                    line = ''
                }
            }
            continue
        }

        if (bracked < 0) {
            throw new Error (vvs.format('find inexplicit lexem ")" in param string "{0}" ', text))
        }

        if (bracked === 0 && (lexem === ';' || lexem === ',' || lexem === ' ')) {
            if (!vvs.isEmptyString(line)) {
                result.push(line)
                line = ''
            }
            result.push(lexem)
            continue
        }

        line = line.concat(lexem)
    }

    return result.filter(f => !vvs.isEmptyString(f)).map(m => { return m.trim() })
}

/**
 * @param {string[]} lexems
 * @param {string} [name]
 * @param {string} [type]
 * @returns {action.type_sql_param_scalar}
 */
function lexems_to_type_scalar(lexems, name, type) {
    /** @type {action.type_sql_param_scalar} */
    let result = {
        name: name,
        type: undefined,
        len_chars: undefined,
        precision: undefined,
        scale: undefined,
        nullable: undefined,
        identity: undefined,
        pk_position: undefined,
        description: undefined
    }

    if (vvs.isEmptyString(result.name)) {
        let idx_name = lexems.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
        if (idx_name < 0) {
            throw new Error (vvs.format('can\'t find name for param'))
        }
        result.name = lexems.splice(idx_name, 1)[0]
    }

    let idx_description = lexems.findIndex(f => !vvs.isEmptyString(f) && ['"', '\''].includes(f.substring(0, 1)))
    if (idx_description >= 0) {
        result.description = lexems.splice(idx_description, 1)[0]
        result.description = result.description.substring(1, result.description.length - 1)
    }

    if (!vvs.equal(result.name.substring(0, 1), '*')) {
        if (vvs.isEmptyString(type)) {
            let idx_type = lexems.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
            if (idx_type < 0) {
                throw new Error (vvs.format('can\'t find type for param with name "{0}"', name))
            }
            type = lexems.splice(idx_type, 1)[0]
        }

        if (vvs.equal(type, 'guid')) type = 'uniqueidentifier'
        let sql_type = vvms.helper_get_types_sql().find(f => vvs.equal(type, f.type))
        if (vvs.isEmpty(sql_type)) {
            throw new Error (vvs.format('unknown type "{0}" in param with name "{1}"', [type, result.name]))
        }
        result.type = sql_type.type

        let idx_len = lexems.findIndex(f => !vvs.isEmptyString(f) && ['('].includes(f.substring(0, 1)))
        if (idx_len === 0 || (idx_len > 0 && !vvs.equal(lexems[idx_len - 1], 'identity')) ) {
            let lexem_len = text_to_lexems(vvs.border_del(lexems.splice(idx_len, 1)[0], '(', ')'))
            if (lexem_len.length === 2) {
                result.len_chars = vvs.equal(lexem_len[0], 'max') ? 'max' : vvs.toInt(lexem_len[0])
            } else if (lexem_len.length === 4) {
                result.precision = vvs.toInt(lexem_len[0])
                result.scale = vvs.toInt(lexem_len[2])
            }
        }

        let idx_null = lexems.findIndex(f => !vvs.isEmptyString(f) && vvs.equal(f, 'null'))
        if (idx_null >= 0) {
            let exists_notnull = (idx_null <= 0 ? false : vvs.equal(lexems[idx_null - 1], 'not'))
            if (exists_notnull === true) {
                result.nullable = false
                lexems.splice(idx_null - 1, 2)
            } else {
                result.nullable = true
                lexems.splice(idx_null, 1)
            }
        }

        let idx_identity = lexems.findIndex(f => !vvs.isEmptyString(f) && vvs.equal(f, 'identity'))
        if (idx_identity >= 0) {
            let identity_step_string = (idx_identity + 1 >= lexems.length ? '' : lexems[idx_identity + 1])
            if (!vvs.isEmptyString(identity_step_string)) {
                if (!vvs.equal( vvs.replaceAll(identity_step_string,' ','',true), '(1,1)')) {
                    throw new Error (vvs.format('unsupported identity specification "{0}" in param with name "{1}", supported only "(1,1)"', [identity_step_string, result.name]))
                }
                lexems.splice(idx_identity, 2)
            } else {
                lexems.splice(idx_identity, 1)
            }
            result.identity = true
        }
    }

    if (lexems.length > 0) {
        throw new Error (vvs.format('after parse param with name "{1}" found unsupported substring "{2}"', [result.name, lexems.join(' ')]))
    }

    return result
}

/**
 * @param {Object[]} arr
 * @param {string[]} splitters
 * @returns {Object[][]}
 */
function helper_split_array(arr, splitters) {
    let res = []
    let buf = []
    arr.forEach(item => {
        if (splitters.includes(item)) {
            res.push(buf)
            buf = []
            return
        }
        buf.push(item)
    })
    if (buf.length > 0) {
        res.push(buf)
    }
    return res
}

// /**
//  * @param {string[]} lexems
//  * @returns {action.type_sql_param_scalar}
//  */
// function lexems_to_type_column(lexems) {

//     /** @type {action.type_sql_param_scalar} */
//     let result = {
//         name: undefined,
//         type: undefined,
//         len_chars: undefined,
//         precision: undefined,
//         scale: undefined,
//         nullable: undefined,
//         identity: undefined,
//         pk_position: undefined,
//         description: undefined,
//     }






//     if (vvs.equal(type, 'guid'))

//     if (vvs.equal(type, 'guid')) type = 'uniqueidentifier'
//     let sql_type = vvms.helper_get_types_sql().find(f => vvs.equal(type, f.type))





//     return result
// }