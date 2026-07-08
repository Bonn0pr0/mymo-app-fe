import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://beexe-production.up.railway.app/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

export interface FriendSummary {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  requestedAt?: string;
  mutualFriendsCount?: number;
}

export interface FriendStatusResponse {
  userId: string;
  status: string;
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('mymo.accessToken');
}

async function requestJson<T>(path: string, method: string, body?: unknown, isMultipart = false): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Accept: '*/*',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body && !isMultipart ? JSON.stringify(body) : (body as FormData | undefined),
  });

  const rawText = await response.text();
  let data: unknown = rawText;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message?: unknown }).message)
      : 'Unable to complete request';
    throw new Error(message);
  }

  return data as T;
}

export async function requestFriend(userId: string): Promise<boolean> {
  const response = await requestJson<ApiResponse<boolean>>('/friends/request', 'POST', { userId });
  return response.data;
}

export async function acceptFriend(friendId: string): Promise<boolean> {
  const response = await requestJson<ApiResponse<boolean>>(`/friends/${friendId}/accept`, 'PUT');
  return response.data;
}

export async function rejectFriend(friendId: string): Promise<boolean> {
  const response = await requestJson<ApiResponse<boolean>>(`/friends/${friendId}/reject`, 'PUT');
  return response.data;
}

export async function cancelFriendRequest(friendId: string): Promise<boolean> {
  const response = await requestJson<ApiResponse<boolean>>(`/friends/request/${friendId}`, 'DELETE');
  return response.data;
}

export async function removeFriend(friendId: string): Promise<boolean> {
  const response = await requestJson<ApiResponse<boolean>>(`/friends/${friendId}`, 'DELETE');
  return response.data;
}

export async function getFriends(): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>('/friends', 'GET');
  return response.data;
}

export async function getFriendRequests(): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>('/friends/requests', 'GET');
  return response.data;
}

export async function getSentRequests(): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>('/friends/sent', 'GET');
  return response.data;
}

export async function getFriendStatus(userId: string): Promise<FriendStatusResponse> {
  const response = await requestJson<ApiResponse<FriendStatusResponse>>(`/friends/status/${userId}`, 'GET');
  return response.data;
}

export async function getFriendSuggestions(): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>('/friends/suggestions', 'GET');
  return response.data;
}

export async function getMutualFriends(userId: string): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>(`/friends/mutual/${userId}`, 'GET');
  return response.data;
}

export async function getFriendCount(): Promise<number> {
  const response = await requestJson<ApiResponse<number>>('/friends/count', 'GET');
  return response.data;
}

export async function getOnlineFriends(): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>('/friends/online', 'GET');
  return response.data;
}

export async function searchFriends(keyword: string): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>(`/friends/search?keyword=${encodeURIComponent(keyword)}`, 'GET');
  return response.data;
}

export async function blockFriend(userId: string): Promise<boolean> {
  const response = await requestJson<ApiResponse<boolean>>('/friends/block', 'POST', { userId });
  return response.data;
}

export async function getBlockedFriends(): Promise<FriendSummary[]> {
  const response = await requestJson<ApiResponse<FriendSummary[]>>('/friends/block', 'GET');
  return response.data;
}
