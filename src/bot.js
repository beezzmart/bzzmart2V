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


  // Mensaje general para otros casos
  return ctx.reply(
    "Bienvenido a esta dulce aventura, recolecta miel cada 24 horas, junta muchos litros y hazte rico. Accede ahora y recibe como regalo 1 Colmena + 1 Abeja (free), entra rapido que se agotan:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ENTRAR", web_app: { url: webAppUrl } }],
        ],
      },
    }
  ); 
});



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
