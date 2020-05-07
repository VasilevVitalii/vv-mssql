//@ts-check

const vvs = require('vv-shared')
const type = require('./@type.js')
const partial = require('./app.partial.js')
const queries = require('./queries.js')

class App {
    /**
     * @param {type.constructor_options} options
     */
    constructor(options) {
        partial.set_constructor_options(options)
    }

    /**
     * Need if action store in MS SQL. Load actions from store and start timer reloaded actions
     * @param {type.callback_error} [callback]
     */
    load_store_start(callback) {
        if (vvs.isEmpty(partial.env.constructor_options.store.connection)) {
            if (vvs.isFunction(callback)) {
                callback(undefined)
            }
            return
        }
        queries.query_create_tables(
            partial.env.constructor_options.store.connection,
            partial.env.constructor_options.store.schema,
            partial.env.constructor_options.store.table,
            callback_exec => {
                if (vvs.isFunction(callback)) {
                    callback(callback_exec.error)
                }
            }
        )
    }

    /**
     * Need if action store in MS SQL. Stop timer reloaded actions
     */
    load_store_stop() {

    }

    /**
     * @param {type.env_callback_on_error} callback_on_error
     */
    on_error(callback_on_error) {
        partial.env.callback.on_error = callback_on_error
    }
}

module.exports = App