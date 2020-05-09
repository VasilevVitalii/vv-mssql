//@ts-check
const subsystem_connection = require('./connection//app.js')
const type_subsystem_connection = require('./connection//@type.js')
const subsystem_action = require('./action//app.js')
const type_subsystem_action = require('./action//@type.js')
const subsystem_logger = require('./logger//app.js')
const type_subsystem_logger = require('./logger//@type.js')


exports.connection = connection
exports.action = action
exports.logger = logger

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

/**
 * @param {type_subsystem_logger.constructor_options} options
 * @param {type_subsystem_logger.callback_error} [callback]
 */
function logger(options, callback) {
    return new subsystem_logger(options, callback)
}