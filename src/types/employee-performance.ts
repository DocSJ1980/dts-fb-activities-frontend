// Employee Performance Types
// Defines interfaces for employee performance tracking and analytics

export interface Employee {
  id: number;
  name: string;
  fh_name?: string;
  cnic?: string;
  personal_no?: string;
  designation?: string;
  contact_no?: string;
  activity_type?: string;
  username: string;
  new_username?: string;
  town?: string;
  town_id?: number;
}

export interface EmployeePerformanceFilters {
  employeeId: number;
  username: string;
  dateFrom: string;
  dateTo: string;
}

export interface DailyActivityCount {
  date: string;
  total_activities: number;
  surveillance_activities: number;
  simple_activities: number;
  patient_activities: number;
  case_response_activities: number;
  tpv_activities: number;
}

export interface ActivitySummary {
  activity_type: 'surveillance' | 'simple' | 'patient' | 'case_response' | 'tpv' | 'larva_detected';
  activity_label: string;
  total_count: number;
  icon: string;
  description: string;
  average_score?: number; // For TPV activities, this represents average performance score
}

export interface EmployeeActivity {
  id: number;
  activity_id: string;
  activity_type: 'surveillance' | 'simple' | 'patient' | 'case_response' | 'tpv';
  activity_datetime: string;
  district?: string;
  town?: string;
  uc?: string;
  latitude?: number;
  longitude?: number;
  picture_url?: string;
  // Activity-specific fields
  name_of_family_head?: string; // surveillance
  shop_house?: string; // surveillance
  address?: string; // surveillance, simple, patient
  locality?: string; // surveillance
  report_type?: string; // surveillance
  patient_name?: string; // patient
  tag_name?: string; // patient
  patient_place?: string; // patient
  category_name?: string; // patient
  name_address?: string; // simple
  dengue_larvae?: string; // simple
  tag?: string; // simple
  larva_source?: string; // case_response
  case_response_id?: string; // case_response
  tpv_type?: string; // tpv
  auditor?: string; // tpv
  auditee?: string; // tpv
  tpv_score?: string; // tpv
  // Container data for surveillance activities
  containers?: ContainerData[];
  larva_found?: boolean; // Derived from container data
}

export interface ContainerData {
  id: number;
  activity_id: string;
  container_tag?: string;
  checked: number;
  positive: number;
}

export interface EmployeePerformanceResponse {
  employee: Employee;
  daily_counts: DailyActivityCount[];
  activity_summary: ActivitySummary[];
  total_records: number;
}

export interface EmployeeActivitiesResponse {
  activities: EmployeeActivity[];
  total_records: number;
  has_more: boolean;
  page: number;
  limit: number;
}

export interface EmployeeSearchResponse {
  employees: Employee[];
  total_count: number;
}

// Date range helpers
export interface DateRange {
  from: string;
  to: string;
}

// GitHub-style contribution grid data
export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 4 = highest activity
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionData {
  weeks: ContributionWeek[];
  total_contributions: number;
  date_range: DateRange;
}