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