const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bida',
  port: 3308
});

connection.connect(err => {
  if (err) {
    console.error('CONNECTION_ERROR', err.message);
    process.exit(1);
  }

  connection.query('SHOW CREATE TABLE venta', (error, results) => {
    if (error) {
      console.error('QUERY_ERROR', error.message);
      connection.end();
      process.exit(1);
    }

    if (results && results.length > 0) {
      console.log(results[0]['Create Table'] || results[0]['Create View'] || JSON.stringify(results[0]));
    } else {
      console.log('No se encontró la tabla venta o no hay resultados.');
    }

    connection.end();
  });
});
