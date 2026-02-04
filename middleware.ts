import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Map restricted paths to module IDs
const MODULE_PATHS: Record<string, string> = {
    '/inventario': 'inventory',
    '/productos': 'products',
    '/workbooks': 'workbooks',
    '/analitica': 'analytics',
    '/research': 'research',
    '/qa': 'qa',
    '/taxonomy': 'taxonomy',
    '/glossary': 'glossary',
    '/gap-analysis': 'gap-analysis',
    '/releases': 'releases',
    '/generator': 'generator'
}

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // 1. Admin bypass
        if (token?.role === 'admin') {
            return NextResponse.next()
        }

        // 2. Identify target module
        // We match if the path starts with one of our keys
        const targetModuleKey = Object.keys(MODULE_PATHS).find(key => path.startsWith(key))

        if (targetModuleKey) {
            const requiredModule = MODULE_PATHS[targetModuleKey]
            const userModules = (token?.allowedModules as string[]) || []

            // 3. Check permission
            if (!userModules.includes(requiredModule)) {
                // Unauthorized: Redirect to Dashboard
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
    }
)

export const config = {
    matcher: [
        '/inventario/:path*',
        '/productos/:path*',
        '/workbooks/:path*',
        '/analitica/:path*',
        '/research/:path*',
        '/qa/:path*',
        '/taxonomy/:path*',
        '/glossary/:path*',
        '/gap-analysis/:path*',
        '/releases/:path*',
        '/generator/:path*'
    ]
}
