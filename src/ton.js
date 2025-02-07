const axios = require("axios");
const { ton } = require("./config");

// ✅ Verificar transacción usando TONCENTER (No requiere API Key)
async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://toncenter.com/api/v2/getTransactions?address=${ton.publicAddress}&limit=50`;

    try {
        const response = await axios.get(apiUrl);
        const transactions = response.data.result;

        if (!transactions || transactions.length === 0) {
            console.log("❌ No se encontraron transacciones en TonCenter.");
            return false;
        }

        console.log("📌 Verificando transacción...");
        console.log("🔹 TXID a verificar:", txid);
        console.log("🔹 Últimas 50 transacciones:", transactions);

        // Buscar la transacción por TXID y verificar el monto
        const validTransaction = transactions.find(tx =>
            tx.transaction_id.hash === txid &&
            parseFloat(tx.value) / 1e9 === parseFloat(expectedAmount) &&
            tx.out_msgs.some(msg => msg.destination.address === ton.publicAddress) // Verifica la wallet de destino
        );

        console.log("🔍 Transacción encontrada:", validTransaction || "No encontrada");
        return validTransaction !== undefined;
    } catch (error) {
        console.error("❌ Error verificando transacción TON:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
