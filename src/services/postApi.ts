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

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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

export interface PostPayload {
  placeId?: string;
  caption: string;
  postType: string;
  visibility: string;
  latitude?: number;
  longitude?: number;
  mediaIds: string[];
}

export interface PostResponse {
  id: string;
  placeId: string;
  caption: string;
  postType: string;
  visibility: string;
  mediaIds: string[];
  createdAt: string;
}

export async function createPost(payload: PostPayload): Promise<PostResponse> {
  const response = await requestJson<ApiResponse<PostResponse>>('/posts', 'POST', payload);
  return response.data;
}

export default {
  createPost,
};