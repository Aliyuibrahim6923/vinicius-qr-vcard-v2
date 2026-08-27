export type Employee = {
  id: string;
  active: boolean;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  phone_action: "call" | "whatsapp" | "both";
  website: string | null;
  address: string | null;
  linkedin_url: string | null;
  bio: string | null;
  photo_url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type QRCodeRecord = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  active: boolean;
  destination_type: "employee_profile" | "external";
  employee_id: string | null;
  destination_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BotSettings = {
  id: boolean;
  enabled: boolean;
  company_name: string;
  whatsapp_number: string;
  greeting_message: string;
  system_prompt: string;
  updated_at: string;
};

export type KnowledgeSource = {
  id: string;
  source_type: "website" | "document" | "text";
  name: string;
  source_url: string | null;
  storage_path: string | null;
  status: "processing" | "ready" | "error";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
