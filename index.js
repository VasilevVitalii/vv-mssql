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
 * @typedef {type.exec_result} exec_result
 */
/**
 * @typedef {type.exec_result_end} exec_result_end
 */
/**
 * @typedef {type.exec_result_table} exec_result_table
 */
/**
 * @typedef {type.exec_lock} exec_lock
 */

/**
 * @param {options} [options]
 */
function create(options) {
    return new lib_app(options)
}