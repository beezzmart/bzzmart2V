const axios = require("axios");
const { ton } = require("./config");

async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    try {
        console.log(`📌 Verificando transacción en TON API...`);
        console.log(`🔹 TXID ingresado: ${txid}`);

        // URL de TON API para obtener la transacción específica
        const url = `https://tonapi.io/v2/blockchain/transactions/${txid}`;
        console.log(`🔹 URL de consulta: ${url}`);

        // Hacer la petición HTTP a TON API
        const response = await axios.get(url);
        const transaction = response.data;

        // Validar si la respuesta es correcta
        if (!transaction || !transaction.in_msg) {
            console.log("❌ No se encontró información válida en TON API.");
            return false;
        }

        // Extraer datos relevantes
        const txAmountNano = transaction.in_msg.value; // Monto en NanoTON
        const txAmountTON = txAmountNano / 1e9; // Convertir a TON
        const txDestination = transaction.in_msg.destination?.address; // Dirección destino real

        console.log("🔍 Datos de la transacción obtenidos:", {
            txHash: txid,
            txAmountNano,
            txAmountTON,
            txDestination,
            expectedAmountNano: expectedAmount * 1e9, // Convertido a NanoTON
            expectedAmountTON: expectedAmount,
            expectedAddress: ton.publicAddress
        });

        // Validar la transacción
        if (
            txDestination === ton.publicAddress &&
            txAmountNano === expectedAmount * 1e9
        ) {
            console.log("✅ ¡Transacción válida!");
            return true;
        } else {
            console.log("❌ La transacción no coincide con los datos esperados.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción en TON API:", error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
