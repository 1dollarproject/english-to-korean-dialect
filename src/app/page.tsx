'use client'

import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'

export default function DialectConverter() {
  const [inputText, setInputText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [convertedText, setConvertedText] = useState('')
  const [selectedDialect, setSelectedDialect] = useState('jeju')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) {
      toast.error('텍스트를 입력해주세요')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          dialect: selectedDialect
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '변환 중 오류가 발생했습니다')
      }

      setAudioUrl(data.audioUrl)
      setConvertedText(data.convertedText)
      toast.success('변환이 완료되었습니다')
    } catch (error) {
      console.error('Error details:', error)
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Dialect Converter</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dialect">Select Dialect</Label>
            <Select value={selectedDialect} onValueChange={setSelectedDialect}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a dialect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jeju">제주도 방언</SelectItem>
                <SelectItem value="gyeongsang">경상도 방언</SelectItem>
                <SelectItem value="jeolla">전라도 방언</SelectItem>
                <SelectItem value="gangwon">강원도 방언</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="englishText">English Text</Label>
            <Textarea
              id="englishText"
              placeholder="Type your English text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Converting..." : "Convert to Dialect"}
          </Button>
        </form>

        {audioUrl && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">변환 결과</h2>
              <p className="text-gray-700 mb-4">{convertedText}</p>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                브라우저가 오디오 재생을 지원하지 않습니다.
              </audio>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(audioUrl, '_blank')}
            >
              오디오 파일 다운로드
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 
