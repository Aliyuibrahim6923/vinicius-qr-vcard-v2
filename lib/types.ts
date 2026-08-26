export type Employee = {
  id: string;
  active: boolean;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string | null;
  email: string | null;
  phone: string | null;
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
  destination_type: "employee_profile" | "employee_vcard" | "external";
  employee_id: string | null;
  destination_url: string | null;
  created_at: string;
  updated_at: string;
};
