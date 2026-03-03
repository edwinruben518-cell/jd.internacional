import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { verifyToken } from '@/lib/auth'

function getAuth() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function POST(req: NextRequest) {
  const auth = getAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    description,
    instructions = '',
    openaiKey: bodyKey = '',
    businessType = '',
    primaryColor = '#00F5FF',
    secondaryColor = '#00FF88',
    videoUrl = '',
    imageUrls = [] as string[],
    buttonUrl = '#',
    buttonText = 'COMENZAR AHORA',
  } = body

  if (!description?.trim()) {
    return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 })
  }

  // 1. Use the key sent directly from the form
  let openaiKey = bodyKey?.trim()

  // 2. Fallback: get key from user's bot (if no key provided in form)
  if (!openaiKey) {
    const bot = await prisma.bot.findFirst({
      where: { userId: auth.userId, status: 'ACTIVE' },
      include: { secret: true },
      orderBy: { createdAt: 'desc' },
    })
    if (bot?.secret?.openaiApiKeyEnc) {
      openaiKey = decrypt(bot.secret.openaiApiKeyEnc) || ''
    }
  }

  if (!openaiKey) {
    return NextResponse.json({
      error: 'Se requiere una API Key de OpenAI. Ingresa tu key en el formulario o configura una en tu bot de WhatsApp.'
    }, { status: 400 })
  }

  const imageList = imageUrls.length > 0 ? imageUrls.join(', ') : 'sin imágenes'
  const videoBlock = videoUrl
    ? `- Incluye un bloque con el video de YouTube: "${videoUrl}"`
    : `- NO incluyas bloques de video`

  const systemPrompt = `Eres un experto en copywriting de alta conversión y marketing digital. 
Tu tarea es generar el contenido (SOLO textos, no código) para una landing page futurista y profesional.

El diseño siempre será: fondo negro #050505, estilo neón y futurista — tú NO decides el diseño, solo el contenido.

TIPO DE NEGOCIO: ${businessType || 'general'}

DESCRIPCIÓN DEL NEGOCIO:
${description}

CONFIGURACIÓN DEL USUARIO:
- Color primario: ${primaryColor}
- Color secundario: ${secondaryColor}
- URL del botón principal: ${buttonUrl}
- Texto del botón: ${buttonText}
- Imágenes disponibles: ${imageList}
${videoBlock}
${instructions?.trim() ? `\nINSTRUCCIONES ESPECÍFICAS DEL USUARIO (DEBES SEGUIRLAS AL PIE DE LA LETRA):\n${instructions}` : ''}

GENERA EXACTAMENTE este JSON con los bloques de la landing page. Usa copywriting persuasivo, urgente y orientado a la acción. Los textos deben ser en el mismo idioma de la descripción del negocio.

Devuelve SOLO este JSON (sin markdown, sin código extra):
{
  "blocks": [
    {
      "id": "block-1",
      "type": "ndt-hero",
      "content": {
        "headline": "TÍTULO PRINCIPAL EN MAYÚSCULAS (máximo 8 palabras, ultra impactante)",
        "subheadline": "Subtítulo corto que explica la propuesta de valor (máximo 12 palabras)",
        "bonusText": "Texto de apoyo más largo explicando el beneficio principal (1-2 oraciones)",
        "buttonText": "${buttonText}",
        "buttonUrl": "${buttonUrl}",
        "videoId": "${videoUrl ? extractYouTubeId(videoUrl) : ''}"
      },
      "styles": { "accentColor": "${primaryColor}" }
    },
    {
      "id": "block-2",
      "type": "features",
      "content": {
        "title": "POR QUÉ ELEGIRNOS",
        "items": [
          { "title": "Beneficio 1", "description": "Descripción del beneficio principal relevante al negocio" },
          { "title": "Beneficio 2", "description": "Descripción del segundo beneficio importante" },
          { "title": "Beneficio 3", "description": "Descripción de un tercer beneficio clave" }
        ]
      },
      "styles": { "accentColor": "${secondaryColor}" }
    },
    {
      "id": "block-3",
      "type": "pricing",
      "content": {
        "title": "EMPIEZA HOY",
        "subtitle": "Sin complicaciones. Resultado garantizado.",
        "tiers": [
          {
            "name": "Starter",
            "price": "0",
            "features": ["Característica 1", "Característica 2", "Característica 3"],
            "buttonText": "${buttonText}",
            "buttonUrl": "${buttonUrl}"
          }
        ]
      },
      "styles": { "accentColor": "${primaryColor}" }
    },
    {
      "id": "block-4",
      "type": "faq",
      "content": {
        "title": "PREGUNTAS FRECUENTES",
        "items": [
          { "question": "Pregunta relevante 1 basada en el negocio", "answer": "Respuesta clara y convincente" },
          { "question": "Pregunta relevante 2", "answer": "Respuesta que elimina objeciones" },
          { "question": "Pregunta relevante 3 sobre entrega/proceso/resultados", "answer": "Respuesta tranquilizadora" }
        ]
      },
      "styles": { "accentColor": "${secondaryColor}" }
    }
  ]
}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[LANDING-GEN] OpenAI error:', err)
      return NextResponse.json({ error: `Error OpenAI: ${res.status}` }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)

    // Inject real image URLs into the hero block if provided
    if (imageUrls.length > 0 && parsed.blocks?.[0]) {
      parsed.blocks[0].content.image = imageUrls[0]
    }

    return NextResponse.json({ blocks: parsed.blocks || [] })
  } catch (err: any) {
    console.error('[LANDING-GEN] Error:', err)
    return NextResponse.json({ error: err.message || 'Error generando la landing' }, { status: 500 })
  }
}

function extractYouTubeId(url: string): string {
  if (!url) return ''
  if (url.includes('youtube.com/watch?v=')) return url.split('v=')[1]?.split('&')[0] || ''
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0] || ''
  if (url.includes('youtube.com/embed/')) return url.split('embed/')[1]?.split('?')[0] || ''
  return url // assume it's already an ID
}
