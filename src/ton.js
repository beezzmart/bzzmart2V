const axios = require("axios");
const { ton } = require("./config");

// ✅ Extraer y limpiar dirección TON correctamente
function cleanTONAddress(address) {
    if (!address) return "";

    // Eliminar el prefijo "0:" (workchain)
    let cleaned = address.replace(/^0:/, "").toLowerCase();

    // Asegurar que sean 64 caracteres exactos
    return cleaned.length > 64 ? cleaned.slice(-64) : cleaned;
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

        // 🔹 Convertir la dirección esperada de TON a HEX
        let expectedAddressHex = cleanTONAddress(ton.publicAddress);
        console.log("🔹 Dirección esperada (HEX):", expectedAddressHex);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmount = parseInt(tx.in_msg?.value || tx.value || 0, 10); // Ya está en nanoTON

            // 🔹 Obtener dirección destino y normalizarla
            let txDestinationRaw = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            let txDestination = cleanTONAddress(txDestinationRaw); // Normalizamos para comparar bien

            console.log("🔍 Comparando:", {
                txHash,
                txAmount,
                txDestinationRaw,  // 🔹 Dirección original antes de normalizar
                txDestination,      // 🔹 Dirección después de normalizar
                expectedAmount,     // 🔹 Comparación exacta con nanoTON
                expectedAddressHex  // 🔹 Dirección esperada en HEX
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
