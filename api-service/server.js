const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Si Render da DATABASE_URL, úsalo.
// Si estás en docker-compose, usa las variables normales.
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'postgres-db',
        port: 5432,
        database: 'crud_db',
        user: 'postgres',
        password: 'postgres'
      }
);

app.use(cors());
app.use(express.json());

// Crear tabla
pool.query(`
  CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    correo TEXT
  )
`).then(() => console.log("Tabla users lista")).catch(console.error);

// Rutas CRUD
app.get("/api/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users ORDER BY id");
  res.json(result.rows);
});

app.get("/api/users/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id=$1", [req.params.id]);
  res.json(result.rows[0] || {});
});

app.post("/api/users", async (req, res) => {
  const { nombre, correo } = req.body;
  const result = await pool.query(
    "INSERT INTO users (nombre, correo) VALUES ($1, $2) RETURNING *",
    [nombre, correo]
  );
  res.json(result.rows[0]);
});

app.put("/api/users/:id", async (req, res) => {
  const { nombre, correo } = req.body;
  const result = await pool.query(
    "UPDATE users SET nombre=$1, correo=$2 WHERE id=$3 RETURNING *",
    [nombre, correo, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete("/api/users/:id", async (req, res) => {
  await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.json({ msg: "Usuario eliminado" });
});

app.listen(PORT, () => console.log("API corriendo en puerto " + PORT));
