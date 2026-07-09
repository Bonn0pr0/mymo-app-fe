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

async function requestJson<T>(path: string, method: string): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    Accept: '*/*',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { method, headers });
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

export interface PlaceResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  [key: string]: unknown;
}

/**
 * Lấy danh sách địa điểm gần một toạ độ (mặc định bán kính 2km).
 * Endpoint: GET /api/places/nearby?Latitude=...&Longitude=...&RadiusKm=...
 */
export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radiusKm = 2
): Promise<PlaceResult[]> {
  const query = `?Latitude=${latitude}&Longitude=${longitude}&RadiusKm=${radiusKm}`;
  const response = await requestJson<ApiResponse<PlaceResult[]>>(`/places/nearby${query}`, 'GET');
  return response.data ?? [];
}

/**
 * Tiện ích: lấy địa điểm GẦN NHẤT trong danh sách trả về.
 * Giả định API đã sắp theo khoảng cách; nếu không, ta tự sort theo distanceKm nếu có.
 */
export function pickClosestPlace(places: PlaceResult[]): PlaceResult | null {
  if (!places || places.length === 0) return null;
  const sorted = [...places].sort((a, b) => {
    const da = a.distanceKm ?? Number.MAX_VALUE;
    const db = b.distanceKm ?? Number.MAX_VALUE;
    return da - db;
  });
  return sorted[0];
}

export default {
  getNearbyPlaces,
  pickClosestPlace,
};