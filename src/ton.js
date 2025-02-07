const axios = require("axios");
const { ton } = require("./config");

// Verificar una transacción TON en Tonviewer
async function verifyTONTransaction(txid, expectedAmount) {
  const explorerUrl = `https://tonapi.io/v1/blockchain/transaction/${txid}`;

  try {
    const response = await axios.get(explorerUrl);
    const transaction = response.data;

    if (!transaction) {
      console.error("❌ Transacción no encontrada en Tonviewer.");
      return false;
    }

    // Obtener datos de la transacción
    const sender = transaction.in_msg.source.address; // Dirección del remitente
    const receiver = transaction.in_msg.destination.address; // Dirección del receptor
    const amount = parseFloat(transaction.in_msg.value) / 1e9; // Convertir de nanotons a TON

    // Verificar que el receptor sea nuestra billetera
    if (receiver !== ton.publicAddress) {
      console.error("❌ La transacción no fue enviada a la billetera correcta.");
      return false;
    }

    // Verificar que el monto coincida
    if (amount < expectedAmount) {
      console.error(`❌ Monto incorrecto: Se esperaban ${expectedAmount} TON pero recibió ${amount} TON.`);
      return false;
    }

    console.log(`✅ Transacción válida: ${amount} TON recibidos de ${sender}.`);
    return true;
  } catch (error) {
    console.error("❌ Error verificando transacción en Tonviewer:", error.message);
    return false;
  }
}

module.exports = { verifyTONTransaction };
