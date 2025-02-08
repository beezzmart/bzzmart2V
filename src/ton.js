const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para obtener dirección en Base64 desde TON API
async function getBase64Address(hexAddress) {
    try {
        const apiUrl = `https://tonapi.io/v2/blockchain/accounts/${hexAddress}`;
        const response = await axios.get(apiUrl);
        return response.data.address || ""; // 🔹 Devuelve la dirección en Base64
    } catch (error) {
        console.error("❌ Error obteniendo dirección Base64 desde TON API:", error.message);
        return "";
    }
}

// ✅ Verificar transacción en TON API
async function verifyTONTransaction(txid, expectedAmountNano, telegramId) {
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

        // ✅ Obtener la dirección esperada en Base64 desde TON API
        let expectedAddressBase64 = await getBase64Address(ton.publicAddress);
        console.log("🔹 Dirección esperada (Base64 TON):", expectedAddressBase64);

        // 🔍 Buscar la transacción correcta
        const validTransaction = await Promise.all(transactions.map(async (tx) => {
            const txHash = tx.hash;
            const txAmountNano = parseInt(tx.in_msg?.value || tx.value || 0, 10);

            // 🔹 Obtener la dirección en Base64 desde TON API
            let txDestinationRaw = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            let txDestinationBase64 = await getBase64Address(txDestinationRaw);

            console.log("🔍 Comparando:", {
                txHash,
                txAmountNano,
                txDestinationRaw,      // 🔹 Dirección en HEX antes de conversión
                txDestinationBase64,   // 🔹 Dirección en Base64 obtenida desde TON API
                expectedAmountNano,    // 🔹 Monto esperado en nanoTON
                expectedAddressBase64  // 🔹 Dirección esperada en formato Base64
            });

            return (
                txHash.toLowerCase().trim() === txid.toLowerCase().trim() && // ✅ TXID debe coincidir
                txAmountNano === expectedAmountNano &&                      // ✅ Monto en nanoTON debe coincidir
                txDestinationBase64 === expectedAddressBase64               // ✅ Dirección en Base64 debe coincidir
            );
        }));

        if (validTransaction.includes(true)) {
            console.log("✅ TRANSACCIÓN VÁLIDA ENCONTRADA");
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
