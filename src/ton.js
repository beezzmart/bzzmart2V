const axios = require("axios");
const { ton } = require("./config");

async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    try {
        console.log(`📌 Verificando transacción en TON API...`);
        console.log(`🔹 TXID ingresado: ${txid}`);

        // URL de TON API para obtener la transacción
        const url = `https://tonapi.io/v2/blockchain/transactions/${txid}`;
        console.log(`🔹 URL de consulta: ${url}`);

        // Hacer la petición HTTP a TON API
        const response = await axios.get(url);

        // Validar si la respuesta es correcta
        if (!response.data || !response.data.account) {
            console.log("❌ No se encontró información en TON API.");
            return false;
        }

        // Obtener datos de la transacción
        const transaction = response.data;
        const txAmount = parseFloat(transaction.amount) * 1e9; // Convertir a nanotons
        const txDestination = transaction.account.address; // Dirección destino real

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
