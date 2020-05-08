//@ts-check

const vvs = require('vv-shared')
//const vvms = require('vv-mssql-shared')
const action = require('vv-mssql-action')
const os = require('os')
const REGEX_LIMITS = [new RegExp('\'','g'), new RegExp('"', 'g')]
const ESCAPED_SYMB = ['(', ')', '\'', '"', ',', ';']

exports.text_to_lexems = text_to_lexems

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
 * @returns {action.type_sql_param}
 */
function lexems_to_type(lexems) {
    /** @type {action.type_sql_param} */
    let result = {
        type: undefined,
        scalar: undefined,
        table: undefined
    }

    let idx_name = lexems.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
    if (idx_name < 0) {
        throw new Error (vvs.format('can\'t find name for param'))
    }
    let name = lexems.splice(idx_name, 1)[0]

    let description = ''
    let idx_description = lexems.findIndex(f => !vvs.isEmptyString(f) && ['"', '\''].includes(f.substring(0, 1)))
    if (idx_description >= 0) {
        description = lexems.splice(idx_description, 1)[0]
        description = description.substring(1, description.length - 1)
    }

    let idx_type = lexems.findIndex(f => !vvs.isEmptyString(f) && !['"', '\'', "("].includes(f.substring(0, 1)))
    if (idx_type < 0) {
        throw new Error (vvs.format('can\'t find type for param with name "{0}"', name))
    }
    let type = lexems.splice(idx_type, 1)[0]

    if (type === 'table') {
        result.type = 'table'
        result.table = {
            name: name,
            column_list: []
        }
    }

    return result
}

/**
 * @param {string[]} lexems
 * @returns {action.type_sql_param_scalar}
 */
function lexems_to_type_column(lexems) {

    /** @type {action.type_sql_param_scalar} */
    let result = {
        name: undefined,
        type: undefined,
        len_chars: undefined,
        precision: undefined,
        scale: undefined,
        nullable: undefined,
        identity: undefined,
        pk_position: undefined,
        description: undefined,
    }






    if (vvs.equal(type, 'guid'))

    if (vvs.equal(type, 'guid')) type = 'uniqueidentifier'
    let sql_type = vvms.helper_get_types_sql().find(f => vvs.equal(type, f.type))

    //TODO this



    return result
}