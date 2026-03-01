// ============================================================
// GenZ IITian Connect — Core Type Definitions
// ============================================================

export type PlanType = 'free' | 'pro' | 'premium';

export type UserStatus = 'online' | 'in-queue' | 'in-chat' | 'offline';

export type ChatMode = 'text' | 'video';

export type ReportReason =
  | 'harassment'
  | 'nudity'
  | 'spam'
  | 'hate_speech'
  | 'impersonation'
  | 'underage'
  | 'other';

export type MatchFilter = {
  degreeType?: string;
  courseLevel?: string;
  topic?: string;
  programmingLanguage?: string;
  examPrep?: string;
};

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  planType: PlanType;
  isVerified: boolean;
  isBanned: boolean;
  ageVerified: boolean;
  consentGiven: boolean;
  matchesUsedToday: number;
  maxMatchesPerDay: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  amount: number;
  currency: string;
}

export interface ChatSession {
  sessionId: string;
  user1Id: string;
  user2Id: string;
  mode: ChatMode;
  startTime: string;
  endTime?: string;
  reportedFlag: boolean;
  ipHash1?: string;
  ipHash2?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'system';
}

export interface Report {
  reportId: string;
  sessionId: string;
  reportedUserId: string;
  reporterUserId: string;
  reason: ReportReason;
  description?: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
}

export interface QueueEntry {
  userId: string;
  planType: PlanType;
  mode: ChatMode;
  filters: MatchFilter;
  joinedAt: string;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  matchesPerDay: number;
  videoEnabled: boolean;
  topicFilters: boolean;
  priorityMatching: boolean;
  highlighted?: boolean;
}
