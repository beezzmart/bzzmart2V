const axios = require("axios");
const { ton } = require("./config");

async function verifyTONTransaction(txid, expectedAmount) {
    const apiUrl = `https://tonapi.io/v2/blockchain/transactions/${txid}`;

    try {
        console.log("\n📌 Verificando transacción en TONAPI...");
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 URL de consulta:", apiUrl);

        // Hacemos la petición HTTP a TONAPI
        const response = await axios.get(apiUrl);
        const transaction = response.data;

        console.log("\n🔍 Respuesta de la API:");
        console.log(transaction);

        if (!transaction) {
            console.log("❌ No se encontró información válida en TONAPI.");
            return false;
        }

        // 📌 Extraer valores de la transacción
        const inMsg = transaction.in_msg || {};
        const outMsgs = transaction.out_msgs || [];

        // 📌 Extraer datos principales
        const txAmount = inMsg.value ? parseFloat(inMsg.value) / 1e9 : 0; // Convertir nanotons a TON
        const txDestination = inMsg.destination ? inMsg.destination.address : "";
        const inMsgHash = inMsg.hash || "";
        const prevTransHash = transaction.prev_trans_hash || "";

        // 📌 Intentar extraer datos de `out_msgs`
        let outMsgDestination = "";
        let outMsgAmount = 0;

        if (outMsgs.length > 0) {
            const firstOutMsg = outMsgs[0];
            outMsgDestination = firstOutMsg.destination ? firstOutMsg.destination.address : "";
            outMsgAmount = firstOutMsg.value ? parseFloat(firstOutMsg.value) / 1e9 : 0;
        }

        console.log("\n🔍 Comparando:", {
            txHash: txid,
            inMsgHash,
            prevTransHash,
            txAmount,
            outMsgAmount,
            txDestination,
            outMsgDestination,
            expectedAmount,
            expectedAddress: ton.publicAddress
        });

        // 📌 Validar transacción con `in_msg` o `out_msgs`
        const validHash = txid === inMsgHash || txid === prevTransHash;
        const validAmount = txAmount === expectedAmount || outMsgAmount === expectedAmount;
        const validDestination = txDestination === ton.publicAddress || outMsgDestination === ton.publicAddress;

        if (validHash && validAmount && validDestination) {
            console.log("✅ Transacción válida encontrada.");
            return true;
        } else {
            console.log("❌ La transacción no coincide con los datos esperados.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción en TONAPI:", error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
