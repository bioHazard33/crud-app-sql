const mysql = require("mysql");
const mysqlConfig = require("../config/mysqlConfig");

const connection = mysql.createConnection(mysqlConfig);

const connect = () => {
    return new Promise((resolve, reject) => {
        connection.connect((error) => {
            if (error) {
                return reject("Error Connecting to database");
            }
            resolve("Connected Succesfully");
        });
    });
};

const execQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (error, results, fields) => {
            if (error) {
                if (error.code == "ER_DUP_ENTRY")
                    return reject("Duplicate Entry");
                return reject("Server Error");
            }
            resolve(results);
        });
    });
};

module.exports = { connect, execQuery };
