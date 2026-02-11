'use server';
import mysql from 'mysql2';
import type { ResultSetHeader } from 'mysql2';
import { examNotAdminStatus } from './examStatus';
import { Service } from '@/types/service';
import { ExamType } from '@/types/examType';
import { AcademicYear, FormattedAcademicYear } from '@/types/academicYear';
import { FormattedSection, Section } from '@/types/section';

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
    paper_format: string;
    paper_color: string;
    contact: string;
    authorized_persons: string;
    registered_by: string;
    need_scan: boolean;
    financial_center: string;
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

export async function insertExamForPrint(exam: {
    exam_code: string;
    exam_date: string | Date;
    exam_name: string;
    exam_pages: number;
    exam_students: number;
    print_date?: string | Date;
    paper_format?: string;
    paper_color?: string;
    contact?: string;
    authorized_persons?: string;
    remark?: string | null;
    repro_remark?: string | null;
    status?: string;
    registered_by: string;
    need_scan: boolean;
    financial_center: string;
}): Promise<number> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    connection.connect();

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO crep (exam_code, exam_date, exam_name, exam_pages, exam_students, print_date, paper_format, paper_color, contact, authorized_persons, remark, repro_remark, status, registered_by, need_scan, financial_center) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

        const params = [
            exam.exam_code,
            exam.exam_date,
            exam.exam_name,
            exam.exam_pages,
            exam.exam_students,
            exam.print_date,
            exam.paper_format,
            exam.paper_color,
            exam.contact,
            exam.authorized_persons,
            exam.remark || null,
            exam.repro_remark || null,
            exam.status || 'registered',
            exam.registered_by,
            exam.need_scan,
            exam.financial_center
        ];

        connection.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve((result as ResultSetHeader).insertId as number);
        });
        connection.end();
    });
}

export async function getAllExamsForDate(date:string): Promise <Exam[]> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query('SELECT * FROM crep WHERE DATE(print_date) = DATE(?);', [date], (err, rows) => {
            if (err) throw err
            resolve(rows as Exam[]);
        })
        connection.end()
    })
}

export async function getLogs(sciper: string) {
  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  connection.connect();
  
  return new Promise((resolve, reject) => {
    connection.query(
      'SELECT l.*, un.read_at, (un.read_at IS NOT NULL) AS is_read FROM crep_log l LEFT JOIN user_notification un ON un.log_id = l.id AND un.sciper = ? ORDER BY l.date_time DESC, l.id DESC;',
      [sciper],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
    connection.end();
  });
}

export async function markAsRead(sciper: string) {
  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  connection.connect();
  
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO user_notification (log_id, sciper, read_at) SELECT l.id, ?, CURRENT_TIMESTAMP(6) FROM crep_log l ON DUPLICATE KEY UPDATE read_at = IF(user_notification.read_at IS NULL, CURRENT_TIMESTAMP(6), user_notification.read_at);',
      [sciper],
      (err) => {
        if (err) return reject(err);
        resolve({ ok: true });
      }
    );
    connection.end();
  });
}

export async function getAllServices(): Promise <Service[]> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query('SELECT * FROM service;', (err, rows) => {
            if (err) throw err
            resolve(rows as Service[]);
        })
        connection.end()
    })
}

export async function getAllExamTypes(): Promise <ExamType[]> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query('SELECT * FROM exam_type;', (err, rows) => {
            if (err) throw err
            resolve(rows as ExamType[]);
        })
        connection.end()
    })
}

export async function insertExam(exam: {
    code: string;
    name: string;
    service_level_id: number;
    service_id: number;
    exam_type_id: number;
    exam_status_id: number;
    exam_date?: string | Date | null;
    academic_year_id: number;
    exam_semester: number;
    nb_students?: number | null;
    nb_pages?: number | null;
    total_pages?: number | null;
    // deadline_prep: string | Date;
    // deadline_repro: string | Date;
    remark?: string | null;
    section_id: number;
    responsible_id: number | null;
    contact: string;
}): Promise<number> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    connection.connect();

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO exam (code, name, service_level_id, service_id, exam_type_id, exam_status_id, exam_date, academic_year_id, exam_semester, nb_students, nb_pages, total_pages, remark, section_id, responsible_id, contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

        const params = [
            exam.code,
            exam.name,
            exam.service_level_id,
            exam.service_id,
            exam.exam_type_id,
            exam.exam_status_id,
            exam.exam_date || null,
            exam.academic_year_id,
            exam.exam_semester,
            exam.nb_students || null,
            exam.nb_pages || null,
            exam.total_pages || null,
            // exam.deadline_prep,
            // exam.deadline_repro,
            exam.remark || null,
            exam.section_id,
            exam.responsible_id,
            exam.contact,
        ];

        connection.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve((result as ResultSetHeader).insertId as number);
        });
        connection.end();
    });
}

export async function getAllAcademicYears():Promise <FormattedAcademicYear[]> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query('SELECT * FROM academic_year;', (err:mysql.QueryError | null, rows:AcademicYear[]) => {
            if (err) throw err
            const formattedResult = rows.map(academicYear => ({
                value: academicYear.id,
                label: academicYear.code,
                academicYear: {
                    id: academicYear.id,
                    code: academicYear.code,
                    name: academicYear.name,
                }
            }))
            resolve(formattedResult as FormattedAcademicYear[]);
        })
        connection.end()
    })
}

export async function getAllSections():Promise <FormattedSection[]> {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })

    connection.connect()
    
    return new Promise(function(resolve) {
        connection.query('SELECT * FROM section;', (err:mysql.QueryError | null, rows:Section[]) => {
            if (err) throw err
            const formattedResult = rows.map(section => ({
                value: section.id,
                label: section.code,
                section: {
                    id: section.id,
                    code: section.code,
                    name: section.name,
                }
            }))
            resolve(formattedResult as FormattedSection[]);
        })
        connection.end()
    })
}
