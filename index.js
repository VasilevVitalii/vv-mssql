//@ts-check
const app = require('./app.js')
const type = require('./@type.js')

exports.create = create

/**
 * @typedef {type.constructor_options} mssql_constructor_options
 */

/**
 * @param {mssql_constructor_options} [options]
 */
function create(options) {
    return new app(options)
}