export interface Notification {
    id: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
    duration: number | null;
}