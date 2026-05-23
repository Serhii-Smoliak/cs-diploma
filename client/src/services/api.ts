import type {
  User,
  Mission,
  Level,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  UserProgress,
  UserStats,
} from '@cybertactics/shared';
import { getApiBase, getApiOrigin } from '../config/apiOrigin';

export interface MitreTechnique {
  id: string;
  name: string;
  description: string | null;
  tactic: string;
  url: string | null;
  platforms?: string[];
  dataSources?: Array<{ source: string; component: string | null }>;
  defenseBypassed?: string[];
  permissionsRequired?: string[];
  examples?: string[];
  mitigation?: string[];
  updatedAt: string;
}

const API_BASE = getApiBase();

/** Resolves relative asset paths (e.g. /uploads/...) against the API host in production. */
export function resolveAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const origin = getApiOrigin();
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(message: string, status: number, body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(
        (errorBody.error as string) || `HTTP ${response.status}`,
        response.status,
        errorBody,
      );
    }

    return response.json();
  }

  async register(username: string, email: string, password: string) {
    const data = await this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getMissions(): Promise<Mission[]> {
    return this.request<Mission[]>('/missions');
  }

  async getMissionLevels(missionId: string): Promise<Level[]> {
    return this.request<Level[]>(`/missions/${missionId}/levels`);
  }

  async submitAnswer(levelId: string, answer: SubmitAnswerRequest['answer']): Promise<SubmitAnswerResponse> {
    const encodedLevelId = encodeURIComponent(levelId);
    return this.request<SubmitAnswerResponse>(`/levels/${encodedLevelId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return this.request<UserProgress[]>(`/users/${userId}/progress`);
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return this.request<UserStats>(`/users/${userId}/stats`);
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async uploadAvatar(image: string): Promise<User> {
    return this.request<User>('/users/me/avatar', {
      method: 'PUT',
      body: JSON.stringify({ image }),
    });
  }

  async updatePreferredLocale(locale: string): Promise<User> {
    return this.request<User>('/users/me/locale', {
      method: 'PUT',
      body: JSON.stringify({ locale }),
    });
  }

  async purchaseStealthMasking(): Promise<{ stealth: number; message: string }> {
    return this.request<{ stealth: number; message: string }>('/users/me/stealth/masking', {
      method: 'POST',
    });
  }

  async waitForStealthRecovery(): Promise<{ stealth: number; message: string }> {
    return this.request<{ stealth: number; message: string }>('/users/me/stealth/wait', {
      method: 'POST',
    });
  }

  async getMitreTechniques(): Promise<MitreTechnique[]> {
    return this.request<MitreTechnique[]>('/mitre/techniques');
  }

  async getMitreTechnique(id: string): Promise<MitreTechnique & { relatedMissions?: Array<{ id: string; name: string; description: string | null; difficulty: string }> }> {
    return this.request<MitreTechnique & { relatedMissions?: Array<{ id: string; name: string; description: string | null; difficulty: string }> }>(`/mitre/techniques/${id}`);
  }

  async getLanguages(): Promise<Array<{ code: string; name: string; flag: string; isActive: boolean }>> {
    return this.request<Array<{ code: string; name: string; flag: string; isActive: boolean }>>('/translations/languages');
  }

  async getTranslations(locale: string = 'uk', namespace: string = 'common'): Promise<Record<string, string>> {
    return this.request<Record<string, string>>(`/translations?locale=${locale}&namespace=${namespace}`);
  }

  async getTranslationsByNamespaces(locale: string = 'uk', namespaces: string[]): Promise<Record<string, Record<string, string>>> {
    const namespacesStr = namespaces.join(',');
    return this.request<Record<string, Record<string, string>>>(`/translations/namespaces?locale=${locale}&namespaces=${namespacesStr}`);
  }

  async getRandomHandler(group: string): Promise<{ codeName: string; group: string; specialization: string }> {
    return this.request<{ codeName: string; group: string; specialization: string }>(`/handlers/random/${group}`);
  }
}

export const api = new ApiClient();

