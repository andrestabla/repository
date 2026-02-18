import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var globalPrisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prismaInstance = globalThis.globalPrisma ?? prismaClientSingleton()

export default prismaInstance

if (process.env.NODE_ENV !== 'production') globalThis.globalPrisma = prismaInstance
