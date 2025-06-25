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
  Sr_No: string;
  Activity_ID: string;
  Name_of_Family_Head: string;
  Shop_House: string;
  Address: string;
  Locality: string;
  District: string;
  Town: string;
  UC: string;
  Tag: string;
  Submitted_by: string;
  Activity_DateTime: string;
  Picture: string;
  Latitude: number;
  Longitude: number;
}

export interface ContainerData {
  Activity_ID: string;
  Container_Tag: string;
  Checked: number;
  Positive: number;
}

export interface SurveillanceFilters {
  date: string;
  townCode?: number;
  ucCode?: number;
  fieldWorker?: string;
}

export interface SurveillanceResponse {
  combined_data: SurveillanceActivity[];
  container_data: ContainerData[];
  total_records: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}
