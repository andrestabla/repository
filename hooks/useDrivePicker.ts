
"use client"

import { useState, useCallback } from 'react'

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function useDrivePicker() {
    const [isLoaded, setIsLoaded] = useState(false)

    const loadScripts = useCallback(() => {
        if (typeof window === 'undefined') return
        if (isLoaded) return

        const script1 = document.createElement('script')
        script1.src = 'https://apis.google.com/js/api.js'
        script1.onload = () => {
            window.gapi.load('picker', () => {
                setIsLoaded(true)
            })
        }
        document.body.appendChild(script1)

        const script2 = document.createElement('script')
        script2.src = 'https://accounts.google.com/gsi/client'
        document.body.appendChild(script2)
    }, [isLoaded])

    const openPicker = useCallback((onSelect: (file: any) => void) => {
        if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
            alert("Configuración de Google Drive incompleta. Se requieren NEXT_PUBLIC_GOOGLE_API_KEY y NEXT_PUBLIC_GOOGLE_CLIENT_ID.")
            return
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: async (response: any) => {
                if (response.error !== undefined) {
                    throw response
                }

                const picker = new window.google.picker.PickerBuilder()
                    .addView(window.google.picker.ViewId.DOCS)
                    .setOAuthToken(response.access_token)
                    .setDeveloperKey(GOOGLE_API_KEY)
                    .setCallback((data: any) => {
                        if (data.action === window.google.picker.Action.PICKED) {
                            const file = data.docs[0]
                            onSelect(file)
                        }
                    })
                    .build()
                picker.setVisible(true)
            },
        })

        tokenClient.requestAccessToken()
    }, [])

    return { loadScripts, openPicker, isLoaded }
}

declare global {
    interface Window {
        gapi: any
        google: any
    }
}
