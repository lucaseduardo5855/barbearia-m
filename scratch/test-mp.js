async function test() {
  const token = "TEST-759332012865853-071222-777f339dda0af7b2b47de9ec612e28df-315279123";
  // Usando um e-mail normal com a chave de teste (TEST-), que agora deve ser aceito!
  const buyerEmail = "lucas.teste@gmail.com"; 
  console.log("Using Token:", token);
  console.log("Buyer Email:", buyerEmail);

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `test_${Date.now()}`,
    },
    body: JSON.stringify({
      transaction_amount: 49.90,
      description: `Teste de Integracao Pix`,
      payment_method_id: "pix",
      payer: {
        email: buyerEmail,
        first_name: "Lucas",
        last_name: "Teste",
      },
    }),
  });

  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

test();
