const mysqlConfig = {
    host: process.env.IP,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
};

module.exports = mysqlConfig;
