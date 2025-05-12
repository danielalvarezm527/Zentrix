require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) throw err;
  console.log('Conectado a MySQL');
});

// Registro
app.post("/register", async (req, res) => {
  const { email, password, nombre, apellido, documento, celular, username, rol } = req.body;

  if (!email || !password || !nombre || !apellido || !documento || !celular || !username || !rol) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  try {
    const [persona] = await db.promise().execute(
      "INSERT INTO Person (name, last_name, document, email, cellphone) VALUES (?, ?, ?, ?, ?)",
      [nombre, apellido, documento, email, celular]
    );

    const id_person = persona.insertId;
    const hashedPassword = await bcrypt.hash(password, 8);

    await db.promise().execute(
      "INSERT INTO UserAccount (user_name, password, rol, state, Person_id_person) VALUES (?, ?, ?, 'activo', ?)",
      [username, hashedPassword, rol, id_person]
    );

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar:", error);
    res.status(500).json({ message: "Error al registrar" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña requeridos" });
  }

  try {
    console.log(`Intentando login para usuario: ${username}`);
    
    const [rows] = await db.promise().execute(
      `SELECT UA.id_user, UA.password, UA.rol, P.name, P.last_name
       FROM UserAccount UA
       INNER JOIN Person P ON UA.Person_id_person = P.id_person
       WHERE UA.user_name = ? AND UA.state = 'activo'`,
      [username]
    );

    if (rows.length === 0) return res.status(401).json({ message: "Usuario no encontrado o inactivo" });

    const user = rows[0];
    // console.log("Usuario encontrado, hash almacenado:", user.password);
    // console.log("Contraseña proporcionada:", password);
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    // console.log("Resultado de la comparación:", passwordMatch);

    if (!passwordMatch) return res.status(401).json({ message: "Contraseña incorrecta" });

    res.json({
      message: "Login exitoso",
      rol: user.rol,
      id_user: user.id_user,
      nombre: user.name,
      apellido: user.last_name
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en login" });
  }
});

// Dashboard
app.get("/dashboard/:rol", async (req, res) => {
  const { rol } = req.params;

  try {
    let data;

    if (rol === "admin") {
      const [users] = await db.promise().execute("SELECT * FROM UserAccount");
      data = { total_usuarios: users.length };
    } else if (rol === "cliente") {
      const [invoices] = await db.promise().execute("SELECT * FROM Invoice");
      data = { total_facturas: invoices.length };
    } else {
      data = { message: "Rol no reconocido" };
    }

    res.json(data);
  } catch (error) {
    console.error("Error en dashboard:", error);
    res.status(500).json({ message: "Error al obtener dashboard" });
  }
});

// backend/app.js
app.get('/invoices/:id_user', async (req, res) => {
  const { id_user } = req.params;
  try {
    const [rows] = await db.promise().execute(
      `SELECT * FROM Invoice WHERE UserAccount_id_user = ?`,
      [id_user]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ message: 'Error interno al obtener facturas' });
  }
});

// backend/app.js
app.get('/notifications/:id_user', async (req, res) => {
  const { id_user } = req.params;
  try {
    const [rows] = await db.promise().execute(
      `SELECT * FROM Notification WHERE UserAccount_id_user = ?`,
      [id_user]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error interno al obtener notificaciones' });
  }
});

// Endpoint to get ALL invoices (for admin)
app.get('/admin/invoices', async (req, res) => {
  try {
    // Log the column names for debugging
    const [columns] = await db.promise().execute(
      `SHOW COLUMNS FROM Invoice`
    );
    console.log('Invoice table columns:', columns.map(col => col.Field));
    
    const [rows] = await db.promise().execute(
      `SELECT i.*, u.user_name 
       FROM Invoice i
       LEFT JOIN UserAccount u ON i.UserAccount_id_user = u.id_user`
    );
    
    // Log a sample row to see actual data
    if (rows.length > 0) {
      console.log('Sample invoice row:', rows[0]);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener todas las facturas:', error);
    res.status(500).json({ message: 'Error interno al obtener facturas' });
  }
});

// Endpoint to get ALL notifications (for admin)
app.get('/admin/notifications', async (req, res) => {
  try {
    // Log the column names for debugging
    const [columns] = await db.promise().execute(
      `SHOW COLUMNS FROM Notification`
    );
    console.log('Notification table columns:', columns.map(col => col.Field));
    
    const [rows] = await db.promise().execute(
      `SELECT n.*, u.user_name 
       FROM Notification n
       LEFT JOIN UserAccount u ON n.UserAccount_id_user = u.id_user`
    );
    
    // Log a sample row to see actual data
    if (rows.length > 0) {
      console.log('Sample notification row:', rows[0]);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener todas las notificaciones:', error);
    res.status(500).json({ message: 'Error interno al obtener notificaciones' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
