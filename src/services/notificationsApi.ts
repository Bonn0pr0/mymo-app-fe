import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://beexe-production.up.railway.app/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('mymo.accessToken');
}

async function requestJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Accept: '*/*',
    'Content-Type': 'application/json',
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown = text;
  if (text) {
    try { data = JSON.parse(text); } catch {}
  }

  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'message' in data ? String((data as any).message) : 'Request failed';
    throw new Error(msg);
  }

  return data as T;
}

export interface NotificationItem {
  id: string;
  type: string;
  title?: string;
  body?: string;
  createdAt?: string;
  isRead?: boolean;
  senderId?: string;
  referenceId?: string | null;
}

interface RawNotificationItem {
  notificationId: string;
  senderId: string;
  type: string;
  title?: string;
  content?: string;
  referenceId?: string | null;
  isRead?: boolean;
  createdAt?: string;
}

function mapNotificationType(rawType: string, title?: string, content?: string): string {
  const type = rawType.toLowerCase();
  const text = `${title || ''} ${content || ''}`.toLowerCase();

  if (type.includes('friendrequest') || type.includes('friend_request')) {
    if (text.includes('accepted') || text.includes('đồng ý')) return 'friend_accepted';
    if (text.includes('rejected') || text.includes('declined') || text.includes('từ chối')) return 'friend_rejected';
    if (/sent you|has sent|friend request/.test(text)) return 'request';
    return 'info';
  }

  if (type.includes('like')) return 'like';
  return 'info';
}

function extractSenderName(title?: string, content?: string): string | null {
  const text = content || title || '';
  const match = text.match(/^(.+?)\s+(sent you|accepted your|declined your)/i);
  return match?.[1]?.trim() || null;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await requestJson<ApiResponse<RawNotificationItem[]>>('/notifications', 'GET');
  return (res.data || []).map(item => {
    const mappedType = mapNotificationType(item.type, item.title, item.content);
    const senderName = extractSenderName(item.title, item.content);

    return {
      id: item.notificationId,
      type: mappedType,
      title: senderName || item.title,
      body: item.content || item.title,
      createdAt: item.createdAt,
      isRead: item.isRead,
      senderId: item.senderId,
      referenceId: item.referenceId,
    };
  });
}

export async function getUnreadCount(): Promise<number> {
  const res = await requestJson<ApiResponse<number>>('/notifications/unread-count', 'GET');
  return res.data || 0;
}

export async function markAsRead(id: string): Promise<boolean> {
  const res = await requestJson<ApiResponse<boolean>>(`/notifications/${id}/read`, 'PUT');
  return res.data;
}

export async function markAllRead(): Promise<boolean> {
  const res = await requestJson<ApiResponse<boolean>>('/notifications/read-all', 'PUT');
  return res.data;
}

export async function deleteNotification(id: string): Promise<boolean> {
  const res = await requestJson<ApiResponse<boolean>>(`/notifications/${id}`, 'DELETE');
  return res.data;
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
};
