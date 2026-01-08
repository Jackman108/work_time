/**
 * Утилиты для форматирования данных
 */

export function formatCurrency(value: number | string | null | undefined): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
    }).format(numValue || 0);
}

export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU');
}

export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}


