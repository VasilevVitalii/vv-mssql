export type callback_ns_lookup = (ip: string[]) => any;
export type callback_ping_a = (comp_name: string) => any;
export type callback_find_ip_by_comp_name = (ip: string) => any;
export type callback_find_ip_by_comp_name_recur = (ip: string) => any;
/**
 * @callback callback_ns_lookup
 * @param {string[]} ip
 */ /**
* @param {string} comp_name
* @param {callback_ns_lookup} callback
*/
export function ns_lookup(comp_name: string, callback: callback_ns_lookup): void;
/**
 * @callback callback_ping_a
 * @param {string} comp_name
 */ /**
* @param {string} ip
* @param {callback_ping_a} callback
*/
export function ping_a(ip: string, callback: callback_ping_a): void;
/**
 * @callback callback_find_ip_by_comp_name
 * @param {string} ip
 */ /**
* @param {string} comp_name
* @param {callback_find_ip_by_comp_name} callback
*/
export function find_ip_by_comp_name(comp_name: string, callback: callback_find_ip_by_comp_name): void;
