//@ts-check
const lib_app = require('./app.js')
const type = require('./@type.js')

exports.create = create

/**
 * @typedef {lib_app} app
 */
/**
 * @typedef {type.constructor_options} mssql_constructor_options
 */

/**
 * @param {mssql_constructor_options} [options]
 */
function create(options) {
    return new lib_app(options)
}