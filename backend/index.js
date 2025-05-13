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

// Store reset tokens in memory (in a production app, these would be stored in a database)
const resetTokens = {};

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
    const passwordMatch = await bcrypt.compare(password, user.password);

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
    const [columns] = await db.promise().execute(
      `SHOW COLUMNS FROM Invoice`
    );
    console.log('Invoice table columns:', columns.map(col => col.Field));
    
    const [rows] = await db.promise().execute(
      `SELECT i.*, u.user_name 
       FROM Invoice i
       LEFT JOIN UserAccount u ON i.UserAccount_id_user = u.id_user`
    );
    
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
    const [columns] = await db.promise().execute(
      `SHOW COLUMNS FROM Notification`
    );
    console.log('Notification table columns:', columns.map(col => col.Field));
    
    const [rows] = await db.promise().execute(
      `SELECT n.*, u.user_name 
       FROM Notification n
       LEFT JOIN UserAccount u ON n.UserAccount_id_user = u.id_user`
    );
    
    if (rows.length > 0) {
      console.log('Sample notification row:', rows[0]);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener todas las notificaciones:', error);
    res.status(500).json({ message: 'Error interno al obtener notificaciones' });
  }
});

// Endpoint to check for upcoming invoice due dates for a specific user
app.get('/invoice-alerts/:id_user', async (req, res) => {
  const { id_user } = req.params;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    const todayFormatted = today.toISOString().split('T')[0];
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    const threeDaysLaterFormatted = threeDaysLater.toISOString().split('T')[0];
    
    const [urgentInvoices] = await db.promise().execute(
      `SELECT id_invoice, invoice_number, total_amount, due_date, invoice_status 
       FROM Invoice 
       WHERE UserAccount_id_user = ? 
       AND invoice_status NOT IN ('paid', 'radicada')
       AND due_date = ?`,
      [id_user, tomorrowFormatted]
    );
    
    const [normalInvoices] = await db.promise().execute(
      `SELECT id_invoice, invoice_number, total_amount, due_date, invoice_status 
       FROM Invoice 
       WHERE UserAccount_id_user = ? 
       AND invoice_status NOT IN ('paid', 'radicada')
       AND due_date > ? AND due_date <= ?`,
      [id_user, tomorrowFormatted, threeDaysLaterFormatted]
    );
    
    const alerts = {
      urgent: urgentInvoices.map(invoice => ({
        type: 'urgent',
        message: `Factura #${invoice.invoice_number} por $${invoice.total_amount} vence MAÑANA`,
        invoice_id: invoice.id_invoice,
        invoice_number: invoice.invoice_number,
        due_date: invoice.due_date
      })),
      normal: normalInvoices.map(invoice => ({
        type: 'normal',
        message: `Factura #${invoice.invoice_number} por $${invoice.total_amount} vence pronto (${formatDate(invoice.due_date)})`,
        invoice_id: invoice.id_invoice,
        invoice_number: invoice.invoice_number,
        due_date: invoice.due_date
      }))
    };
    
    console.log(`Saving ${alerts.urgent.length} urgent alerts and ${alerts.normal.length} normal alerts to database`);
    
    const [userRows] = await db.promise().execute(
      `SELECT Person_id_person FROM UserAccount WHERE id_user = ?`,
      [id_user]
    );
    
    if (userRows.length === 0) {
      console.error(`User with id ${id_user} not found when trying to save notifications`);
    } else {
      const person_id = userRows[0].Person_id_person;
      
      const savedNotifications = [];
      for (const alert of [...alerts.urgent, ...alerts.normal]) {
        try {
          const [result] = await db.promise().execute(
            `INSERT INTO Notification 
             (message, sent_date, type, is_read, UserAccount_id_user, UserAccount_Person_id_person)
             VALUES (?, NOW(), ?, 0, ?, ?)`,
            [
              alert.message, 
              alert.type === 'urgent' ? 'alerta' : 'info', 
              id_user, 
              person_id
            ]
          );
          
          savedNotifications.push({
            id: result.insertId,
            message: alert.message,
            type: alert.type
          });
          
        } catch (err) {
          console.error('Error saving notification:', err);
        }
      }
      
      console.log(`Successfully saved ${savedNotifications.length} notifications:`, 
        savedNotifications.map(n => `ID ${n.id}: ${n.type} - "${n.message}"`).join(', '));
    }
    
    res.json(alerts);
  } catch (error) {
    console.error('Error checking invoice due dates:', error);
    res.status(500).json({ message: 'Error checking invoice due dates' });
  }
});

// Request password reset
app.post("/request-reset", async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ message: "El nombre de usuario es requerido" });
  }
  
  try {
    const [rows] = await db.promise().execute(
      `SELECT UA.id_user, P.email 
       FROM UserAccount UA
       INNER JOIN Person P ON UA.Person_id_person = P.id_person
       WHERE UA.user_name = ? AND UA.state = 'activo'`,
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    const user = rows[0];
    
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    resetTokens[token] = {
      userId: user.id_user,
      expires: Date.now() + 3600000
    };
    
    res.json({ 
      message: "Se ha enviado un enlace de restablecimiento a tu correo electrónico",
      token: token,
      email: user.email
    });
    
  } catch (error) {
    console.error("Error en solicitud de restablecimiento:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

// Reset password
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token y nueva contraseña requeridos" });
  }
  
  if (!resetTokens[token] || resetTokens[token].expires < Date.now()) {
    return res.status(401).json({ 
      message: resetTokens[token] ? "El token ha expirado" : "Token inválido"
    });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    
    await db.promise().execute(
      `UPDATE UserAccount SET password = ? WHERE id_user = ?`,
      [hashedPassword, resetTokens[token].userId]
    );
    
    delete resetTokens[token];
    
    res.json({ message: "Contraseña actualizada con éxito" });
    
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ message: "Error al actualizar la contraseña" });
  }
});

// Helper function to format dates for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
