const axios = require("axios");
const { ton } = require("./config");

// ✅ Verificar transacción en TonCenter
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
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 Últimas 50 transacciones:", transactions);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.transaction_id?.hash || tx.hash; // ✅ Usamos tx.hash si transaction_id no existe
            const txDestination = tx.in_msg?.destination?.account_address;
            const txAmount = parseFloat(tx.in_msg?.value) / 1e9;

            return (
                txHash === txid && // Comparar TXID
                txAmount === parseFloat(expectedAmount) && // Comparar monto en TON
                txDestination === ton.publicAddress // Comparar dirección destino
            );
        });

        if (validTransaction) {
            console.log("✅ Transacción válida encontrada:", validTransaction);
            return true;
        } else {
            console.log("❌ No se encontró una transacción válida con este TXID.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción TON:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
