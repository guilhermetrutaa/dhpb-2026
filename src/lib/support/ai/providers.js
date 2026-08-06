export const groqProvider = {
  nome: 'groq',
  async completar({ mensagem, historico, systemPrompt, temperatura = 0.3 }) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY não configurada')

    const modelo = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
    const mensagens = [
      { role: 'system', content: systemPrompt },
      ...historico,
      { role: 'user', content: mensagem },
    ]

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelo,
        messages: mensagens,
        temperature: temperatura,
        max_tokens: 350,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const texto = await res.text().catch(() => '')
      throw new Error(`Groq retornou ${res.status}: ${texto.slice(0, 200)}`)
    }

    const data = await res.json()
    const conteudo = data?.choices?.[0]?.message?.content
    if (!conteudo) throw new Error('Groq retornou resposta vazia')

    return conteudo
  },
}
