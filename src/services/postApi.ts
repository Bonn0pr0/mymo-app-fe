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

export interface NearbyPost {
  postId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  thumbnailUrl: string | null;
  caption: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

export interface PostMedia {
  mediaId: string;
  url: string;
  thumbnailUrl?: string | null;
}

export interface FeedPost {
  postId: string;
  userId: string;
  caption?: string | null;
  visibility?: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  media: PostMedia[];
}

export interface PostView {
  postId: string;
  displayName: string;
  avatarUrl?: string | null;
  thumbnailUrl?: string | null;
  caption: string;
  likeCount: number;
  commentCount: number;
}

export function getPostThumbnail(post: FeedPost | NearbyPost): string | null {
  if ('thumbnailUrl' in post && post.thumbnailUrl) return post.thumbnailUrl;
  const media = 'media' in post ? post.media?.[0] : null;
  return media?.thumbnailUrl || media?.url || null;
}

export function toPostView(
  post: FeedPost | NearbyPost,
  displayName?: string,
  avatarUrl?: string | null,
): PostView {
  return {
    postId: post.postId,
    displayName: 'displayName' in post ? post.displayName : (displayName || 'Friend'),
    avatarUrl: 'avatarUrl' in post ? post.avatarUrl : avatarUrl,
    thumbnailUrl: getPostThumbnail(post),
    caption: post.caption || '',
    likeCount: post.likeCount,
    commentCount: post.commentCount,
  };
}

export async function getNearbyPosts(
  lat: number,
  lng: number,
  radius = 5,
  page = 1,
  pageSize = 20,
): Promise<NearbyPost[]> {
  const query = `?lat=${lat}&lng=${lng}&radius=${radius}&page=${page}&pageSize=${pageSize}`;
  const response = await requestJson<ApiResponse<NearbyPost[]>>(`/posts/nearby${query}`, 'GET');
  return response.data ?? [];
}

export async function getFriendsFeed(): Promise<FeedPost[]> {
  const response = await requestJson<ApiResponse<FeedPost[]>>('/posts/feed/friends', 'GET');
  return response.data ?? [];
}

export async function getFeed(): Promise<FeedPost[]> {
  const response = await requestJson<ApiResponse<FeedPost[]>>('/posts/feed', 'GET');
  return response.data ?? [];
}

export async function getMyPosts(): Promise<FeedPost[]> {
  const response = await requestJson<ApiResponse<FeedPost[]>>('/posts/me', 'GET');
  return response.data ?? [];
}

export default {
  createPost,
  getNearbyPosts,
  getFriendsFeed,
  getFeed,
  getMyPosts,
};