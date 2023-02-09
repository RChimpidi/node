const mysql = require('mysql');  

const connection = mysql.createPool({
    connectionLimit: 2,
    host: process.env.DBIP,
    database: 'quadyster',
    user: 'root',
    password: 'password',
    port: '3306'
  });

// connection.connect((err) => {
//     if (!err) {
//         console.log('Database connected');
//     } else { 
//         console.log('Database not connected ' + err);
//     }
// })

module.exports = connection;

