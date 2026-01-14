# 4Shine Methodology Builder

**Internal Tool for 4Shine Methodology Management and Generation.**

This application allows the management of the 4Shine methodology inventory, taxonomy, and artifact generation.

## Features

- **Dashboard**: Real-time metrics and backlog tracking.
- **Inventario Maestro**: Centralized content management.
- **Taxonomía**: Hierarchical pillar visualization.
- **Gap Analysis**: Coverage reporting.
- **Gobernanza & IP**: IP validation and compliance.
- **Generador**: Document generation interface.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Neon (PostgreSQL)
- **ORM**: Prisma
- **Styling**: Tailwind CSS v4

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/andrestabla/repository.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Database**:
   Configure `.env` with your Neon connection string:
   ```env
   DATABASE_URL="postgresql://..."
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Deployment

Deployed on [Vercel](https://vercel.com/algoritmo-ts-projects/repository).
