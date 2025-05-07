import mysql from "mysql2/promise";

const port = 8000;
const host = "localhost";
const baseUrl = `http://${host}:${port}/logos/`;
const PRIVATE_KEY= "test_private_key"

const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  database: "ruforum_cid",
  password: "",
  connectionLimit: 10,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  queueLimit: 0,
});

export { port, db, baseUrl, PRIVATE_KEY };
