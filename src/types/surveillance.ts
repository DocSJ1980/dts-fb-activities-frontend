export interface Town {
  town_name: string;
  town_code: number;
}

export interface UC {
  uc_name: string;
  town_code: number;
  uc_code: number;
}

export interface SurveillanceActivity {
  id: number;
  activity_id: string;
  name_of_family_head: string;
  shop_house: string;
  address: string;
  locality: string;
  district: string;
  town: string;
  uc: string;
  report_type: string;
  submitted_by: string;
  activity_datetime: string;
  picture_url: string;
  latitude: number;
  longitude: number;
  // Legacy field mappings for backward compatibility
  Sr_No?: string;
  Activity_ID?: string;
  Name_of_Family_Head?: string;
  Shop_House?: string;
  Address?: string;
  Locality?: string;
  District?: string;
  Town?: string;
  UC?: string;
  Tag?: string;
  Submitted_by?: string;
  Activity_DateTime?: string;
  Picture?: string;
  Latitude?: number;
  Longitude?: number;
}

export interface ContainerData {
  id: number;
  activity_id: string;
  container_tag: string;
  checked: number;
  positive: number;
  // Legacy field mappings for backward compatibility
  Activity_ID?: string;
  Container_Tag?: string;
  Checked?: number;
  Positive?: number;
}

export interface User {
  username: string;
  full_name?: string;
  // Employee data from employee_data table
  name?: string;
  fh_name?: string;
  cnic?: string;
  personal_no?: string;
  designation?: string;
  // contact_no removed for privacy protection
  activity_type?: string;
  new_username?: string;
  town?: string;
  town_id?: number;
  // Legacy fields for backward compatibility
  username_prefix?: string;
}

export interface SurveillanceFilters {
  date: string;
  townCode?: number | string;
  ucCode?: number | string;
  fieldWorker?: string;
}

export interface SurveillanceResponse {
  combined_data: SurveillanceActivity[];
  container_data: ContainerData[];
  users: User[];
  total_records: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}
