const axios = require("axios");
const { ton } = require("./config");

// ✅ Verificar una transacción TON en TonAPI
async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://tonapi.io/v1/blockchain/transaction/${txid}`;

    try {
        const response = await axios.get(apiUrl);
        const transaction = response.data;

        if (!transaction) {
            console.log("❌ No se encontró la transacción en TonAPI.");
            return false;
        }

        console.log("📌 Verificando transacción...");
        console.log("🔹 TXID:", txid);
        console.log("🔹 Wallet destino:", transaction.out_msgs[0]?.destination?.address);
        console.log("🔹 Monto enviado:", transaction.amount / 1e9, "TON");

        // ✅ Validar si la transacción es a la wallet correcta y por el monto exacto
        const isValid =
            transaction.out_msgs[0]?.destination?.address === ton.publicAddress &&
            parseFloat(transaction.amount / 1e9).toFixed(2) === parseFloat(expectedAmount).toFixed(2);

        if (isValid) {
            console.log("✅ Transacción válida.");
        } else {
            console.log("❌ Transacción inválida. Datos incorrectos.");
        }

        return isValid;
    } catch (error) {
        console.error("❌ Error verificando transacción TON:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
