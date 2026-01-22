// db.js
// PostgreSQL pieslēgums (Railway)
// Izmantojam DATABASE_URL no vides mainīgajiem (Railway to iedos automātiski)

const { Pool } = require("pg");

// Railway parasti dod DATABASE_URL šādā formā:
// postgres://user:pass@host:port/dbname
//
// Mēs izveidojam "pool" (savienojumu baseinu), lai serveris var droši apkalpot vairākus pieprasījumus.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway/Cloud Postgres bieži prasa SSL. Ja tev būs vajadzīgs, ieslēgsim šo:
  // ssl: { rejectUnauthorized: false }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
