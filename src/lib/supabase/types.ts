/**
 * أنواع مطابقة لجدول conferences في Supabase (Database Types).
 * هذا هو مصدر الحقيقة لشكل الصف كما هو مخزّن في PostgreSQL (snake_case).
 * النوع التطبيقي (camelCase) المستخدم داخل الواجهة موجود في @/types/conference
 * ويُحوَّل إليه عبر conferenceService (mapRowToConference).
 */
export type ConferenceStatus = "DRAFT" | "OPEN" | "CLOSED";

export type ConferenceRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  organizer_name: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  submission_start: string;
  submission_end: string;
  status: ConferenceStatus;
  scientific_fields: string[];
  submission_conditions: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

/** الأعمدة العامة المسموح كشفها في الصفحة العامة (بدون contact_email) */
export type PublicConferenceRow = Omit<ConferenceRow, "contact_email">;

export type ConferenceInsert = Omit<
  ConferenceRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type ConferenceUpdate = Partial<ConferenceInsert>;

/**
 * أنواع مطابقة لجداول المرحلة الثالثة: researchers, papers, paper_versions.
 * نفس مبدأ conferences أعلاه: هذا مصدر الحقيقة لشكل الصف الخام (snake_case)،
 * والنوع التطبيقي (camelCase) موجود في @/types ويُبنى عبر submissionService.
 */
export type PaperStatusRow =
  | "SUBMITTED"
  | "INITIAL_SCREENING"
  | "INITIAL_SCREENING_REJECTED"
  | "READY_FOR_REVIEW"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "REVISION_SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type ResearcherRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  country: string | null;
  academic_degree: string | null;
  specialization: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewerRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  affiliation: string | null;
  specialties: string[];
  is_active: boolean;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewerInsert = Omit<
  ReviewerRow,
  "id" | "created_at" | "updated_at" | "invited_at" | "accepted_at"
> & {
  id?: string;
  invited_at?: string | null;
  accepted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ReviewerUpdate = Partial<Omit<ReviewerRow, "id" | "created_at" | "updated_at">>;

export type PaperRow = {

  id: string;
  paper_number: string;
  conference_id: string;
  researcher_id: string;
  assigned_reviewer_id: string | null;
  title: string;
  abstract: string;
  scientific_field: string;
  keywords: string[];
  status: PaperStatusRow;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type PaperVersionRow = {
  id: string;
  paper_id: string;
  version_number: number;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string | null;
  created_at: string;
};

/** Payload المُرسَل إلى public.submit_paper (RPC) — انظر supabase/migrations/002_submission_schema.sql */
export type SubmitPaperPayload = {
  conference_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  country?: string | null;
  academic_degree?: string | null;
  specialization?: string | null;
  title: string;
  abstract: string;
  scientific_field: string;
  keywords: string[];
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
};

export type SubmitPaperResult = {
  paper_id: string;
  paper_number: string;
};

/**
 * أنواع مطابقة لجدول profiles (المرحلة الرابعة) — ملف تعريف كل مستخدم Auth ودوره.
 */
export type UserRole = "ADMIN" | "RESEARCHER" | "REVIEWER";

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  organization_id: string | null;
  reviewer_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PaperReviewerAssignmentRow = {
  id: string;
  paper_id: string;
  reviewer_id: string;
  status: string;
  invitation_sent_at: string;
  responded_at: string | null;
  decline_reason: string | null;
  due_date: string;
  extension_status: string;
  extension_requested_days: number | null;
  extension_reason: string | null;
  extension_requested_at: string | null;
  extension_responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewReportRow = {
  id: string;
  assignment_id: string;
  paper_id: string;
  reviewer_id: string;
  status: string;
  recommendation: string | null;
  originality_score: number | null;
  methodology_score: number | null;
  clarity_score: number | null;
  significance_score: number | null;
  overall_score: number | null;
  comments_for_author: string | null;
  confidential_comments_for_editor: string | null;
  attachment_file_path: string | null;
  attachment_file_name: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      conferences: {
        Row: ConferenceRow;
        Insert: ConferenceInsert;
        Update: ConferenceUpdate;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      researchers: {
        Row: ResearcherRow;
        Insert: Omit<ResearcherRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<ResearcherRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      papers: {
        Row: PaperRow;
        Insert: Omit<PaperRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<PaperRow, "id" | "created_at" | "updated_at">>;
        Relationships: [
          {
            foreignKeyName: "papers_conference_id_fkey";
            columns: ["conference_id"];
            isOneToOne: false;
            referencedRelation: "conferences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "papers_assigned_reviewer_id_fkey";
            columns: ["assigned_reviewer_id"];
            isOneToOne: false;
            referencedRelation: "reviewers";
            referencedColumns: ["id"];
          }
        ];
      };
      paper_versions: {
        Row: PaperVersionRow;
        Insert: Omit<PaperVersionRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<PaperVersionRow, "id" | "created_at">>;
        Relationships: [];
      };
      reviewers: {
        Row: ReviewerRow;
        Insert: ReviewerInsert;
        Update: ReviewerUpdate;
        Relationships: [];
      };
      paper_reviewer_assignments: {
        Row: PaperReviewerAssignmentRow;
        Insert: Partial<PaperReviewerAssignmentRow>;
        Update: Partial<PaperReviewerAssignmentRow>;
        Relationships: [];
      };
      review_reports: {
        Row: ReviewReportRow;
        Insert: Partial<ReviewReportRow>;
        Update: Partial<ReviewReportRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow>;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Views: Record<string, any>;
    Functions: {
      submit_paper: {
        Args: { payload: SubmitPaperPayload };
        Returns: SubmitPaperResult;
      };
      conference_accepts_submissions: {
        Args: { p_conference_id: string };
        Returns: boolean;
      };
    };
  };
}
