//@ts-check

const vvs = require('vv-shared')
const type = require('./@type.js')
const partial = require('./app.partial.js')
const queries = require('./queries.js')

class App {
    /**
     * @param {type.constructor_options} options
     * @param {type.callback_error} [callback]
     */
    constructor(options, callback) {
        partial.set_constructor_options(options)
        queries.internal_action.replacement_add('${schema}', vvs.border_del(partial.env.constructor_options.schema, '[', ']'))
        queries.internal_action.replacement_add('${table}', vvs.border_del(partial.env.constructor_options.table, '[', ']'))
        queries.exec_create_tables(partial.env.constructor_options.connection, callback_exec => {
            if (vvs.isFunction(callback)) {
                callback(callback_exec.error)
            }
        })
    }

}

module.exports = App