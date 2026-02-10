'use client'

import React, { useState } from 'react'
import SystemPromptEditor from '@/components/brain/SystemPromptEditor'
import KnowledgeBaseManager from '@/components/brain/KnowledgeBaseManager'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminBrainPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Administración del Cerebro IA</h1>
                <p className="text-muted-foreground">Configura el comportamiento del agente y actualiza su base de conocimiento.</p>
            </div>

            <Tabs defaultValue="prompt" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                    <TabsTrigger value="knowledge">Base de Conocimiento</TabsTrigger>
                </TabsList>
                <TabsContent value="prompt" className="mt-4">
                    <SystemPromptEditor />
                </TabsContent>
                <TabsContent value="knowledge" className="mt-4">
                    <KnowledgeBaseManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}
