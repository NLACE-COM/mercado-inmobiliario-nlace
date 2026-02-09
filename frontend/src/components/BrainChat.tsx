'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Bot, User, BookOpen, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import axios from 'axios'

type Message = {
    role: 'user' | 'assistant'
    content: string
    context?: any[]
    data?: any[]
}

export default function BrainChat() {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hola, soy el Cerebro Inmobiliario. Pregúntame sobre tendencias históricas, impacto de normativas o datos actuales de mercado.'
        }
    ])
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            // Call Backend API
            const res = await axios.post('http://localhost:8000/brain/ask', {
                question: userMsg.content
            })

            const assistantMsg: Message = {
                role: 'assistant',
                content: res.data.answer,
                context: res.data.context_used,
                data: res.data.data_points
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un error al procesar tu pregunta.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="h-[600px] flex flex-col w-full shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 py-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100 dark:fill-indigo-900" />
                    Cerebro IA
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <div className="h-full overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.map((m, i) => (
                        <div key={i} className={cn("flex gap-3", m.role === 'user' ? "justify-end" : "justify-start")}>
                            {m.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                                </div>
                            )}

                            <div className={cn(
                                "max-w-[80%] rounded-lg p-3 text-sm",
                                m.role === 'user'
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                    : "bg-white border text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 shadow-sm"
                            )}>
                                <p className="whitespace-pre-wrap">{m.content}</p>

                                {/* Sources Section (Context/Data) */}
                                {m.role === 'assistant' && (m.context || m.data) && (
                                    <div className="mt-3 pt-3 border-t grid gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        {m.context && m.context.length > 0 && (
                                            <div className="flex gap-1 items-start">
                                                <BookOpen className="w-3 h-3 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="font-semibold">Contexto:</span> Usé {m.context.length} fuentes históricas.
                                                </div>
                                            </div>
                                        )}
                                        {m.data && m.data.length > 0 && (
                                            <div className="flex gap-1 items-start">
                                                <Database className="w-3 h-3 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="font-semibold">Datos:</span> Analicé {m.data.length} proyectos.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {m.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-slate-500" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="bg-white border rounded-lg p-3 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-3 border-t bg-slate-50/50 dark:bg-slate-900/50">
                <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                    <Input
                        placeholder="Pregunta algo sobre el mercado..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
