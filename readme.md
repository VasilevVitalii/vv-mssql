## Install & Use
```cmd
npm i vv-mssql
```
```js
//@ts-check

const lib_vv_mssql = require('vv-mssql')

let mssql = new lib_vv_mssql({
    instance: 'myserver\\myinstance',
    login: 'sa',
    password: 'my very protected password',
    additional: {
        app_name: 'my best app',
        database: 'tempdb',
        use_utc: true,
        //connection_timeout: 0
        //and timeout, encrypt
    }
})

mssql.ping(error => {
    if (error) {
        console.error(error)
        return
    }
    console.log('Server info', mssql.info)

    //example 1 - simple 1 query
    mssql.exec("select * from sys.objects", undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
            console.log(callback_exec.end.get_beauty_query('actual'))
        }
    })

    //example 2 - 2 queries in one connect
    mssql.exec(["select * from sys.objects", "SELECT * FROM sys.[columns]"], undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
            console.log(callback_exec.end.get_beauty_query('actual'))
        }
    })

    //example 3 - a) get spid, b) exec script in other database
    mssql.exec("select * from sys.objects", {get_spid: true, database: 'master'}, callback_exec => {
        if (callback_exec.type === 'spid') {
            console.log('spid', callback_exec.spid)
        }
        if (callback_exec.type === 'end') {
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
            console.log('script database', callback_exec.end.database)
        }
    })

    //example 4 - chunked result
    mssql.exec("select * from sys.objects", {chunk: {type: 'row', chunk: 50 }}, callback_exec => {
        if (callback_exec.type === 'chunk') {
            // see callback_exec.chunk
        }
        if (callback_exec.type === 'end') {
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
        }
    })

    //example 5 - columns buetify - two column without name and two column with same name
    mssql.exec("select 'aaa', 'bbb', 'ccc' as f1, 'ddd' as f1, * from sys.objects", undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
        }
    })
})
```
## Classes

<dl>
<dt><a href="#App">App</a></dt>
<dd><p>Examples - see _demo.js</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#type_connection_option">type_connection_option</a> : <code>type.connection_option</code></dt>
<dd></dd>
<dt><a href="#type_server_info">type_server_info</a> : <code>type.server_info</code></dt>
<dd></dd>
<dt><a href="#type_exec_option">type_exec_option</a> : <code>type.exec_option</code></dt>
<dd></dd>
<dt><a href="#type_exec_result">type_exec_result</a> : <code>type.exec_result</code></dt>
<dd></dd>
<dt><a href="#type_exec_result_end">type_exec_result_end</a> : <code>type.exec_result_end</code></dt>
<dd></dd>
<dt><a href="#callback_ping">callback_ping</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#callback_exec">callback_exec</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#callback_newid">callback_newid</a> : <code>function</code></dt>
<dd></dd>
</dl>

<a name="App"></a>

## App
Examples - see _demo.js

**Kind**: global class  

* [App](#App)
    * [new App(options)](#new_App_new)
    * [.info](#App+info) : [<code>type\_server\_info</code>](#type_server_info)
    * [.ping([callback])](#App+ping)
    * [.exec(query, options, [callback])](#App+exec)
    * [.newid(count, callback)](#App+newid)

<a name="new_App_new"></a>

### new App(options)

| Param | Type |
| --- | --- |
| options | [<code>type\_connection\_option</code>](#type_connection_option) | 

<a name="App+info"></a>

### app.info : [<code>type\_server\_info</code>](#type_server_info)
**Kind**: instance property of [<code>App</code>](#App)  
<a name="App+ping"></a>

### app.ping([callback])
**Kind**: instance method of [<code>App</code>](#App)  

| Param | Type |
| --- | --- |
| [callback] | [<code>callback\_ping</code>](#callback_ping) | 

<a name="App+exec"></a>

### app.exec(query, options, [callback])
**Kind**: instance method of [<code>App</code>](#App)  

| Param | Type |
| --- | --- |
| query | <code>string</code> \| <code>Array.&lt;string&gt;</code> | 
| options | [<code>type\_exec\_option</code>](#type_exec_option) | 
| [callback] | [<code>callback\_exec</code>](#callback_exec) | 

<a name="App+newid"></a>

### app.newid(count, callback)
get ms sql generated guid's

**Kind**: instance method of [<code>App</code>](#App)  

| Param | Type | Description |
| --- | --- | --- |
| count | <code>number</code> | count guid |
| callback | [<code>callback\_newid</code>](#callback_newid) |  |

<a name="type_connection_option"></a>

## type\_connection\_option : <code>type.connection\_option</code>
**Kind**: global typedef  
<a name="type_server_info"></a>

## type\_server\_info : <code>type.server\_info</code>
**Kind**: global typedef  
<a name="type_exec_option"></a>

## type\_exec\_option : <code>type.exec\_option</code>
**Kind**: global typedef  
<a name="type_exec_result"></a>

## type\_exec\_result : <code>type.exec\_result</code>
**Kind**: global typedef  
<a name="type_exec_result_end"></a>

## type\_exec\_result\_end : <code>type.exec\_result\_end</code>
**Kind**: global typedef  
<a name="callback_ping"></a>

## callback\_ping : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="callback_exec"></a>

## callback\_exec : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| callback | [<code>type\_exec\_result</code>](#type_exec_result) | 

<a name="callback_newid"></a>

## callback\_newid : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 
| guid_list | <code>Array.&lt;string&gt;</code> | 

