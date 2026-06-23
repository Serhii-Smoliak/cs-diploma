import type {
  User,
  Mission,
  Level,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  UserProgress,
  UserStats,
  LeaderboardEntry,
} from '@cybertactics/shared';
import { handleSessionExpired } from '../auth/sessionExpired';
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

export interface AdminUserSummary {
  id: string;
  username: string;
  email: string;
  role: string;
  xp: number;
  rank: string;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
}

export interface LocaleMitreCoverage {
  full: number;
  partial: number;
  none: number;
}

export interface MitreAdminStats {
  totalTechniques: number;
  uk: LocaleMitreCoverage;
  en: LocaleMitreCoverage;
}

export interface MitreAdminSyncResponse {
  success: boolean;
  message: string;
  synced: number;
  errors: number;
  coverage: MitreAdminStats;
}

export type SupportTicketStatus = 'OPEN' | 'ANSWERED' | 'CLOSED';

export type SupportTicketCloseReason = 'ANSWERED' | 'DECLINED' | 'CUSTOM';

export interface SupportTicketSummary {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  closedAt: string | null;
  closeReason: SupportTicketCloseReason | null;
  closeReasonText: string | null;
  createdAt: string;
  updatedAt: string;
  messagePreview?: string;
  username?: string;
  email?: string;
}

export interface SupportMessage {
  id: string;
  authorId: string;
  authorUsername: string;
  body: string;
  isStaffReply: boolean;
  createdAt: string;
}

export interface SupportTicketDetail extends SupportTicketSummary {
  messages: SupportMessage[];
}

export interface SupportTicketLimit {
  limit: number;
  usedToday: number;
  remainingToday: number;
}

export type NotificationType = 'SUPPORT_REPLY' | 'SYSTEM' | 'NEWS';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  newsTitle?: string;
  supportSubject?: string;
}

export interface NewsPost {
  id: string;
  title: string;
  titleUk: string;
  titleEn: string;
  body: string;
  bodyUk: string;
  bodyEn: string;
  isPublished: boolean;
  publishedAt: string | null;
  authorId: string;
  authorUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationUnreadCount {
  count: number;
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

      if (response.status === 401 && token && !endpoint.startsWith('/auth/')) {
        handleSessionExpired();
      }

      throw new ApiError(
        (errorBody.error as string) || `HTTP ${response.status}`,
        response.status,
        errorBody
      );
    }

    if (response.status === 204) {
      return undefined as T;
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

  async submitAnswer(
    levelId: string,
    answer: SubmitAnswerRequest['answer']
  ): Promise<SubmitAnswerResponse> {
    const encodedLevelId = encodeURIComponent(levelId);
    return this.request<SubmitAnswerResponse>(`/levels/${encodedLevelId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  async getUserProgress(): Promise<UserProgress[]> {
    return this.request<UserProgress[]>('/users/me/progress');
  }

  async getUserStats(): Promise<UserStats> {
    return this.request<UserStats>('/users/me/stats');
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

  async getMitreTechnique(id: string): Promise<
    MitreTechnique & {
      relatedMissions?: Array<{
        id: string;
        name: string;
        description: string | null;
        difficulty: string;
      }>;
    }
  > {
    return this.request<
      MitreTechnique & {
        relatedMissions?: Array<{
          id: string;
          name: string;
          description: string | null;
          difficulty: string;
        }>;
      }
    >(`/mitre/techniques/${id}`);
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>('/users/leaderboard');
  }

  async getLanguages(): Promise<
    Array<{ code: string; name: string; flag: string; isActive: boolean }>
  > {
    return this.request<Array<{ code: string; name: string; flag: string; isActive: boolean }>>(
      '/translations/languages'
    );
  }

  async getTranslations(
    locale: string = 'uk',
    namespace: string = 'common'
  ): Promise<Record<string, string>> {
    return this.request<Record<string, string>>(
      `/translations?locale=${locale}&namespace=${namespace}`
    );
  }

  async getTranslationsByNamespaces(
    namespaces: string[],
    locale: string = 'uk'
  ): Promise<Record<string, Record<string, string>>> {
    const namespacesStr = namespaces.join(',');
    return this.request<Record<string, Record<string, string>>>(
      `/translations/namespaces?locale=${locale}&namespaces=${namespacesStr}`
    );
  }

  async getAdminUsers(): Promise<AdminUserSummary[]> {
    return this.request<AdminUserSummary[]>('/admin/users');
  }

  async setAdminUserBlocked(
    userId: string,
    blocked: boolean,
    reason?: string
  ): Promise<AdminUserSummary> {
    return this.request<AdminUserSummary>(`/admin/users/${userId}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ blocked, reason }),
    });
  }

  async getAdminMitreStats(): Promise<MitreAdminStats> {
    return this.request<MitreAdminStats>('/admin/mitre/stats');
  }

  async syncAdminMitre(): Promise<MitreAdminSyncResponse> {
    return this.request<MitreAdminSyncResponse>('/admin/mitre/sync', {
      method: 'POST',
    });
  }

  async getSupportTicketLimit(): Promise<SupportTicketLimit> {
    return this.request<SupportTicketLimit>('/support/tickets/limit');
  }

  async getSupportTickets(): Promise<SupportTicketSummary[]> {
    return this.request<SupportTicketSummary[]>('/support/tickets');
  }

  async getSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
    return this.request<SupportTicketDetail>(`/support/tickets/${ticketId}`);
  }

  async createSupportTicket(subject: string, message: string): Promise<SupportTicketSummary> {
    return this.request<SupportTicketSummary>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, message }),
    });
  }

  async getAdminSupportTickets(): Promise<SupportTicketSummary[]> {
    return this.request<SupportTicketSummary[]>('/admin/support/tickets');
  }

  async getAdminSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
    return this.request<SupportTicketDetail>(`/admin/support/tickets/${ticketId}`);
  }

  async replyAdminSupportTicket(ticketId: string, body: string): Promise<SupportMessage> {
    return this.request<SupportMessage>(`/admin/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  async closeAdminSupportTicket(
    ticketId: string,
    reason: SupportTicketCloseReason,
    reasonText?: string
  ): Promise<SupportTicketDetail> {
    return this.request<SupportTicketDetail>(`/admin/support/tickets/${ticketId}/close`, {
      method: 'POST',
      body: JSON.stringify({ reason, reasonText }),
    });
  }

  async updateAdminSupportMessage(messageId: string, body: string): Promise<SupportMessage> {
    return this.request<SupportMessage>(`/admin/support/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    });
  }

  async deleteAdminSupportMessage(messageId: string): Promise<void> {
    await this.request<void>(`/admin/support/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async getNotifications(): Promise<AppNotification[]> {
    return this.request<AppNotification[]>('/notifications');
  }

  async getNotificationUnreadCount(): Promise<NotificationUnreadCount> {
    return this.request<NotificationUnreadCount>('/notifications/unread-count');
  }

  async markNotificationRead(notificationId: string): Promise<AppNotification> {
    return this.request<AppNotification>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async getNewsPosts(): Promise<NewsPost[]> {
    return this.request<NewsPost[]>('/news');
  }

  async getNewsPost(newsId: string): Promise<NewsPost> {
    return this.request<NewsPost>(`/news/${newsId}`);
  }

  async getAdminNewsPosts(): Promise<NewsPost[]> {
    return this.request<NewsPost[]>('/admin/news');
  }

  async createAdminNewsPost(payload: {
    titleUk: string;
    titleEn: string;
    bodyUk: string;
    bodyEn: string;
    isPublished?: boolean;
  }): Promise<NewsPost> {
    return this.request<NewsPost>('/admin/news', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAdminNewsPost(
    newsId: string,
    payload: Partial<{
      titleUk: string;
      titleEn: string;
      bodyUk: string;
      bodyEn: string;
      isPublished: boolean;
    }>
  ): Promise<NewsPost> {
    return this.request<NewsPost>(`/admin/news/${newsId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteAdminNewsPost(newsId: string): Promise<void> {
    await this.request<void>(`/admin/news/${newsId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
