declare interface Element {
    setAttribute(name: string, value: boolean): void;
    setAttribute(name: string, value: number): void;
}

interface Window {
    currentOperation: any;
    m: any;
    M: any;
    exportSvg: any;
    exportPng: any;
}
