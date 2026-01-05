/**
 * Глобальные типы для приложения
 * 
 * @module types/global
 */

/// <reference path="./index.d.ts" />

// Расширение Window для Electron API
interface Window {
    electronAPI: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
}

// Типы для React
declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}

