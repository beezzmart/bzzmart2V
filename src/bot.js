const { Telegraf } = require("telegraf");
const express = require("express");
const path = require("path");
const apiRoutes = require("./api");
const { connectDB, query } = require("./db");
const {
  registerUser,
  buyColony,
  addBee,
  collectNectar,
  retirarTon,
} = require("./gameLogic");
const { telegramToken } = require("./config");

const bot = new Telegraf(telegramToken);

// Configurar Express
const app = express();
app.use(express.json());

// Conectar a la base de datos
async function startBot() {
  try {
    await connectDB(); // Conectar a la base de datos
    console.log("📦 Conexión a la base de datos establecida.");

    // Rutas del bot
// Manejar el comando /start
bot.start((ctx) => {
  const userId = ctx.from.id; // ID del usuario
 // Generar la URL de la WebApp con el user_id
  const webAppUrl = `https://beesmart.ct.ws/public/?user_id=${userId}`;
  
async function registerUser(telegramId) {
  // Verificar si el usuario ya está registrado
  const existingUser = await query('SELECT id FROM users WHERE telegram_id = ?', [telegramId]);
  
  if (existingUser.length > 0) {
      return ctx.reply(
    "¡Ya estás registrado! Recolecta miel cada 24 horas, junta muchos litros e intercambialos por Toncoin.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ENTRAR", web_app: { url: webAppUrl } }],
        ],
      },
    }
  ); 
  }

  // Insertar el usuario en la tabla `users`
  const result = await query('INSERT INTO users (telegram_id, gotas, last_collected, tutorial) VALUES (?, ?, ?, ?)', [telegramId, 0, null, 0]);
  const userId = result.insertId;

  // Crear una colmena inicial para el usuario
  const colonyResult = await query('INSERT INTO colonies (user_id, colony_name, type, created_at) VALUES (?, ?, ?, NOW())', [userId, 'Colmena Inicial', 'free']);
  const colonyId = colonyResult.insertId;

  // Agregar una abeja free a la colmena inicial
  await query('INSERT INTO bees (colony_id, type, birth_date) VALUES (?, ?, ?)', [colonyId, 'free', new Date()]);
  
      return ctx.reply(
    "Recibiste tu primera colmena con una abeja Free. Recolecta miel cada 24 horas, junta muchos litros e intercambialos por Toncoin.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ENTRAR", web_app: { url: webAppUrl } }],
        ],
      },
    }
  ); 
  
}

 






    // Iniciar el bot
    bot.launch();
    console.log("🤖 Bot de Telegram en funcionamiento.");

    // Configuración de Express
    // Ruta para servir los archivos estáticos del frontend
    app.use(express.static(path.join(__dirname, "../public")));

    // Agregar el manejador de la API
    const api = require("./api");
    app.use("/api", api);

    // Iniciar el servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`🌐 Servidor web escuchando en el puerto ${PORT}`),
    );
  } catch (error) {
    console.error("❌ Error al iniciar el bot:", error);
  }
}

startBot();
