## Install & Use
```cmd
npm i vv-mssql
```
```js
//@ts-check
let connection = require('vv-mssql').create({
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

connection.ping(error => {
    if (error) {
        console.error(error)
        return
    }
    console.log('Server info', connection.server_info())

    //example 1 - simple 1 query
    connection.exec("select top 10 * from sys.objects", undefined, callback_exec => {
        if (callback_exec.type !== 'end') return

        console.log('script', callback_exec.end.get_beauty_query('actual'))

        if (callback_exec.end.error) {
            console.error(callback_exec.end.error_type, callback_exec.end.error)
            return
        }
        console.log('result', callback_exec.end.table_list)
    })

    //example 2 - 2 queries in one connect
    connection.exec(["select top 5 * from sys.objects", "select top 5 * from sys.columns"], undefined, callback_exec => {
        if (callback_exec.type !== 'end') return

        console.log('script', callback_exec.end.get_beauty_query('actual'))

        if (callback_exec.end.error) {
            console.error(callback_exec.end.error_type, callback_exec.end.error)
            return
        }

        console.log('total duration (script time + all handlers time)', callback_exec.end.duration)
        console.log('current database at the time the script was running (if use in script instrunction "use database")', callback_exec.end.database)
        callback_exec.end.table_list.forEach(table => {
            console.log('==============TABLE #'.concat(table.table_index.toString(), ', QUERY #', table.query_index.toString()))
            console.log('SCHEMA:')
            table.column_list.forEach(column => {
                console.log('    '.concat(column.name, ' ', column.declararion))
            })
            console.log('rows', table.row_list)
        })
    })

    //example 3 - a) get spid, b) exec script in other database
    connection.exec("select * from sys.objects", {get_spid: true, database: 'master'}, callback_exec => {
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
    connection.exec("select * from sys.objects", {chunk: {type: 'row', chunk: 50 }}, callback_exec => {
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
    connection.exec("select 'aaa', 'bbb', 'ccc' as f1, 'ddd' as f1, * from sys.objects", undefined, callback_exec => {
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
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#callback_ping">callback_ping</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#callback_exec">callback_exec</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#callback_newid">callback_newid</a> : <code>function</code></dt>
<dd></dd>
</dl>

<a name="App"></a>

## App
**Kind**: global class  

* [App](#App)
    * [new App(options)](#new_App_new)
    * [.ping([callback])](#App+ping)
    * [.server_info()](#App+server_info) ⇒ <code>type.connection\_server\_info</code>
    * [.exec(query, options, [callback])](#App+exec)
    * [.newid(count, callback)](#App+newid)

<a name="new_App_new"></a>

### new App(options)

| Param | Type |
| --- | --- |
| options | <code>type.constructor\_options</code> | 

<a name="App+ping"></a>

### app.ping([callback])
check connect to MS SQL, load MS SQL server info

**Kind**: instance method of [<code>App</code>](#App)  

| Param | Type |
| --- | --- |
| [callback] | [<code>callback\_ping</code>](#callback_ping) | 

<a name="App+server_info"></a>

### app.server\_info() ⇒ <code>type.connection\_server\_info</code>
return MS SQL info (non empty after exec ping())

**Kind**: instance method of [<code>App</code>](#App)  
<a name="App+exec"></a>

### app.exec(query, options, [callback])
exec one query or many queries in one batch

**Kind**: instance method of [<code>App</code>](#App)  

| Param | Type |
| --- | --- |
| query | <code>string</code> \| <code>Array.&lt;string&gt;</code> | 
| options | <code>type.exec\_option</code> | 
| [callback] | [<code>callback\_exec</code>](#callback_exec) | 

<a name="App+newid"></a>

### app.newid(count, callback)
get ms sql generated guid's

**Kind**: instance method of [<code>App</code>](#App)  

| Param | Type | Description |
| --- | --- | --- |
| count | <code>number</code> | count guid |
| callback | [<code>callback\_newid</code>](#callback_newid) |  |

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
| callback | <code>type.exec\_result</code> | 

<a name="callback_newid"></a>

## callback\_newid : <code>function</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 
| guid_list | <code>Array.&lt;string&gt;</code> | 

