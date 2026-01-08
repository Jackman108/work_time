/**
 * Типы для конфигурации приложения
 */

export interface AppConfig {
    env: {
        isDev: boolean;
        isProduction: boolean;
        nodeEnv: string;
    };
    electron: {
        window: {
            width: number;
            height: number;
            minWidth: number;
            minHeight: number;
        };
        devTools: boolean;
        devServerUrl: string;
    };
    database: {
        dir: string;
        filename: string;
        path: string;
    };
    validation: {
        stringMaxLength: number;
        phoneMinDigits: number;
        defaultCurrency: string;
        defaultLocale: string;
    };
    formatting: {
        currency: {
            locale: string;
            currency: string;
            minimumFractionDigits: number;
            maximumFractionDigits: number;
        };
        date: {
            locale: string;
            options: {
                year: 'numeric' | '2-digit';
                month: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
                day: 'numeric' | '2-digit';
            };
        };
    };
}


