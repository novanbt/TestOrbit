import { DifficultyLevel, MockTest, TestQuestion, TestBundle, Category } from "./index";

export type AdminRole =
  | "super_admin"
  | "admin"
  | "content_manager"
  | "question_reviewer"
  | "support_staff"
  | "analyst";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  actorId: string;
  action: string;
  entityType: "test" | "series" | "question" | "order" | "user" | "category" | "setting" | "creator";
  entityId: string;
  details: string;
  timestamp: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface AdminDashboardMetrics {
  totalTests: number;
  draftTests: number;
  publishedSeries: number;
  totalLearners: number;
  totalAttempts: number;
  completedAttempts: number;
  paidOrders: number;
  grossSalesInPaise: number;
  refundTotalInPaise: number;
}

export interface CommerceOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  itemType: "test" | "series";
  itemId: string;
  itemTitle: string;
  amountInPaise: number;
  status: "completed" | "refunded" | "failed" | "pending";
  paymentProvider: "razorpay" | "stripe" | "testorbit_internal";
  paymentRef: string;
  createdAt: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountInPaise?: number;
  minOrderInPaise?: number;
  validUntil: string;
  usageCount: number;
  maxUsage?: number;
  active: boolean;
  createdAt: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  bio?: string;
  organization?: string;
  testsPublishedCount: number;
  commissionRate: number;
  totalEarningsInPaise: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  includedTestIds: string[];
  priceInPaise: number;
  isFree?: boolean;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SiteCMSConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  featuredTestIds: string[];
  featuredSeriesIds: string[];
  announcementBanner?: {
    active: boolean;
    text: string;
    link?: string;
    type: "info" | "alert";
  };
  faqs: Array<{ question: string; answer: string; id?: string }>;
}

export interface QuestionBankItem extends TestQuestion {
  categoryId?: string;
  subject?: string;
  difficulty?: DifficultyLevel;
  language?: string;
  tags?: string[];
  status?: "draft" | "approved" | "archived";
  assignedTestSlugs?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectTaxonomy {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  topics: string[];
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  currencySymbol: string;
  timezone: string;
  defaultExamDurationMinutes: number;
  defaultPassingPercentage: number;
  enableNegativeMarking: boolean;
  defaultNegativeMarkingRate: number;
  allowReviewLater: boolean;
  autoSaveIntervalSeconds: number;
  allowCalculator: boolean;
  resultReleasePolicy: "immediate" | "scheduled" | "manual";
  maintenanceMode: boolean;
}

export interface BrandingSettings {
  brandName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  darkLogoUrl?: string;
  fontFamily: string;
  contactAddress?: string;
}

