//@ts-check
const lib_app = require('./app.js')
const type = require('./@type.js')

exports.create = create

/**
 * @typedef {lib_app} app
 */
/**
 * @typedef {type.constructor_options} options
 */
/**
 * @typedef {type.exec_result_end} exec_result_end
 */

/**
 * @param {options} [options]
 */
function create(options) {
    return new lib_app(options)
}