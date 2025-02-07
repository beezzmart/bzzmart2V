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

        // Obtener datos de la transacción
        const txAmount = parseFloat(transaction.in_msg.value); // Monto recibido en nanotons
        const txDestination = transaction.in_msg.destination?.address; // Dirección destino real

        console.log("🔍 Comparando:", {
            txHash: txid,
            txAmount,
            txDestination,
            expectedAmount: expectedAmount * 1e9, // Convertir a nanotons
            expectedAddress: ton.publicAddress
        });

        // Comparar monto y dirección destino
        if (
            txDestination === ton.publicAddress &&
            txAmount === expectedAmount * 1e9
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
