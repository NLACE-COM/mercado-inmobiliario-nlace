/**
 * Environment configuration
 * Centralizes all environment variables and API endpoints
 */

export const config = {
    // API URL - now using Next.js API routes
    apiUrl: '/api',

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

// API endpoints - all using Next.js API routes now
export const endpoints = {
    brain: {
        chat: '/api/brain/chat',
        health: '/api/brain/chat', // GET on same endpoint
        admin: {
            prompts: '/api/brain/admin/prompts',
            knowledge: '/api/brain/admin/knowledge',
        },
    },
} as const
