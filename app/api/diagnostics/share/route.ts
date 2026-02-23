import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, role, scores, reports, answers } = body;

        if (!username || !scores || !reports || !answers) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        const result = await (prisma as any).diagnosticResult.create({
            data: {
                username,
                role,
                answers: answers as any,
                scores: scores as any,
                reports: reports as any,
            },
        });

        return NextResponse.json({
            id: result.id,
            publicId: result.publicId
        });

    } catch (error: any) {
        console.error("Save Diagnostic Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
