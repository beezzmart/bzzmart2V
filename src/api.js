const cors = require("cors");
const express = require("express");
const { query } = require("./db");
const { gameSettings } = require("./config");
const { verifyTONTransaction } = require("./ton"); // Verifica transacciones TON.
const router = express.Router();

const https = require("https");

// Keep-alive para Railway
setInterval(() => {
  https.get("https://bzzmart2v.onrender.com/api/user_status");
  console.log("Keep-alive ping enviado");
}, 5 * 60 * 1000); // Cada 5 minutos

router.use(cors());
router.use(express.json());


// Ruta: Obtener el estado del usuario
router.get("/user_status", async (req, res) => {
  const telegramId = req.query.id;

  if (!telegramId) {
    return res.status(400).json({ success: false, error: "ID de usuario no proporcionado." });
  }

  try {
    console.log("Obteniendo datos del usuario con ID:", telegramId);

    const user = await query("SELECT id, gotas, last_collected, tutorial FROM users WHERE telegram_id = ?", [telegramId]);

    if (user.length === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado." });
    }

    const userId = user[0].id;
const tutorial = user[0].tutorial; // Agregar el estado del tutorial
    const gotas = user[0].gotas;
    const lastCollected = user[0].last_collected;

    // Obtener colonias del usuario con información adicional
 const colonies = await query(
      "SELECT id, colony_name AS nombre, created_at AS fecha_creacion, type FROM colonies WHERE user_id = ?",
      [userId]
    );

 // Obtener el total de abejas por tipo en cada colmena
for (let colmena of colonies) {
    const beeCounts = await query("SELECT COUNT(*) as total, type FROM bees WHERE colony_id = ? GROUP BY type", [colmena.id]);

    // Convertir el resultado en un objeto { tipo: cantidad }
    colmena.abejas_por_tipo = {};
    beeCounts.forEach(bee => {
        colmena.abejas_por_tipo[bee.type] = bee.total;
    });

    // También guardar el total de abejas
    colmena.total_abejas = beeCounts.reduce((sum, bee) => sum + bee.total, 0);
}



    // Obtener la cantidad total de abejas del usuario
    const bees = await query(
      "SELECT COUNT(*) as total FROM bees WHERE colony_id IN (SELECT id FROM colonies WHERE user_id = ?)",
      [userId]
    );
     

    
    res.json({
      success: true,
      gotas,
      last_collected: lastCollected,
         tutorial, //  Ahora enviamos la info del tutorial
      colonias: colonies.map(colony => colony.id),  // Mantiene la estructura original (solo los IDs)
      colonias_info: Array.isArray(colonies) ? colonies : [], // Información completa de cada colmena
      abejas: bees[0].total, // Se mantiene la cuenta total de abejas
     
    });
  } catch (error) {
    console.error("Error al obtener el estado del usuario:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor." });
  }
});

// Ruta: Configuración del juego (frontend puede acceder a estos valores)
router.get("/game_config", (req, res) => {
  res.json({
    success: true,
    config: gameSettings,
  });
});


// Ruta: Recolectar néctar
router.post("/collect_nectar", async (req, res) => {
  const telegramId = req.body.id;

  if (!telegramId) {
    return res.status(400).json({ success: false, error: "ID de usuario no proporcionado." });
  }

  try {
    const user = await query(
      "SELECT id, last_collected FROM users WHERE telegram_id = ?",
      [telegramId]
    );

    if (user.length === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado." });
    }

    const userId = user[0].id;
    const lastCollected = user[0].last_collected;
   

    // Verificar las 24 horas antes de recolectar
    const now = new Date();
    const lastCollectedDate = lastCollected ? new Date(lastCollected) : null;

    if (lastCollectedDate && now - lastCollectedDate < 24 * 60 * 60 * 1000) {
      return res.json({
        success: false,
        error: "Ya recolectaste néctar en las últimas 24 horas.",
      });
    }

    // Calcular la producción diaria de gotas según las abejas del usuario
    const bees = await query(
      "SELECT type FROM bees WHERE colony_id IN (SELECT id FROM colonies WHERE user_id = ?)",
      [userId]
    );

    let totalProduction = 0;
    bees.forEach((bee) => {
      totalProduction += gameSettings.dailyReward[bee.type] || 0;
    });

    // Formatear la fecha actual en `YYYY-MM-DD HH:MM`
   const formattedDate = now.toISOString().slice(0, 19).replace("T", " ");
    await query("UPDATE users SET gotas = gotas + ?, last_collected = ? WHERE id = ?", [totalProduction, formattedDate, userId]);

    // Actualizar las gotas y la última fecha de recolección en la base de datos
    await query(
      "UPDATE users SET gotas = gotas + ?, last_collected = ? WHERE id = ?",
      [totalProduction, formattedDate, userId]
    );

    res.json({ success: true, gotas: totalProduction, lastCollected: formattedDate });
  } catch (error) {
    console.error("Error al recolectar néctar:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor." });
  }
});



// 📌 Ruta: Comprar abeja
router.post("/add_bee", async (req, res) => {
  const { id: telegramId, colonyId, beeType, txid, quantity } = req.body;

  console.log("🔍 Datos recibidos en backend:", { telegramId, colonyId, beeType, txid, quantity });

  if (!telegramId || !colonyId || !beeType || !quantity || !txid) {
    return res.status(400).json({ success: false, error: "⚠️ Faltan datos necesarios en la API." });
  }

  try {
    const user = await query("SELECT id FROM users WHERE telegram_id = ?", [telegramId]);
    if (user.length === 0) return res.status(404).json({ success: false, error: "Usuario no encontrado." });

    const userId = user[0].id;

    const colony = await query("SELECT id, type FROM colonies WHERE id = ? AND user_id = ?", [colonyId, userId]);
    if (colony.length === 0) return res.status(404).json({ success: false, error: "Colmena no encontrada." });

    const colonyType = colony[0].type;
    if (colonyType === "free") {
      return res.status(400).json({ success: false, error: "No puedes agregar abejas a la colmena Free." });
    }

    const allowedBees = gameSettings.maxBeesPerColony[colonyType] || {};
    const maxAllowed = allowedBees[beeType] || 0;

    if (!allowedBees.hasOwnProperty(beeType)) {
      return res.status(400).json({ success: false, error: `No puedes agregar ${beeType} en una colmena ${colonyType}.` });
    }

    const beeCount = await query("SELECT COUNT(*) as total FROM bees WHERE colony_id = ? AND type = ?", [colonyId, beeType]);
    if (beeCount[0].total + quantity > maxAllowed) {
      return res.status(400).json({ success: false, error: `No puedes tener más de ${maxAllowed} abejas ${beeType}.` });
    }

    const beeCost = gameSettings.beeCosts[beeType];
    if (!beeCost) return res.status(400).json({ success: false, error: "Tipo de abeja no válido." });

    const totalCost = beeCost * quantity;

    const existingTx = await query("SELECT * FROM transactions WHERE txid = ?", [txid]);
    if (existingTx.length > 0) {
      return res.status(400).json({ success: false, error: "Esta transacción ya ha sido utilizada." });
    }

    // ✅ Verificar la transacción en TON API
    const transactionValid = await verifyTONTransaction(txid, totalCost, userId);
    if (!transactionValid) {
      return res.status(400).json({ success: false, error: "Transacción no válida o no encontrada." });
    }

    // ✅ Insertar abejas en la colmena
    for (let i = 0; i < quantity; i++) {
      await query("INSERT INTO bees (colony_id, type, birth_date) VALUES (?, ?, NOW())", [colonyId, beeType]);
    }

    // ✅ Registrar la transacción
    const amountTON = totalCost / 1e9;
    await query("INSERT INTO transactions (txid, user_id, amount, type) VALUES (?, ?, ?, ?)", [
      txid,
      userId,
      amountTON,
      "bee"
    ]);

    res.json({ success: true, message: `✅ ${quantity} abeja(s) ${beeType} añadida(s) a la colmena ${colonyId}.` });

  } catch (error) {
    console.error("❌ Error al agregar abejas:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor." });
  }
});



// 📌 Ruta: Comprar colmena
router.post("/buy_colony", async (req, res) => {
  const { id: telegramId, colonyType, txid } = req.body;

  console.log("🔍 Datos recibidos en backend:", { telegramId, colonyType, txid });

  if (!telegramId || !txid || !colonyType) {
    return res.status(400).json({ success: false, error: "⚠️ Faltan datos necesarios." });
  }

  try {
    const user = await query("SELECT id FROM users WHERE telegram_id = ?", [telegramId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado." });
    }

    const userId = user[0].id;

    // 🔹 Verificar cuántas colmenas tiene el usuario
    const userColonies = await query("SELECT COUNT(*) as total FROM colonies WHERE user_id = ?", [userId]);
    if (userColonies[0].total >= gameSettings.maxColonies) {
      return res.status(400).json({ success: false, error: "🚫 Has alcanzado el límite de colmenas (máximo 6)." });
    }

    // 🔹 Verificar si ya tiene una colmena del mismo tipo
    const existingColony = await query("SELECT id FROM colonies WHERE user_id = ? AND type = ?", [userId, colonyType]);
    if (existingColony.length > 0) {
      return res.status(400).json({ success: false, error: `🚫 Ya posees una colmena de tipo ${colonyType}.` });
    }

    // 🔹 Validar que el tipo de colmena es válido
    const colonyCosts = gameSettings.colonyCost;
    if (!(colonyType in colonyCosts)) {
      return res.status(400).json({ success: false, error: "🚫 Tipo de colmena no válido." });
    }

    const colonyCost = colonyCosts[colonyType];

    // 🔹 Verificar si la transacción ya fue usada
    const existingTx = await query("SELECT * FROM transactions WHERE txid = ?", [txid]);
    if (existingTx.length > 0) {
      return res.status(400).json({ success: false, error: "🚫 Esta transacción ya ha sido utilizada." });
    }

    // ✅ Verificar la transacción en TON API
    const transactionValid = await verifyTONTransaction(txid, colonyCost, userId);
    if (!transactionValid) {
      return res.status(400).json({ success: false, error: "🚫 Transacción no válida o no encontrada." });
    }

    // ✅ Agregar la colmena a la base de datos
    await query("INSERT INTO colonies (user_id, colony_name, type, created_at) VALUES (?, ?, ?, NOW())", [
      userId,
      `Colmena ${colonyType}`,
      colonyType
    ]);

    // ✅ Registrar la transacción
    const amountTON = colonyCost / 1e9;
    await query("INSERT INTO transactions (txid, user_id, amount, type) VALUES (?, ?, ?, ?)", [
      txid,
      userId,
      amountTON,
      "colony"
    ]);

    res.json({ success: true, message: `✅ Colmena ${colonyType} comprada con éxito.` });

  } catch (error) {
    console.error("❌ Error al comprar colmena:", error);
    res.status(500).json({ success: false, error: "❌ Error interno del servidor." });
  }
});







// Ruta: Retirar TON
router.post("/withdraw", async (req, res) => {
  const { id: telegramId, litros, wallet, memow } = req.body;

  if (!telegramId || !litros || !wallet || !memow) {
    return res
      .status(400)
      .json({ success: false, error: "Faltan datos necesarios." });
  }

  try {
    const gotasNecesarias = litros * gameSettings.gotperli;

    if (litros < gameSettings.minwit) {
      return res.status(400).json({
        success: false,
        error: `El monto mínimo para retirar es 1 litro (${gameSettings.gotperli * gameSettings.minwit} gotas).`,
      });
    }

    const user = await query(
      "SELECT id, gotas FROM users WHERE telegram_id = ?",
      [telegramId],
    );

    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado." });
    }

    const userId = user[0].id;
    const currentGotas = user[0].gotas;

    if (currentGotas < gotasNecesarias) {
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente. Necesitas ${gotasNecesarias} gotas para retirar ${litros} litros.`,
      });
    }

    await query(
      "INSERT INTO withdraw_requests (user_id, gotas, ton_amount, wallet_address, memo_wallet) VALUES (?, ?, ?, ?, ?)",
      [userId, gotasNecesarias, litros, wallet, memow],
    );

    await query("UPDATE users SET gotas = gotas - ? WHERE id = ?", [
      gotasNecesarias,
      userId,
    ]);

    res.json({
      success: true,
      message: "Solicitud de retiro registrada con éxito.",
    });
  } catch (error) {
    console.error("Error al procesar el retiro:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor." });
  }
});

// Ruta: Marcar el tutorial como completado
router.post("/update_tutorial", async (req, res) => {
  const { id: telegramId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ success: false, error: "ID de usuario no proporcionado." });
  }

  try {
    const user = await query("SELECT id FROM users WHERE telegram_id = ?", [telegramId]);

    if (user.length === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado." });
    }

    const userId = user[0].id;

    await query("UPDATE users SET tutorial = 1 WHERE id = ?", [userId]);

    res.json({ success: true, message: "Tutorial completado." });
  } catch (error) {
    console.error("Error al actualizar tutorial:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor." });
  }
});



module.exports = router;
