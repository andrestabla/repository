
export const DriveUtils = {
    /**
     * Extracts the File ID from a Google Drive URL.
     * Supports various formats:
     * - drive.google.com/file/d/ID/view
     * - docs.google.com/document/d/ID/edit
     * - docs.google.com/spreadsheets/d/ID/htmlview
     * - docs.google.com/presentation/d/ID/pub
     */
    extractId(url: string | null): string | null {
        if (!url) return null;
        const regex = /(?:\/d\/|id=|folders\/)([-\w]{25,})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },

    /**
     * Determines the optimal embed URL based on the file type/URL structure.
     * For native G-Suite apps (Docs, Sheets, Slides), it tries to provide a richer preview.
     */
    getEmbedUrl(id: string, originalUrl: string = ''): string {
        const isDocs = originalUrl.includes('docs.google.com/document');
        const isSheets = originalUrl.includes('docs.google.com/spreadsheets');
        const isSlides = originalUrl.includes('docs.google.com/presentation');
        const isForms = originalUrl.includes('docs.google.com/forms');

        if (isDocs) return `https://docs.google.com/document/d/${id}/preview`; // Preview is cleaner for docs
        if (isSheets) return `https://docs.google.com/spreadsheets/d/${id}/preview`;
        if (isSlides) return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`;
        if (isForms) return `https://docs.google.com/forms/d/${id}/viewform?embedded=true`;

        // Default for binary files (PDF, Video, Images)
        return `https://drive.google.com/file/d/${id}/preview`;
    },

    /**
     * Infers the file type label from the URL if possible
     */
    inferType(url: string): string {
        if (url.includes('document')) return 'Documento';
        if (url.includes('spreadsheets')) return 'Hoja de Cálculo';
        if (url.includes('presentation')) return 'Presentación';
        if (url.includes('forms')) return 'Herramienta'; // Surveys are tools
        if (url.includes('drive.google.com')) return 'Archivo Drive';
        return 'Enlace';
    }
}
