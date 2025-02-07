const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar la dirección HEX y asegurar formato correcto
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").toLowerCase();
}

// ✅ Función para convertir Base64 a dirección HEX con "0:" al inicio
function convertBase64ToTONAddress(base64Address) {
    try {
        const buffer = Buffer.from(base64Address, "base64");
        const hexAddress = buffer.toString("hex").toLowerCase();
        return `0:${hexAddress.slice(-64)}`;
    } catch (error) {
        console.error("❌ Error convirtiendo dirección Base64 a TON:", error.message);
        return "";
    }
}

// ✅ Verificar transacción en TON API
async function verifyTONTransaction(txid, expectedAmountTON, telegramId) {
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

        // ✅ Convertimos la dirección esperada al formato correcto (Base64 -> Hex)
        let expectedAddressTON = cleanTONAddress(convertBase64ToTONAddress(ton.publicAddress));
        console.log("🔹 Dirección esperada (TON):", `0:${expectedAddressTON}`);

        // ✅ Convertir el monto esperado de TON a NanoTON (1 TON = 1e9 NanoTON)
        const expectedAmountNano = parseInt(expectedAmountTON * 1e9, 10);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmountNano = parseInt(tx.in_msg?.value || tx.value || 0, 10);

            // 🔹 Normalizar dirección destino
            let txDestinationRaw = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            let txDestination = `0:${cleanTONAddress(txDestinationRaw)}`;

            console.log("🔍 Comparando:", {
                txHash,
                txAmountNano,
                txDestinationRaw,  // 🔹 Dirección antes de limpiar
                txDestination,      // 🔹 Dirección después de limpiar
                expectedAmountNano, // 🔹 Monto esperado en NanoTON
                expectedAddressTON  // 🔹 Dirección esperada en formato TON
            });

            return (
                txHash === txid &&                     // ✅ TXID debe coincidir
                txAmountNano === expectedAmountNano && // ✅ Monto en nanoTON debe coincidir
                txDestination === `0:${expectedAddressTON}` // ✅ Dirección debe coincidir
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
