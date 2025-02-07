const axios = require("axios");
const { ton } = require("./config");

// ✅ Convertir dirección TON Base64 → Hex sin errores
function normalizeTONAddress(base64Address) {
    let hex = Buffer.from(base64Address, "base64").toString("hex").toLowerCase();

    // 🔹 Si la dirección tiene prefijo "0:", lo quitamos
    if (hex.length > 64) {
        hex = hex.substring(hex.length - 64);
    }

    return hex;
}

// ✅ Verificar transacción TON con comparación precisa
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

        // 🔹 Convertir la dirección esperada de TON a HEX
        let expectedAddressHex = normalizeTONAddress(ton.publicAddress);
        console.log("🔹 Dirección esperada (HEX):", expectedAddressHex);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmount = parseInt(tx.in_msg?.value || tx.value || 0, 10); // Ya está en nanoTON

            // 🔹 Convertir dirección destino de TON a HEX
            let txDestination = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            txDestination = normalizeTONAddress(txDestination); // Normalizamos para comparar bien

            console.log("🔍 Comparando:", {
                txHash,
                txAmount,
                txDestination,
                expectedAmount, // 🔹 Comparación directa con nanoTON
                expectedAddressHex
            });

            return (
                txHash === txid && // 🔹 TXID debe coincidir
                txAmount === expectedAmount && // 🔹 Comparación exacta en nanoTON
                txDestination === expectedAddressHex // 🔹 Comparación exacta en HEX
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
