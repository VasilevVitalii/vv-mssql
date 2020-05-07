//@ts-check
const subsystem_connection = require('./connection//app.js')
const type_subsystem_connection = require('./connection//@type.js')
const subsystem_action = require('./action//app.js')
const type_subsystem_action = require('./action//@type.js')

exports.connection = connection
exports.action = action

/**
 * @param {type_subsystem_connection.constructor_options} options
 */
function connection(options) {
    return new subsystem_connection(options)
}

/**
 * @param {type_subsystem_action.constructor_options} options
 */
function action(options) {
    return new subsystem_action(options)
}