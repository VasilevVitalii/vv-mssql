// @ts-check

const { exec } = require('child_process')
const vvs = require('vv-shared')

exports.ns_lookup = ns_lookup
exports.ping_a = ping_a
exports.find_ip_by_comp_name = find_ip_by_comp_name

/**
 * @callback callback_ns_lookup
 * @param {string[]} ip
 *//**
 * @param {string} comp_name
 * @param {callback_ns_lookup} callback
 */
function ns_lookup(comp_name, callback) {
    if (!vvs.equal(process.platform, 'win32')) {
        callback([])
        return
    }
    exec(`nslookup ${comp_name}`, (error, stdout, stderr) => {
        let idx_addrs = stdout.lastIndexOf('Addresses:')
        if (idx_addrs < 0) {
            callback([])
            return
        }
        /** @type {string[]} */
        const result = []
        const ip_raw = vvs.replaceAll(vvs.replaceAll(stdout.substring(idx_addrs + 10, stdout.length), '\r', ''), '\t', '').split('\n')
        ip_raw.forEach(raw => {
            const maybe_ip = vvs.toIp(raw.trim())
            if (vvs.isEmptyString(maybe_ip) || result.some(f => vvs.equal(f, maybe_ip))) return
            result.push(maybe_ip)
        })
        callback(result)
    })
}

/**
 * @callback callback_ping_a
 * @param {string} comp_name
 *//**
 * @param {string} ip
 * @param {callback_ping_a} callback
 */
function ping_a(ip, callback) {
    if (!vvs.equal(process.platform, 'win32')) {
        callback(undefined)
        return
    }

    exec(`ping -a -n 1 ${ip}`, (error, stdout, stderr) => {
        const idx_ip = stdout.indexOf(vvs.border_add(ip, '[', ']'))
        if (idx_ip < 0) {
            callback(undefined)
            return
        }
        const tmp = stdout.substring(0, idx_ip).trim()
        const idx_space = tmp.lastIndexOf(' ')
        if (idx_space < 0) {
            callback(undefined)
            return
        }
        const comp_name = tmp.substring(idx_space, tmp.length).trim()
        callback(vvs.isEmptyString(comp_name) ? undefined : comp_name)
    })
}

/**
 * @callback callback_find_ip_by_comp_name
 * @param {string} ip
 *//**
 * @param {string} comp_name
 * @param {callback_find_ip_by_comp_name} callback
 */
function find_ip_by_comp_name(comp_name, callback) {
    if (vvs.equal(comp_name, vvs.toIp(comp_name))) {
        callback(comp_name)
        return
    }
    ns_lookup(comp_name, ip_list => {
        if (ip_list.length <= 0) {
            callback(undefined)
            return
        }
        find_ip_by_comp_name_recur(ip_list, 0, comp_name, ip => {
            callback(ip)
        })
    })
}

/**
 * @callback callback_find_ip_by_comp_name_recur
 * @param {string} ip
 *//**
 * @param {string[]} ip_list
 * @param {number} idx
 * @param {string} check_comp_name
 * @param {callback_find_ip_by_comp_name_recur} callback
 */
function find_ip_by_comp_name_recur(ip_list, idx, check_comp_name, callback) {
    if (idx >= ip_list.length) {
        callback(undefined)
        return
    }
    ping_a(ip_list[idx], comp_name => {
        if (vvs.equal(comp_name, check_comp_name)) {
            callback(ip_list[idx])
            return
        }
        idx++
        find_ip_by_comp_name_recur(ip_list, idx, check_comp_name, callback)
    })
}