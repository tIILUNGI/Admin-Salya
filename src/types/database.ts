export type UserRole = 'CLIENT' | 'OPERATOR' | 'SUPERVISOR' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';

export type ProcessStatus =
  | 'NEW'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'PAYMENT_PENDING'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export type DocumentStatus = 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'MISSING';

export type PaymentType = 'ELMASICO_SERVICE' | 'OFFICIAL_FEE';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  elmasico_fee: number;
  official_fee: number;
  estimated_time_days: number;
  is_active: boolean;
  integration_available: boolean;
  integration_system?: string;
  created_at: string;
  requirements?: ServiceRequirement[];
}

export interface DocumentType {
  id: string;
  name: string;
  code: string;
  description: string;
  allowed_extensions: string[];
  max_size_mb: number;
  is_active: boolean;
  created_at: string;
}

export interface ServiceRequirement {
  id: string;
  service_id: string;
  document_type_id: string;
  document_type?: DocumentType;
  is_required: boolean;
  notes?: string;
  created_at: string;
}

export interface Process {
  id: string;
  process_number: string;
  client_id: string;
  client?: UserProfile;
  service_id: string;
  service?: Service;
  operator_id?: string;
  operator?: UserProfile;
  supervisor_id?: string;
  supervisor?: UserProfile;
  status: ProcessStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  documents?: ProcessDocument[];
  payments?: Payment[];
  history?: ProcessStatusHistory[];
}

export interface ProcessStatusHistory {
  id: string;
  process_id: string;
  previous_status?: ProcessStatus;
  new_status: ProcessStatus;
  changed_by: string;
  changed_by_profile?: UserProfile;
  notes?: string;
  created_at: string;
}

export interface ProcessDocument {
  id: string;
  process_id: string;
  document_type_id: string;
  document_type?: DocumentType;
  client_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  signed_url?: string;
}

export interface PaymentMethodData {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  instructions: string;
  created_at: string;
}

export interface Payment {
  id: string;
  process_id: string;
  process_number?: string;
  client_id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  provider: string;
  paid_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  process_id?: string;
  created_at: string;
}

export interface Message {
  id: string;
  process_id: string;
  sender_id: string;
  sender_profile?: UserProfile;
  receiver_id: string;
  content: string;
  attachment_url?: string;
  read: boolean;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  service_id?: string;
  process_id?: string;
  created_at: string;
  updated_at: string;
  messages?: AIMessage[];
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Operator {
  id: string;
  user_id: string;
  user_profile?: UserProfile;
  department: string;
  max_assigned_processes: number;
  current_assigned_count?: number;
  is_active: boolean;
  created_at: string;
}

export interface Supervisor {
  id: string;
  user_id: string;
  user_profile?: UserProfile;
  department: string;
  is_active: boolean;
  created_at: string;
}

export interface Integration {
  id: string;
  name: string;
  system: string;
  url: string;
  type: 'OFFICIAL_API' | 'MANUAL_ASSIST' | 'WEBHOOK';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  api_available: boolean;
  configuration: Record<string, any>;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  integration_name?: string;
  endpoint: string;
  operation: string;
  success: boolean;
  response_code: number;
  response_sanitized: string;
  duration_ms: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface SystemSettings {
  company_name: string;
  slogan: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  ai_assistant_name: string;
  ai_initial_message: string;
  fallback_to_operator: boolean;
  maintenance_mode: boolean;
}
