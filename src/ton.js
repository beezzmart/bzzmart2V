const axios = require("axios");
const { ton } = require("./config");
const TonWeb = require("tonweb"); // Usar TonWeb para convertir direcciones

// 🔹 Convertir dirección a formato raw (sin "EQ" o "UQ")
function normalizeAddress(address) {
    try {
        const tonweb = new TonWeb();
        return tonweb.utils.toUserFriendlyAddress(tonweb.utils.address(address), true);
    } catch (error) {
        console.error("❌ Error convirtiendo dirección:", error.message);
        return address; // Devolver la original si falla la conversión
    }
}

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

        // 🔹 Normalizar la dirección para comparar correctamente
        const normalizedWallet = normalizeAddress(ton.publicAddress);
        console.log("🔹 Dirección normalizada:", normalizedWallet);

        console.log("📌 Verificando transacción...");
        console.log("🔹 TXID ingresado (Hex):", txid);
        console.log("🔹 Últimas 50 transacciones:", transactions);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx =>
            tx.in_msg &&
            tx.in_msg.body_hash === txid && // Comparar con `body_hash` (Hex)
            parseFloat(tx.in_msg.value) / 1e9 === parseFloat(expectedAmount) && // Monto en TON
            normalizeAddress(tx.in_msg.destination.address) === normalizedWallet // Comparar direcciones normalizadas
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
