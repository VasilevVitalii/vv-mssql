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
        target: {
            connection: vvs.findPropertyValueInObject(options, ['target', 'connection'])
        },
        store: {
            connection: vvs.findPropertyValueInObject(options, ['store', 'connection']),
            schema: vvs.findPropertyValueInObject(options, ['store', 'schema'], 'vv'),
            table: vvs.findPropertyValueInObject(options, ['store', 'table'], 'action'),
            time_reload_store_sec: vvs.findPropertyValueInObject(options, ['store', 'table'], 60),
        }
    }

    if (env.constructor_options.store.time_reload_store_sec <= 0) {
        env.constructor_options.store.time_reload_store_sec = undefined
    }
}