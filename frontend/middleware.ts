
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            console.error('Middleware: Supabase environment variables are missing')
            return response
        }

        if (!/^https?:\/\//.test(supabaseUrl)) {
            console.error('Middleware: NEXT_PUBLIC_SUPABASE_URL is invalid')
            return response
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            request.cookies.set({
                                name,
                                value,
                                ...options,
                            })
                        } catch (error) {
                            console.error('Middleware: failed setting request cookie', error)
                        }

                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            request.cookies.set({
                                name,
                                value: '',
                                ...options,
                            })
                        } catch (error) {
                            console.error('Middleware: failed removing request cookie', error)
                        }

                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        let user = null
        try {
            const { data } = await supabase.auth.getUser()
            user = data.user
        } catch (error) {
            console.error('Middleware: Error getting user', error)
        }

        if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (request.nextUrl.pathname === '/login' && user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        return response
    } catch (error) {
        console.error('Middleware: Unhandled error', error)
        return response
    }
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
    ],
}
