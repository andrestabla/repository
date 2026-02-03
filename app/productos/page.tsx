
import prisma from '@/lib/prisma'
import { ProductsView } from '@/components/products/ProductsView'

// Revalidate every 60 seconds (or 0 for always fresh)
export const revalidate = 0

export default async function ProductsPage() {

    // Fetch initial data on server
    const initialProducts = await prisma.strategicProduct.findMany({
        orderBy: { updatedAt: 'desc' }
    })

    // Serialize dates if necessary (Next.js server components handle Date objects well now, but good to be safe for client)
    const serialized = initialProducts.map(p => ({
        ...p,
        updatedAt: p.updatedAt.toISOString(),
        createdAt: p.createdAt.toISOString()
    }))

    return <ProductsView initialProducts={serialized} />
}
