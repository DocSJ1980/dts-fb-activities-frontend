// Database table interfaces
export interface DengueSimpleActivity {
  id: string;
  latitude: number;
  longitude: number;
  district: string;
  town: string;
  uc: string;
  activity_datetime: string;
  dengue_larvae: string;
  tag: string;
  submitted_by: string;
}

export interface DtsPatientActivity {
  id: string;
  latitude: number;
  longitude: number;
  district: string;
  town: string;
  uc: string;
  activity_submission_datetime: string;
  patient_name: string;
  category_name: string;
  tag_name: string;
  submitted_by: string;
}

export interface DtsSurvActivity {
  id: string;
  activity_id: string;
  latitude: number;
  longitude: number;
  district: string;
  town: string;
  uc: string;
  activity_datetime: string;
  report_type: string;
  submitted_by: string;
}

export interface DtsContainer {
  id: string;
  activity_id: string;
  container_tag: string;
  checked: number;
  positive: number;
}

export interface DtsCaseResponseActivity {
  id: string;
  district: string;
  town: string;
  uc: string;
  submission_date: string;
  larva_source: string;
  submitted_by: string;
}

export interface DtsTpvActivity {
  id: string;
  district: string;
  town: string;
  uc: string;
  tpv_activity_date_time: string;
  tpv_type: string;
  auditor: string;
}

// Table names enum
export enum TableName {
  DENGUE_SIMPLE_ACTIVITIES = "dengue_simple_activities",
  DTS_PATIENT_ACTIVITIES = "dts_patient_activities",
  DTS_SURV_ACTIVITIES = "dts_surv_activities",
  DTS_CONTAINERS = "dts_containers",
  DTS_CASE_RESPONSE_ACTIVITIES = "dts_case_response_activities",
  DTS_TPV_ACTIVITIES = "dts_tpv_activities",
}

// Filter layer configuration
export interface FilterLayer {
  id: string;
  name: string;
  table: TableName;
  dateStart: string;
  dateEnd: string | null; // null means "till date"
  filters: Record<string, any>;
  color: string;
  enabled: boolean;
  recordCount?: number;
}

// Maps filter state
export interface MapsFilters {
  selectedTown: string;
  selectedUCs: string[]; // Array of UC names for multi-select
  layers: FilterLayer[];
}

// API request/response types
export interface MapsDataRequest {
  ucs: string[]; // Array of UC names
  layers: FilterLayer[];
}

export interface MapMarker {
  id: string;
  layerId: string;
  latitude: number;
  longitude: number;
  color: string;
  popupData: Record<string, any>;
  tableType: TableName;
}

export interface MapsDataResponse {
  markers: MapMarker[];
  layerCounts: Record<string, number>;
}

// Filter options for dropdowns
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterOptionsResponse {
  [key: string]: FilterOption[];
}

// UC centroid for tables without coordinates
export interface UCCentroid {
  uc: string;
  town: string;
  latitude: number;
  longitude: number;
}

// Layer template for saving/loading configurations
export interface LayerTemplate {
  id: string;
  name: string;
  description: string;
  layers: Omit<FilterLayer, "id" | "recordCount">[];
  createdAt: string;
}
