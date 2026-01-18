declare module 'officeparser' {
    export function parseOffice(buffer: Buffer, callback: (data: string, err: any) => void): void;
}
