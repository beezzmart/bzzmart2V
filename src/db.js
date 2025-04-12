const mysql = require('mysql2/promise');

let connection;

async function connectDB() {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      multipleStatements: true,
    });

    console.log('📦 Conexión a MySQL exitosa');

async function createTransactionsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        txid VARCHAR(255) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type ENUM('bee', 'colony') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )


CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  gotas INT DEFAULT 0,
  last_collected DATE DEFAULT NULL
)

CREATE TABLE IF NOT EXISTS colonies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  colony_name VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id)
)

CREATE TABLE IF NOT EXISTS bees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  colony_id INT NOT NULL,
  type ENUM('free', 'standard', 'gold') NOT NULL,
  birth_date DATE NOT NULL,
  FOREIGN KEY (colony_id) REFERENCES colonies(id)
)

CREATE TABLE IF NOT EXISTS withdraw_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gotas INT NOT NULL,
    ton_amount DECIMAL(18, 6) NOT NULL,
    wallet_address VARCHAR(100) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id)
)
    `);
    console.log("✅ Tabla 'transactions' verificada o creada.");
  } catch (error) {
    console.error("❌ Error al crear la tabla 'transactions':", error);
  }
}

// Llamar a la función al iniciar el servidor
createTransactionsTable();




    
    // Manejar desconexión y reconexión
    connection.on('error', async (err) => {
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('⚠️ Conexión perdida con MySQL, intentando reconectar...');
        await connectDB();
      } else {
        throw err;
      }
    });

    return connection;
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    throw error;
  }
}

async function query(sql, params = []) {
  try {
    // Verificar si la conexión está cerrada y volver a conectarse si es necesario
    if (!connection || connection.connection.state === 'disconnected') {
      console.warn('🔄 Reconectando a MySQL...');
      await connectDB();
    }
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Error en la consulta SQL:', error);
    throw error;
  }
}




module.exports = { connectDB, query  };
