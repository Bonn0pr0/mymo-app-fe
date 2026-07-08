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

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await requestJson<ApiResponse<RawNotificationItem[]>>('/notifications', 'GET');
  return (res.data || []).map(item => {
    const rawType = item.type ? item.type.toLowerCase() : 'info';
    const content = (item.content || item.title || '').toLowerCase();

    // Only treat server-side FriendRequest notifications as actionable 'request' when
    // the content clearly indicates a new incoming request (e.g. "sent you a friend request").
    let mappedType = rawType;
    if (rawType.includes('friendrequest') || rawType.includes('friend_request')) {
      const isAccepted = content.includes('accept') || content.includes('accepted') || content.includes('was accepted');
      const isIncoming = /sent you|has sent|someone sent|new friend request|friend request to you/.test(content + ' ' + (item.title || ''));
      if (isIncoming && !isAccepted) {
        mappedType = 'request';
      } else {
        mappedType = 'info';
      }
    }

    return {
      id: item.notificationId,
      type: mappedType,
      title: item.title,
      body: item.content,
      createdAt: item.createdAt,
      isRead: item.isRead,
      senderId: item.senderId,
      referenceId: item.referenceId,
    } as NotificationItem & { isRead?: boolean; senderId?: string; referenceId?: string | null };
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
