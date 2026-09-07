const { parse } = require('pg-connection-string');
const config = parse("postgresql://user:pwd@host/db?sslmode=require");
console.log(config.ssl);
