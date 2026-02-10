/**
 * Environment configuration
 * Centralizes all environment variables and API endpoints
 */

export const config = {
    // Backend API URL
    apiUrl: process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:8000'),

    // Supabase (already configured via createClient)
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },

    // App settings
    app: {
        name: 'Mercado Inmobiliario',
        version: '1.0.0',
    },
} as const

// API endpoints
export const endpoints = {
    brain: {
        ask: `${config.apiUrl}/brain/ask`,
        health: `${config.apiUrl}/brain/health`,
        admin: {
            prompts: `${config.apiUrl}/brain/admin/prompts`,
            knowledge: `${config.apiUrl}/brain/admin/knowledge`,
            knowledgeUpload: `${config.apiUrl}/brain/admin/knowledge/upload`,
        },
    },
} as const
