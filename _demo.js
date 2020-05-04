const lib_vmst_driver = require('vmst-driver')
//@ts-check

let vmst_driver = new lib_vmst_driver({
    instance: 'mycomp\\myinstance',
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

vmst_driver.ping(error => {
    if (error) {
        console.error(error)
        return
    }
    console.log('Server info', vmst_driver.info)

    //example 1 - simple 1 query
    vmst_driver.exec("select * from sys.objects", undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
            console.log(callback_exec.end.get_beauty_query('actual'))
        }
    })

    //example 2 - 2 queries in one connect
    vmst_driver.exec(["select * from sys.objects", "SELECT * FROM sys.[columns]"], undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
            console.log(callback_exec.end.get_beauty_query('actual'))
        }
    })

    //example 3 - a) get spid, b) exec script in other database
    vmst_driver.exec("select * from sys.objects", {get_spid: true, database: 'master'}, callback_exec => {
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
    vmst_driver.exec("select * from sys.objects", {chunk: {type: 'row', chunk: 50 }}, callback_exec => {
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
    vmst_driver.exec("select 'aaa', 'bbb', 'ccc' as f1, 'ddd' as f1, * from sys.objects", undefined, callback_exec => {
        if (callback_exec.type === 'end') {
            // see callback_exec.end for more info
            if (callback_exec.end.error) {
                console.error(callback_exec.end.error_type, callback_exec.end.error)
            }
        }
    })
})
