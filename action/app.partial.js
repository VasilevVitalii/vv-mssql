//@ts-check

const vvs = require('vv-shared')
const type = require('./@type.js')

exports.constructor_options_beautify = constructor_options_beautify

/**
 * @param {type.constructor_options} options
 * @returns {type.constructor_options}
 */
function constructor_options_beautify(options) {
    /** @type {type.constructor_options} */
    let options_beauty = {
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

    if (options_beauty.store.time_reload_store_sec <= 0) {
        options_beauty.store.time_reload_store_sec = undefined
    }

    return options_beauty
}