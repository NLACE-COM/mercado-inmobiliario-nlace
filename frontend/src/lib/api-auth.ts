import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Authentication helper for API routes
 * Provides reusable auth checking functions following the same pattern as middleware.ts
 */

interface AuthResult {
    user: any | null
    error: NextResponse | null
}

/**
 * Require authentication for an API route
 * Returns the authenticated user or an error response
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('[API Auth] Supabase environment variables are missing')
        return {
            user: null,
            error: NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }
    }

    // Create Supabase SSR client using cookies from the request
    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set() {
                    // No-op for API routes - we don't need to set cookies
                },
                remove() {
                    // No-op for API routes
                }
            }
        }
    )

    try {
        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
            console.log('[API Auth] Unauthorized request - no valid session')
            return {
                user: null,
                error: NextResponse.json(
                    { error: 'Unauthorized - Please log in' },
                    { status: 401 }
                )
            }
        }

        return {
            user: data.user,
            error: null
        }
    } catch (e) {
        console.error('[API Auth] Error getting user:', e)
        return {
            user: null,
            error: NextResponse.json(
                { error: 'Authentication error' },
                { status: 500 }
            )
        }
    }
}

/**
 * Require admin authentication for an API route
 * Returns the authenticated admin user or an error response
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
    // First check if user is authenticated
    const authResult = await requireAuth(request)
    if (authResult.error) {
        return authResult
    }

    const user = authResult.user

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            return {
                user: null,
                error: NextResponse.json(
                    { error: 'Server configuration error' },
                    { status: 500 }
                )
            }
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set() { },
                    remove() { }
                }
            }
        )

        // Check if user is admin via profiles table (more robust than RPC in some environments)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError) {
            // If profile not found, they certainly aren't an admin
            if (profileError.code === 'PGRST116') {
                return {
                    user: null,
                    error: NextResponse.json(
                        { error: 'Forbidden - User profile not found' },
                        { status: 403 }
                    )
                }
            }

            console.error('[API Auth] Error checking admin status:', profileError)
            return {
                user: null,
                error: NextResponse.json(
                    { error: 'Error checking admin privileges' },
                    { status: 500 }
                )
            }
        }

        if (!profile || profile.role !== 'admin') {
            console.log('[API Auth] Forbidden - user is not admin:', user.id)
            return {
                user: null,
                error: NextResponse.json(
                    { error: 'Forbidden - Admin access required' },
                    { status: 403 }
                )
            }
        }

        return {
            user,
            error: null
        }
    } catch (e) {
        console.error('[API Auth] Error in requireAdmin:', e)
        return {
            user: null,
            error: NextResponse.json(
                { error: 'Authorization error' },
                { status: 500 }
            )
        }
    }
}
