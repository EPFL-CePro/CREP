'use server';
import mysql from 'mysql2';
import { examNotAdminStatus } from './examStatus';

interface Exam {
    id: number;
    exam_code: string;
    exam_date: Date;
    exam_name: string;
    exam_pages: number;
    exam_students: number;
    print_date: Date;
    remark: string;
    repro_remark: string;
    status: string;
}

export async function getAllExams() {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve) {
        connection.query('SELECT * from crep;', (err, rows) => {
            if (err) throw err
            resolve(rows);
        })
        connection.end()
    })
}

export async function getAllNonAdminExams() {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query(`SELECT * from crep WHERE status IN (${examNotAdminStatus.map(obj => `"${obj.value}"`).join(", ")});`, (err, rows) => {
            if (err) throw err
            resolve(rows);
        })
        connection.end()
    })
}

export async function updateExamDateById(id: string, startDate: string) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve) {
        connection.query('UPDATE crep SET print_date = ? WHERE id = ?;', [startDate, id], (err, rows) => {
            if (err) throw err
            resolve(JSON.stringify(rows));
        })
        connection.end()
    })
}

export async function updateExamStatusById(id: string, status: string) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve) {
        connection.query('UPDATE crep SET status = ? WHERE id = ?;', [status, id], (err, rows) => {
            if (err) throw err
            resolve(JSON.stringify(rows));
        })
        connection.end()
    })
}

export async function updateExamRemarkById(id: string, remark: string) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve) {
        connection.query('UPDATE crep SET remark = ? WHERE id = ?;', [remark, id], (err, rows) => {
            if (err) throw err
            resolve(JSON.stringify(rows));
        })
        connection.end()
    })
}

export async function updateExamReproRemarkById(id: string, reproRemark: string) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()

    return new Promise(function(resolve) {
        connection.query('UPDATE crep SET repro_remark = ? WHERE id = ?;', [reproRemark, id], (err, rows) => {
            if (err) throw err
            resolve(JSON.stringify(rows));
        })
        connection.end()
    })
}

export async function getAllExamsByStatus(status: Array<string>): Promise<Exam[]> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query(`SELECT * from crep WHERE status IN (${status.map(obj => `"${obj}"`).join(", ")});`, (err:mysql.QueryError, rows:Exam[]) => {
            if (err) throw err
            resolve(rows);
        })
        connection.end()
    })
}

export async function getAllExamsBetweenDates(beginDate: Date, endDate: Date): Promise<Exam[]> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query(`SELECT * from crep WHERE print_date between '${beginDate.toISOString().replace('T', ' ').slice(0, 19)}' and '${endDate.toISOString().replace('T', ' ').slice(0, 19)}'`, (err:mysql.QueryError, rows:Exam[]) => {
            if (err) throw err
            resolve(rows);
        })
        connection.end()
    })
}
export async function getAllCourses() {
  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  connection.connect();
  
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM course;', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
    connection.end();
  });
}   

export async function getAllUsers() {
  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  connection.connect();
  
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM user;', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
    connection.end();
  });
}   

