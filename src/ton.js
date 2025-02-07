const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para convertir TXID hexadecimal a Base64
function hexToBase64(hex) {
    return Buffer.from(hex, "hex").toString("base64");
}

// ✅ Verificar transacción en TonCenter (ajustada para formato Base64)
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
        console.log("🔹 TXID ingresado (Hex):", txid);

        // 🔄 Convertir TXID a Base64 (porque TonCenter devuelve el hash en Base64)
        const txidBase64 = hexToBase64(txid);
        console.log("🔹 TXID convertido a Base64:", txidBase64);

        console.log("🔹 Últimas 50 transacciones:", transactions);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx =>
            tx.transaction_id.hash === txidBase64 &&  // Ahora comparando en Base64
            parseFloat(tx.value) / 1e9 === parseFloat(expectedAmount) &&
            tx.out_msgs.some(msg => msg.destination.address === ton.publicAddress) // Verifica la wallet de destino
        );

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
