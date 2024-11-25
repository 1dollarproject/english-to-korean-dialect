import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const dialectPrompts = {
  jeju: "제주도 방언으로 번역해줘. 제주도 특유의 억양과 어투를 살려서 번역해줘.",
  gyeongsang: "경상도 방언으로 번역해줘. 경상도 특유의 억양과 어투를 살려서 번역해줘.",
  jeolla: "전라도 방언으로 번역해줘. 전라도 특유의 억양과 어투를 살려서 번역해줘.",
  gangwon: "강원도 방언으로 번역해줘. 강원도 특유의 억양과 어투를 살려서 번역해줘."
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
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a Korean dialect expert who can translate English to Korean dialects naturally."
        },
        {
          role: "user",
          content: `Translate the following English text to Korean using ${dialect} dialect: "${text}"\n\n${dialectPrompts[dialect as keyof typeof dialectPrompts]}`
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

    const audioBuffer = Buffer.from(await speech.arrayBuffer())
    console.log('TTS generation completed')

    // 파일 저장 경로 설정
    const publicDir = path.join(process.cwd(), 'public')
    const audioDir = path.join(publicDir, 'audio')
    const audioFileName = `dialect-${Date.now()}.mp3`
    const audioPath = path.join(audioDir, audioFileName)

    try {
      // audio 디렉토리 생성 로직 추가
      await mkdir(audioDir, { recursive: true })
      await writeFile(audioPath, audioBuffer)
      console.log('Audio file saved:', audioPath)
    } catch (error) {
      console.error('Error saving audio file:', error)
      return NextResponse.json(
        { error: '오디오 파일 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${audioFileName}`,
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
