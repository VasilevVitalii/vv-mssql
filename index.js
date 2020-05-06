//@ts-check
const subsystem_connection = require('./connection//app.js')
const type_subsystem_connection = require('./connection//@type.js')

exports.connection = connection

/**
 * @param {type_subsystem_connection.connection_option} options
 */
function connection(options) {
    return new subsystem_connection(options)
}