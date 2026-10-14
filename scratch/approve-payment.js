const fs = require('fs');

function getEnvVar(key) {
  const envPath = 'c:/Users/Lucas Eduardo/Documents/GitHub/Barberia/barbearia-m/.env';
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    const parts = trimmed.split('=');
    if (parts[0] === key) {
      let val = parts.slice(1).join('=').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      return val;
    }
  }
  return null;
}

async function approvePayment(paymentId) {
  const token = getEnvVar("MERCADO_PAGO_ACCESS_TOKEN");
  console.log(`Tentando aprovar pagamento ${paymentId} no Sandbox...`);

  // Em sandbox, podemos atualizar o status de um pagamento usando o endpoint de teste do Mercado Pago
  // Ou mudando o status diretamente no endpoint de pagamentos de sandbox
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "approved",
      status_detail: "accredited"
    }),
  });

  console.log("Status da Requisição:", response.status);
  const data = await response.json();
  if (response.ok) {
    console.log("Sucesso! Pagamento aprovado no Sandbox.");
    console.log("Novo status:", data.status);
  } else {
    console.error("Erro ao aprovar pagamento:", data);
  }
}

// Pega o ID de pagamento passado como argumento do terminal (ex: node approve-payment.js 1348472623)
const paymentId = process.argv[2];
if (!paymentId) {
  console.error("Por favor, informe o ID do pagamento: node approve-payment.js <paymentId>");
  process.exit(1);
}

approvePayment(paymentId);
