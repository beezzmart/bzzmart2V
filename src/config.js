require('dotenv').config();

module.exports = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
ton: {
    apiUrl: process.env.TON_API_URL,
    privateKey: process.env.TON_WALLET_PRIVATE_KEY,
    publicAddress: process.env.TON_WALLET_PUBLIC_ADDRESS,
  },
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
 },
gameSettings: {
    dailyReward: {
      free: 1,
      standard: 3,
      gold: 5,
    },
    lifespan: {
      free: 200,
      standard: 260,
      gold: 360,
    },
  gotperli: 100,
      tonperli: 1,
    maxBeesPerColony: 100,
    maxColonies: 6,
    colonyCost: {
      basica: 15,
      estandar: 20,
      oro: 25,
      diamante: 30,
      rubi: 40,
    },
    beeCosts: {
      standard: 5,
      gold: 9,
    },
  },
};
