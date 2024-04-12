import mysql from "mysql2/promise";

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

console.log({ DB_HOST, DB_USER, DB_PASS, DB_NAME });

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  // 預設是 3306
  // port: 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export default db;
