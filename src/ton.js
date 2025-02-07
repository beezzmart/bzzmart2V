const axios = require("axios");
const { ton } = require("./config");

// ✅ Convertir Base64 a Hex sin librerías externas
function base64ToHex(base64) {
    return Buffer.from(base64, "base64").toString("hex").toLowerCase();
}

// ✅ Verificar transacción en TON API
async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://tonapi.io/v2/blockchain/accounts/${ton.publicAddress}/transactions?limit=50`;

    try {
        const response = await axios.get(apiUrl);
        const transactions = response.data.transactions;

        if (!transactions || transactions.length === 0) {
            console.log("❌ No se encontraron transacciones en TON API.");
            return false;
        }

        console.log("📌 Verificando transacción...");
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 Últimas transacciones recibidas:", transactions.map(tx => tx.hash));

        // 🔹 Convertir la dirección en `config.js` de Base64 a Hex
        const expectedAddressHex = base64ToHex(ton.publicAddress);
        console.log("🔹 Dirección esperada (HEX):", expectedAddressHex);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmount = parseInt(tx.in_msg?.value || tx.value || 0, 10); // Monto en nanoTON
            const expectedNanoTON = expectedAmount * 1e9; // Convertir TON a nanoTON

            // Extraer dirección destino y convertirla a hex
            let txDestination = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            txDestination = txDestination.toLowerCase(); // Convertir todo a minúsculas

            console.log("🔍 Comparando:", {
                txHash,
                txAmount,
                txDestination,
                expectedNanoTON,
                expectedAddressHex
            });

            return (
                txHash === txid && // Comparar TXID
                txAmount === expectedNanoTON && // Comparar monto
                txDestination === expectedAddressHex // Comparar dirección en HEX
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
        console.error("❌ Error verificando transacción TON API:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
