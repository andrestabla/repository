declare module 'officeparser' {
    export interface OfficeParserAST {
        toText(): string;
        // Add other properties if needed
    }

    export function parseOffice(
        file: string | Buffer | ArrayBuffer,
        config?: any
    ): Promise<OfficeParserAST>;

    export function parseOffice(
        file: string | Buffer | ArrayBuffer,
        callback: (ast: OfficeParserAST, err: any) => void
    ): void;
}
