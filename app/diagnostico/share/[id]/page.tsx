'use client';

import React, { useEffect, useState } from 'react';
import { ResultsView, UserState } from '../../ResultsView';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { id } = await params;
                const res = await fetch(`/api/diagnostics/share/${id}`);
                if (!res.ok) throw new Error('Resultado no encontrado');
                const json = await res.json();
                setData(json);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando Informe...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="bg-rose-50 p-4 rounded-full mb-6">
                    <AlertTriangle className="text-rose-600" size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Ups, algo salió mal</h1>
                <p className="text-slate-500 max-w-sm mb-8">{error || 'No pudimos encontrar este informe.'}</p>
                <a href="/diagnostico" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all font-bold">
                    Volver al Diagnóstico
                </a>
            </div>
        );
    }

    // Reconstruction of UserState with full answers to preserve logic
    const state: UserState = {
        username: data.username,
        role: data.role,
        answers: data.answers || {},
        currentIdx: 0
    };

    return (
        <ResultsView
            state={state}
            isPublic={true}
            initialReports={data.reports as any}
        />
    );
}
