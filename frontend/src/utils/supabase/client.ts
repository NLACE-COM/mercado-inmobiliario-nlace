
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (typeof window !== 'undefined') {
        const availableKeys = Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_'));
        console.log('[DEBUG ENV] Claves encontradas:', availableKeys);
        console.log('[DEBUG ENV] URL configurada:', !!url);
        console.log('[DEBUG ENV] Key configurada:', !!key);
    }

    if (!url || !key) {
        if (typeof window !== 'undefined') {
            console.error('ERROR: Supabase credentials missing in browser!');
        }
        // Return a mock object that won't crash the build or the initial render
        return {
            auth: {
                signInWithPassword: async () => ({ data: {}, error: { message: 'Configuración incompleta' } }),
                signInWithOtp: async () => ({ data: {}, error: { message: 'Configuración incompleta' } }),
                signUp: async () => ({ data: {}, error: { message: 'Configuración incompleta' } }),
                getUser: async () => ({ data: { user: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            },
            from: () => ({
                select: () => ({
                    order: () => ({
                        limit: () => Promise.resolve({ data: [], error: null }),
                        single: () => Promise.resolve({ data: null, error: null }),
                    }),
                    limit: () => Promise.resolve({ data: [], error: null }),
                    single: () => Promise.resolve({ data: null, error: null }),
                })
            })
        } as any;
    }

    return createBrowserClient(url, key)
}
