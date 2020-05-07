# Install
```cmd
npm i vv-mssql
```
# Connection subsystem
## Use
```js
const vvmssql = require('vv-mssql')

let connection = vvmssql.connection({
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
    connection.exec("select * from sys.objects", undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
            console.log(callback_exec.end.get_beauty_query('actual'))
        }
    })

    //example 2 - 2 queries in one connect
    connection.exec(["select * from sys.objects", "SELECT * FROM sys.[columns]"], undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
            console.log(callback_exec.end.get_beauty_query('actual'))
        }
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

## Functions
* ### ping
check connect to MS SQL, load MS SQL server info

| Param | Type |
| --- | --- |
| [callback] | [<code>callback\_ping</code>](#callback_ping) | 

* ### server_info
return MS SQL info (non empty after exec ping())
* ### exec
exec one query or many queries in one batch

| Param | Type |
| --- | --- |
| query | <code>string</code> \| <code>Array.&lt;string&gt;</code> | 
| options | <code>type.exec\_option</code> | 
| [callback] | [<code>callback\_exec</code>](#callback_exec) | 

* ### newid
get ms sql generated guid&#x27;s

| Param | Type | Description |
| --- | --- | --- |
| count | <code>number</code> | count guid |
| callback | [<code>callback\_newid</code>](#callback_newid) |  |


## Typedefs

<dl>
<dt><a href="#constructor_options">constructor_options</a></dt>
<dd></dd>
<dt><a href="#connection_option_additional">connection_option_additional</a></dt>
<dd></dd>
<dt><a href="#connection_server_info">connection_server_info</a></dt>
<dd></dd>
<dt><a href="#exec_option">exec_option</a></dt>
<dd></dd>
<dt><a href="#exec_query">exec_query</a></dt>
<dd></dd>
<dt><a href="#exec_lock">exec_lock</a></dt>
<dd></dd>
<dt><a href="#exec_chunk">exec_chunk</a></dt>
<dd></dd>
<dt><a href="#exec_result">exec_result</a></dt>
<dd></dd>
<dt><a href="#exec_result_end">exec_result_end</a></dt>
<dd></dd>
<dt><a href="#exec_result_table">exec_result_table</a></dt>
<dd></dd>
<dt><a href="#exec_result_column">exec_result_column</a></dt>
<dd></dd>
<dt><a href="#exec_result_message">exec_result_message</a></dt>
<dd></dd>
<dt><a href="#exec_result_chunk">exec_result_chunk</a></dt>
<dd></dd>
</dl>

<a name="constructor_options"></a>

## constructor\_options
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| instance | <code>string</code> | ms sql instance, examples - 'localhost', 'myserver/myinstance' |
| [login] | <code>string</code> | login for ms sql authentication, if need domain authentication, set undefined |
| [password] | <code>string</code> | password for ms sql authentication, if need domain authentication, set undefined |
| [additional] | [<code>connection\_option\_additional</code>](#connection_option_additional) |  |

<a name="connection_option_additional"></a>

## connection\_option\_additional
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [database] | <code>string</code> | name database for connect, default - 'tempdb' |
| [app_name] | <code>string</code> | app name, which will be visible in MS SQL profiler, default - 'vv-mssql' |
| [use_utc] | <code>boolean</code> | default - true |
| [connection_timeout] | <code>number</code> | connection timeout in milliseconds, default - 15000 |
| [execution_timeout] | <code>number</code> | execution timeout in milliseconds, default - 0 (infinity) |
| [encrypt_connection] | <code>boolean</code> | encrypt connection, default - false |

<a name="connection_server_info"></a>

## connection\_server\_info
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| version | <code>string</code> | MS SQL Server version |
| timezone | <code>number</code> | OS timezone (in minutes), where MS SQL running, examples:  +180 = Saint-Petersburg, +120 = Paris, 0 = London, -300 = New York |
| ping_duration_msec | <code>number</code> | time (in millisecond) for sucess connect to MS SQL and exec small simpe query |

<a name="exec_option"></a>

## exec\_option
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [database] | <code>string</code> | use this database before start query |
| [get_spid] | <code>boolean</code> | get spid, for (example) kill process, default - false |
| [chunk] | [<code>exec\_chunk</code>](#exec_chunk) | chunked return result, default - undefined (off) |
| [lock] | [<code>exec\_lock</code>](#exec_lock) | protect competitive exec query, based on sp_getapplock, default - undefined (off) |
| [stop_on_error] | <code>boolean</code> | for exec many queries in one batch - if in step error exists, next steps not run, default - true |

<a name="exec_query"></a>

## exec\_query
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>&#x27;query&#x27;</code> \| <code>&#x27;get\_spid&#x27;</code> \| <code>&#x27;database&#x27;</code> \| <code>&#x27;lock&#x27;</code> |  |
| query | <code>string</code> |  |
| [query_index] | <code>number</code> |  |
| [duration] | <code>number</code> | query exec time in msec |
| [duration_beautify_columns] | <code>number</code> | event 'columnMetadata' (with function column_list_beautify) work time in msec |
| [duration_beautify_rows] | <code>number</code> | event 'row' (with function row_beautify_function) work time in msec |
| [error] | <code>Error</code> |  |
| [error_type] | <code>&#x27;connect&#x27;</code> \| <code>&#x27;exec&#x27;</code> \| <code>&#x27;lock&#x27;</code> |  |

<a name="exec_lock"></a>

## exec\_lock
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [database] | <code>string</code> |  |
| key | <code>string</code> | lock name |
| wait | <code>number</code> | 0 - no wait or time wait in msec |

<a name="exec_chunk"></a>

## exec\_chunk
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>&#x27;row&#x27;</code> \| <code>&#x27;msec&#x27;</code> | 
| chunk | <code>number</code> | 

<a name="exec_result"></a>

## exec\_result
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>&#x27;end&#x27;</code> \| <code>&#x27;spid&#x27;</code> \| <code>&#x27;chunk&#x27;</code> | 
| [end] | [<code>exec\_result\_end</code>](#exec_result_end) | 
| [spid] | <code>number</code> | 
| [chunk] | [<code>exec\_result\_chunk</code>](#exec_result_chunk) | 

<a name="exec_result_end"></a>

## exec\_result\_end
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> |  |
| error_type | <code>&#x27;connect&#x27;</code> \| <code>&#x27;exec&#x27;</code> \| <code>&#x27;lock&#x27;</code> |  |
| duration | <code>number</code> |  |
| database | <code>string</code> | work void exec time (from start to callback end) in msec |
| table_list | [<code>Array.&lt;exec\_result\_table&gt;</code>](#exec_result_table) |  |
| message_list | [<code>Array.&lt;exec\_result\_message&gt;</code>](#exec_result_message) |  |
| query_list | [<code>Array.&lt;exec\_query&gt;</code>](#exec_query) |  |
| get_beauty_query | <code>function</code> |  |

<a name="exec_result_table"></a>

## exec\_result\_table
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| query_index | <code>number</code> | 
| table_index | <code>number</code> | 
| column_list | [<code>Array.&lt;exec\_result\_column&gt;</code>](#exec_result_column) | 
| row_list | <code>Array.&lt;Object&gt;</code> | 

<a name="exec_result_column"></a>

## exec\_result\_column
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| name | <code>string</code> | 
| name_original | <code>string</code> | 
| type | <code>string</code> | 
| jstype | <code>string</code> | 
| len | <code>number</code> | 
| len_chars | <code>number</code> | 
| scale | <code>number</code> | 
| precision | <code>number</code> | 
| declararion | <code>string</code> | 
| nullable | <code>boolean</code> | 
| identity | <code>boolean</code> | 
| readonly | <code>boolean</code> | 

<a name="exec_result_message"></a>

## exec\_result\_message
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>&#x27;info&#x27;</code> \| <code>&#x27;error&#x27;</code> | 
| query_index | <code>number</code> | 
| message | <code>string</code> | 
| proc_name | <code>string</code> | 
| line | <code>number</code> | 

<a name="exec_result_chunk"></a>

## exec\_result\_chunk
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| table | [<code>exec\_result\_table</code>](#exec_result_table) | 
| message_list | [<code>Array.&lt;exec\_result\_message&gt;</code>](#exec_result_message) | 

