export type TranscribeResult = {
  text: string
  model: string
}

export async function transcribeWithOpenAI({
  audioBase64,
  mime,
  language
}: {
  audioBase64: string
  mime?: string
  language?: string
}): Promise<TranscribeResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('missing OPENAI_API_KEY')
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL ?? 'whisper-1'

  const buffer = Buffer.from(audioBase64, 'base64')
  const contentType = mime && mime.trim() ? mime.trim() : 'audio/m4a'

  const form = new FormData()
  // filename is required by some servers
  const file = new Blob([buffer], { type: contentType })
  form.append('file', file, 'audio.m4a')
  form.append('model', model)
  if (language) form.append('language', language)

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`openai transcribe failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as any
  const text = data?.text
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('openai transcribe invalid response')
  }

  return { text, model }
}
