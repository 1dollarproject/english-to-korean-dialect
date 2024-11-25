import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const dialectPrompts = {
  jeju: {
    description: "제주도 방언으로 자연스럽게 번역해줘. 제주도의 특유 억양과 어투를 살려서 제주 사람들끼리 대화하는 느낌을 잘 살려줘.",
    example: {
      input: "오늘 날씨가 참 좋네. 점심 먹고 산책 갈래?",
      output: "혼저 옵서게. 오늘 하르방도 좋아보난 점심 먹곡 혼디 산굿이나 갈래?"
    }
  },
  gyeongsang: {
    description: "1980년대 경상도 시골 마을 친구들 사이에서 오가는 대화처럼, 자연스럽고 정감 있는 경상도 사투리로 번역해줘.",
    example: {
      input: "밥 먹었어? 저녁에 시간 있으면 같이 놀자.",
      output: "밥 묵었나? 저녁에 시간 있으면 같이 놀자카이."
    }
  },
  jeolla: {
    description: "전라도 방언으로 번역해줘. 전라도 사람들끼리 나누는 친근하고 푸근한 대화 느낌을 살려서 번역해줘.",
    example: {
      input: "오늘 어디 가? 나도 같이 가면 안 될까?",
      output: "오늘 어디 가당가? 나도 함 따라가볼라잉?"
    }
  },
  gangwon: {
    description: "강원도 방언으로 자연스럽게 번역해줘. 강원도 특유의 구수한 억양과 편안한 분위기를 살려서 대화체로 표현해줘.",
    example: {
      input: "밖에 날씨가 추운데 따뜻한 차 한 잔 어때?",
      output: "밖에 날씨가 어째 많이 춥재? 따숩게 차 한 잔 허는 거 어떻대?"
    }
  }
}


export async function POST(request: Request) {
  try {
    const { text, dialect } = await request.json()

    if (!text || !dialect) {
      return NextResponse.json(
        { error: '텍스트와 방언을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // OpenAI 응답 확인을 위한 로깅 추가
    console.log('Starting translation...')
    const selectedDialect = dialectPrompts[dialect as keyof typeof dialectPrompts]

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 지역 방언을 자연스럽게 구사하는 전문가입니다."
        },
        {
          role: "user",
          content: `다음 텍스트를 방언으로 번역해주세요:

설명: ${selectedDialect.description}

예시:
입력: ${selectedDialect.example.input}
출력: ${selectedDialect.example.output}

번역할 텍스트: "${text}"`
        }
      ]
    })

    const convertedText = completion.choices[0].message.content
    console.log('Translation completed:', convertedText)

    // TTS 생성 확인을 위한 로깅
    console.log('Starting TTS generation...')
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer",
      input: convertedText || text,
    })

    // 오디오 데이터를 Base64로 변환
    const audioBuffer = Buffer.from(await speech.arrayBuffer())
    const audioBase64 = audioBuffer.toString('base64')

    console.log('TTS generation completed')

    return NextResponse.json({
      success: true,
      audioData: `data:audio/mpeg;base64,${audioBase64}`,
      convertedText
    })
  } catch (error) {
    console.error('Error details:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '변환 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
} 
