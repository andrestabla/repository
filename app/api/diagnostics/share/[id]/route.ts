import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await (prisma as any).diagnosticResult.findUnique({
            where: { publicId: id },
        });

        if (!result) {
            return NextResponse.json({ error: "Resultado no encontrado" }, { status: 404 });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Fetch Diagnostic Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
