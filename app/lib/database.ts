'use server';
import mysql from 'mysql2';

export async function getAllExams() {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve, reject) {
        connection.query('SELECT * from crep;', (err, rows, fields) => {
            if (err) throw err
            resolve(rows);
        })
        connection.end()
    })
}

export async function updateExamDateById(id: String, startDate: String, endDate: String) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve, reject) {
        connection.query('UPDATE crep SET crep_print_date = ? WHERE code = ?;', [startDate, id], (err, rows, fields) => {
            if (err) throw err
            resolve(JSON.stringify(rows));
        })
        connection.end()
    })
}

export async function updateExamStatusById(id: String, status: String) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve, reject) {
        connection.query('UPDATE crep SET crep_status = ? WHERE code = ?;', [status, id], (err, rows, fields) => {
            if (err) throw err
            resolve(JSON.stringify(rows));
        })
        connection.end()
    })
}

export async function updateExamRemarkById(id: String, remark: String) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve, reject) {
        connection.query('UPDATE crep SET crep_remark = ? WHERE code = ?;', [remark, id], (err, rows, fields) => {
            if (err) throw err
            resolve(JSON.stringify(rows));
        })
        connection.end()
    })
}