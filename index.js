//@ts-check
const app = require('./app.js')
const type = require('./@type.js')

exports.create = create

/**
 * @param {type.constructor_options} [options]
 */
function create(options) {
    return new app(options)
}