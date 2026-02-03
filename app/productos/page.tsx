
import prisma from '@/lib/prisma'
import { ProductsView } from '@/components/products/ProductsView'

// Revalidate every 60 seconds (or 0 for always fresh)
export const revalidate = 0

export default async function ProductsPage() {

    // Fetch initial data on server
    const initialProducts = await prisma.strategicProduct.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { versions: true }
    })

    // Serialize dates if necessary
    const serialized = initialProducts.map(p => ({
        ...p,
        updatedAt: p.updatedAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
        versions: p.versions.map(v => ({
            ...v,
            createdAt: v.createdAt.toISOString()
        }))
    }))

    return <ProductsView initialProducts={serialized} />
}
