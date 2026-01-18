declare module 'officeparser' {
    export function parseOfficeAsync(buffer: Buffer): Promise<string>;
    export function parseOffice(buffer: Buffer, callback: (data: string, err: any) => void): void;
}
