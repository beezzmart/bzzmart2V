const axios = require("axios");
const { ton } = require("./config");

// 🔍 Verificar una transacción TON en Tonviewer
async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://tonviewer.com/transaction/${txid}`;

    try {
        const response = await axios.get(apiUrl);
        const txData = response.data;

        // 📌 Verificar si la transacción es válida
        if (!txData || !txData.in_msg) {
            console.error("❌ Transacción no encontrada en Tonviewer.");
            return false;
        }

        // 🔹 Convertir el monto esperado a nanoTON (1 TON = 1e9 nanoTON)
        const expectedNanoTON = BigInt(expectedAmount * 1e9);
        const transactionNanoTON = BigInt(txData.in_msg.value || 0); 

        // 🔍 Verificar que la transacción cumple con:
        // 1️⃣ El monto enviado es el correcto
        // 2️⃣ La dirección de destino es nuestra wallet pública
        if (transactionNanoTON === expectedNanoTON && txData.in_msg.destination === ton.publicAddress) {
            console.log("✅ Transacción válida:", txid);
            return true;
        } else {
            console.error("❌ La transacción no cumple con los requisitos.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción en Tonviewer:", error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
