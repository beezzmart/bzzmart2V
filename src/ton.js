const axios = require("axios");
const { ton } = require("./config");

// ✅ Verificar transacción en TON Explorer
async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://explorer.toncoin.org/api/v1/transactions?account=${ton.publicAddress}&limit=50`;

    try {
        const response = await axios.get(apiUrl);
        const transactions = response.data;

        if (!transactions || transactions.length === 0) {
            console.log("❌ No se encontraron transacciones en TON Explorer.");
            return false;
        }

        console.log("📌 Verificando transacción en TON Explorer...");
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 Últimas transacciones recibidas:", transactions);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash; // ✅ Usamos tx.hash directamente
            const txDestination = tx.destination; // ✅ Verificar dirección destino
            const txAmount = parseFloat(tx.amount) / 1e9; // Convertir de nanoton a TON

            return (
                txHash === txid && // Comparar TXID
                txAmount === parseFloat(expectedAmount) && // Comparar monto en TON
                txDestination === ton.publicAddress // Comparar dirección destino
            );
        });

        if (validTransaction) {
            console.log("✅ Transacción válida encontrada en TON Explorer:", validTransaction);
            return true;
        } else {
            console.log("❌ No se encontró una transacción válida con este TXID.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción en TON Explorer:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
