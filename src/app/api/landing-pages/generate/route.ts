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

  const systemPrompt = `Eres un experto copywriter de alto nivel especializado en landing pages de alta conversión.
Tu ÚNICA tarea es generar un JSON con el contenido textual de una landing page profesional futurista.

═══════════════════════════════════════════════════
REGLAS ABSOLUTAS — DEBES CUMPLIRLAS SIN EXCEPCIÓN:
═══════════════════════════════════════════════════
1. Responde SOLO con el JSON pedido. Cero texto extra, cero markdown.
2. Todos los textos deben estar 100% adaptados al negocio específico descrito.
3. NO uses frases genéricas como "Beneficio 1" o "Descripción del beneficio". Escribe contenido REAL.
4. El idioma de los textos debe ser el mismo de la descripción del negocio (si está en español, generas en español).
5. Si el usuario dio instrucciones específicas, DEBES seguirlas TODAS AL PIE DE LA LETRA.
${instructions?.trim() ? `
╔══════════════════════════════════════════════════╗
║  INSTRUCCIONES OBLIGATORIAS DEL USUARIO:         ║
╚══════════════════════════════════════════════════╝
${instructions}
` : ''}
═══════════════════════════════════════════════
INFORMACIÓN DEL NEGOCIO:
═══════════════════════════════════════════════
Tipo: ${businessType || 'general'}
Descripción: ${description}

CONFIGURACIÓN TÉCNICA:
- Color primario: ${primaryColor}
- Color secundario: ${secondaryColor}
- Texto del botón CTA: ${buttonText}
- URL del botón CTA: ${buttonUrl}
- Imágenes: ${imageList}
${videoBlock}

ESTRUCTURA JSON REQUERIDA — genera exactamente este formato, con contenido real adaptado al negocio:

{
  "blocks": [
    {
      "id": "block-1",
      "type": "ndt_hero",
      "content": {
        "headline": "[ESCRIBE un título impactante en MAYÚSCULAS de máximo 7 palabras específico para este negocio]",
        "subheadline": "[ESCRIBE un subtítulo que explica la propuesta de valor única, máximo 15 palabras]",
        "bonusText": "[ESCRIBE 1-2 oraciones que refuercen el beneficio principal y creen urgencia o deseo]",
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
        "title": "[ESCRIBE un título para los beneficios, específico para este negocio]",
        "items": [
          { "title": "[Beneficio real #1 específico del negocio]", "description": "[Descripción detallada de 1-2 oraciones que explica este beneficio de forma persuasiva]" },
          { "title": "[Beneficio real #2 específico del negocio]", "description": "[Descripción detallada de 1-2 oraciones que explica este beneficio de forma persuasiva]" },
          { "title": "[Beneficio real #3 específico del negocio]", "description": "[Descripción detallada de 1-2 oraciones que explica este beneficio de forma persuasiva]" }
        ]
      },
      "styles": { "accentColor": "${secondaryColor}" }
    },
    {
      "id": "block-3",
      "type": "pricing",
      "content": {
        "title": "[ESCRIBE un título CTA urgente específico para este negocio]",
        "subtitle": "[ESCRIBE un subtítulo que elimine objeciones y genere confianza]",
        "tiers": [
          {
            "name": "[Nombre de la oferta o plan]",
            "price": "[precio si se conoce, o '0' si es gratis/contactar]",
            "features": [
              "[Característica o incluido #1 específico del negocio]",
              "[Característica o incluido #2 específico del negocio]",
              "[Característica o incluido #3 específico del negocio]",
              "[Característica o incluido #4 específico del negocio]"
            ],
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
          { "question": "[Pregunta real que tendría un cliente potencial de este negocio]", "answer": "[Respuesta completa y convincente que elimina la objeción]" },
          { "question": "[Pregunta sobre proceso, entrega o resultados]", "answer": "[Respuesta tranquilizadora y específica]" },
          { "question": "[Pregunta sobre garantía, precio o confianza]", "answer": "[Respuesta que genera confianza y urgencia]" },
          { "question": "[Pregunta adicional relevante al negocio]", "answer": "[Respuesta persuasiva]" }
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
