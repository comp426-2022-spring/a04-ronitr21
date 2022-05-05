// ensures there are no silent fails
"use strict";
const database = require('better-sqlite3');

const db = new database('log.db')

const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get();
// check if there is a table
if (row === undefined) {
    console.log('Log database appears to be empty. Creating log database...')

    const sqlInit = `
        CREATE TABLE accesslog ( 
            id INTEGER PRIMARY KEY, 
            remoteaddr VARCHAR, 
            remoteuser VARCHAR, 
            time VARCHAR, 
            method VARCHAR, 
            url VARCHAR, 
            protocol VARCHAR,
            httpversion NUMERIC, 
            secure VARCHAR,
            status INTEGER, 
            referer VARCHAR,
            useragent VARCHAR);
    `;
// Execute SQL commands    
db.exec(sqlInit)
} else {
console.log('Log database exists.')
}

module.exports = db    