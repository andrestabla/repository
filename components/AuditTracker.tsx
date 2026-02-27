'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

type TrackPayload = {
    action: string
    details?: string
    resourceId?: string
}

const RESERVED_SEGMENTS = new Set([
    'api',
    'admin',
    'analytics',
    'analyze',
    'audio',
    'comments',
    'drive-files',
    'export',
    'gap-analysis',
    'generate',
    'generator',
    'glossary',
    'health',
    'history',
    'inventory',
    'list',
    'logs',
    'products',
    'public',
    'qa',
    'reanalyze-research',
    'releases',
    'reports',
    'research',
    'settings',
    'share',
    'speak',
    'stream',
    'taxonomy',
    'test-email',
    'track',
    'tree',
    'upsert',
    'upload',
    'users',
    'versions',
    'workbooks'
])

function sendTrack(payload: TrackPayload, baseFetch?: typeof fetch) {
    const body = JSON.stringify(payload)

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' })
        const sent = navigator.sendBeacon('/api/audit/track', blob)
        if (sent) return
    }

    const fallbackFetch = baseFetch || fetch
    void fallbackFetch('/api/audit/track', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Audit-Origin': 'client-tracker'
        },
        body,
        keepalive: true
    }).catch(() => undefined)
}

function extractResourceId(url: URL) {
    const queryKeys = ['id', 'resourceId', 'publicId', 'itemId', 'slug', 'email']
    for (const key of queryKeys) {
        const value = url.searchParams.get(key)
        if (value) return value
    }

    const segments = url.pathname.split('/').filter(Boolean)
    for (let i = segments.length - 1; i >= 0; i -= 1) {
        const value = segments[i]
        if (!value || RESERVED_SEGMENTS.has(value)) continue
        if (value.length >= 3) return value
    }

    return undefined
}

function classifyApiAction(method: string, pathname: string, resourceId?: string) {
    const upperMethod = method.toUpperCase()
    const lowerPath = pathname.toLowerCase()

    if (upperMethod === 'GET') return resourceId ? 'VIEW_RESOURCE' : undefined
    if (upperMethod === 'DELETE') return 'DELETE_RESOURCE'
    if (upperMethod === 'PATCH' || upperMethod === 'PUT') return 'UPDATE_RESOURCE'

    if (upperMethod === 'POST') {
        if (lowerPath.includes('/upload')) return 'UPLOAD_FILE'
        if (lowerPath.includes('/upsert')) return 'UPSERT_RESOURCE'
        if (lowerPath.includes('/delete')) return 'DELETE_RESOURCE'
        if (lowerPath.includes('/analyze') || lowerPath.includes('/generate')) return 'EXECUTE_ACTION'
        if (lowerPath.includes('/share')) return 'SHARE_RESOURCE'
        return 'CREATE_RESOURCE'
    }

    return 'API_EVENT'
}

export default function AuditTracker() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const lastSectionEventRef = useRef<string>('')
    const fetchPatchedRef = useRef(false)
    const searchString = useMemo(() => searchParams?.toString() || '', [searchParams])

    useEffect(() => {
        if (fetchPatchedRef.current) return
        if (!session?.user?.email) return
        if (typeof window === 'undefined') return

        const originalFetch = window.fetch.bind(window)
        window.fetch = async (...args: Parameters<typeof fetch>) => {
            const [input, init] = args
            const request = input instanceof Request ? input : undefined
            const method = (init?.method || request?.method || 'GET').toUpperCase()
            const urlText = typeof input === 'string' ? input : input instanceof URL ? input.toString() : request?.url || ''

            let url: URL | null = null
            try {
                url = new URL(urlText, window.location.origin)
            } catch {
                return originalFetch(...args)
            }

            const response = await originalFetch(...args)

            if (url.origin !== window.location.origin) return response
            if (!url.pathname.startsWith('/api/')) return response
            if (url.pathname.startsWith('/api/audit/track')) return response
            if (url.pathname.startsWith('/api/logs')) return response
            if (url.pathname.startsWith('/api/auth')) return response

            const resourceId = extractResourceId(url)
            const action = classifyApiAction(method, url.pathname, resourceId)
            if (!action) return response

            const details = `${method} ${url.pathname}${url.search} -> ${response.status}`
            sendTrack({ action, details, resourceId: resourceId || url.pathname }, originalFetch)
            return response
        }

        fetchPatchedRef.current = true
        return () => {
            window.fetch = originalFetch
            fetchPatchedRef.current = false
        }
    }, [session?.user?.email])

    useEffect(() => {
        if (!session?.user?.email) return
        if (!pathname) return
        if (pathname.startsWith('/api') || pathname.startsWith('/share') || pathname.startsWith('/public')) return

        const viewKey = `${pathname}?${searchString}`
        if (lastSectionEventRef.current === viewKey) return
        lastSectionEventRef.current = viewKey

        const selectedResource = searchParams?.get('id') || searchParams?.get('resourceId') || undefined
        const action = selectedResource ? 'VIEW_RESOURCE' : 'VIEW_SECTION'
        const details = selectedResource
            ? `Vista de recurso en ${pathname} con query ${searchString || 'sin query'}`
            : `Vista de sección ${pathname}`

        sendTrack({
            action,
            details,
            resourceId: selectedResource || pathname
        })
    }, [pathname, searchParams, searchString, session?.user?.email])

    return null
}
