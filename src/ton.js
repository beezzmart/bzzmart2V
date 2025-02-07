const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar y normalizar direcciones TON
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").toLowerCase(); // 🔹 Elimina el prefijo "0:" y convierte a minúsculas
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

        // 🔹 Convertir dirección esperada a HEX
        let expectedAddressHex = cleanTONAddress(ton.publicAddress);
        console.log("🔹 Dirección esperada (HEX):", expectedAddressHex);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmount = parseInt(tx.in_msg?.value || tx.value || 0, 10);

            // 🔹 Normalizar dirección destino (eliminar "0:")
            let txDestinationRaw = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            let txDestination = cleanTONAddress(txDestinationRaw);

            console.log("🔍 Comparando:", {
                txHash,
                txAmount,
                txDestinationRaw,  // 🔹 Dirección antes de limpiar
                txDestination,      // 🔹 Dirección después de limpiar
                expectedAmount,     // 🔹 Monto esperado
                expectedAddressHex  // 🔹 Dirección esperada en HEX
            });

            return (
                txHash === txid &&             // ✅ TXID debe coincidir
                txAmount === expectedAmount && // ✅ Monto en nanoTON debe coincidir
                txDestination === expectedAddressHex // ✅ Dirección debe coincidir
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
