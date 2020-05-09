//@ts-check

const vvs = require('vv-shared')
const type = require('./@type.js')

/** @type {type.env} */
let env = {
    constructor_options: undefined,
    callback: {
        on_error: undefined
    }
}

exports.env = env
exports.set_constructor_options = set_constructor_options

/**
 * @param {type.constructor_options} options
 */
function set_constructor_options(options) {

    /** @type {type.constructor_options} */
    env.constructor_options = {
        connection: vvs.findPropertyValueInObject(options, 'connection'),
        schema: vvs.findPropertyValueInObject(options, 'schema', 'vv'),
        table: vvs.findPropertyValueInObject(options, 'table', 'log'),
        app: vvs.findPropertyValueInObject(options, 'app', ''),
        scope: vvs.findPropertyValueInObject(options, 'scope', ''),
        print_to_console: vvs.findPropertyValueInObject(options, 'scope', true),
    }

    // if (env.constructor_options.store.time_reload_store_sec <= 0) {
    //     env.constructor_options.store.time_reload_store_sec = undefined
    // }
}