import http from '../apis/http';

export interface Notification {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    relatedId?: string;
    createdAt: string;
}

export const notificationService = {
    getMyNotifications: async () => {
        const response = await http.get('/api/Notification');
        return response.data;
    },
    markAsRead: async (id: number) => {
        const response = await http.put(`/api/Notification/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await http.put('/api/Notification/read-all');
        return response.data;
    },
    notifyAdminAction: async (actionCode: string, details: string) => {
        const response = await http.post('/api/Notification/notify-admin', { actionCode, details });
        return response.data;
    }
};
