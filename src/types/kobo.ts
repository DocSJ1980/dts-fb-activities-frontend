export interface KoboAttachment {
  download_url: string;
  download_large_url: string;
  download_medium_url: string;
  download_small_url: string;
  mimetype: string;
  filename: string;
  media_file_basename: string;
  instance: number;
  xform?: number;
  id: number;
  uid: string;
  question_xpath: string;
}

export interface KoboResult {
  _id: number;
  "formhub/uuid": string;
  start: string;
  end: string;

  "group_general/supervisor_cnic"?: string;
  "group_general/town"?: string;
  "group_general/uc"?: string;
  "group_general/Date_of_Visit"?: string;
  "group_general/Time_of_Visit"?: string;

  "group_general_001/Team_Type"?: string;
  "group_general_001/Dengue_Team_Number"?: string;
  "group_general_001/Team_Member_1_Name"?: string;
  "group_general_001/Team_Member_2_Name"?: string;
  "group_general_001/group_ln8pu96/area_address"?: string;

  "group_lf2gx57/Bag_Available_with_the_team"?: string;
  "group_lf2gx57/Torch_Available"?: string;
  "group_lf2gx57/Torch_Functional"?: string;
  "group_lf2gx57/Cards_Available"?: string;
  "group_lf2gx57/Wearing_Card"?: string;
  "group_lf2gx57/Temephos_Granules_Available"?: string;
  "group_lf2gx57/Permanent_Markers_Available"?: string;
  "group_lf2gx57/Awareness_Material_Present_With_Team"?: string;
  "group_lf2gx57/Larva_Stickers_Available"?: string;

  "group_hs_1/hs_1_location"?: string;
  "group_hs_1/hs_1_picture"?: string;
  "group_hs_1/hs_1_q1"?: string;
  "group_hs_1/hs_1_q2"?: string;
  "group_hs_1/hs_1_q3"?: string;
  "group_hs_1/hs_1_q4"?: string;
  "group_hs_1/hs_1_q5"?: string;
  "group_hs_1/hs_1_q6"?: string;
  "group_hs_1/hs_1_q7"?: string;
  "group_hs_1/hs_1_q8"?: string;
  "group_hs_1/hs_1_q9"?: string;
  "group_hs_1/hs_1_q10"?: string;

  "group_hs_2/hs_2_location"?: string;
  "group_hs_2/hs_2_picture"?: string;
  "group_hs_2/hs_2_q1"?: string;
  "group_hs_2/hs_2_q2"?: string;
  "group_hs_2/hs_2_q3"?: string;
  "group_hs_2/hs_2_q4"?: string;
  "group_hs_2/hs_2_q5"?: string;
  "group_hs_2/hs_2_q6"?: string;
  "group_hs_2/hs_2_q7"?: string;
  "group_hs_2/hs_2_q8"?: string;
  "group_hs_2/hs_2_q9"?: string;
  "group_hs_2/hs_2_q10"?: string;

  "group_hs_3/hs_3_location"?: string;
  "group_hs_3/hs_3_picture"?: string;
  "group_hs_3/hs_3_q1"?: string;
  "group_hs_3/hs_3_q2"?: string;
  "group_hs_3/hs_3_q3"?: string;
  "group_hs_3/hs_3_q4"?: string;
  "group_hs_3/hs_3_q5"?: string;
  "group_hs_3/hs_3_q6"?: string;
  "group_hs_3/hs_3_q7"?: string;
  "group_hs_3/hs_3_q8"?: string;
  "group_hs_3/hs_3_q9"?: string;
  "group_hs_3/hs_3_q10"?: string;

  "group_hs_4/hs_4_location"?: string;
  "group_hs_4/hs_4_picture"?: string;
  "group_hs_4/hs_4_q1"?: string;
  "group_hs_4/hs_4_q2"?: string;
  "group_hs_4/hs_4_q3"?: string;
  "group_hs_4/hs_4_q4"?: string;
  "group_hs_4/hs_4_q5"?: string;
  "group_hs_4/hs_4_q6"?: string;
  "group_hs_4/hs_4_q7"?: string;
  "group_hs_4/hs_4_q8"?: string;
  "group_hs_4/hs_4_q9"?: string;
  "group_hs_4/hs_4_q10"?: string;

  "group_hs_5/hs_5_location"?: string;
  "group_hs_5/hs_5_picture"?: string;
  "group_hs_5/hs_5_q1"?: string;
  "group_hs_5/hs_5_q2"?: string;
  "group_hs_5/hs_5_q3"?: string;
  "group_hs_5/hs_5_q4"?: string;
  "group_hs_5/hs_5_q5"?: string;
  "group_hs_5/hs_5_q6"?: string;
  "group_hs_5/hs_5_q7"?: string;
  "group_hs_5/hs_5_q8"?: string;
  "group_hs_5/hs_5_q9"?: string;
  "group_hs_5/hs_5_q10"?: string;

  __version__: string;
  "meta/instanceID": string;
  _xform_id_string: string;
  _uuid: string;
  "meta/rootUuid"?: string;
  _attachments: KoboAttachment[];
  _status?: string;
  _geolocation?: [number, number];
  _submission_time?: string;
  _tags?: string[];
  _notes?: unknown[];
  _validation_status?: Record<string, unknown>;
  _submitted_by?: string;
}

export interface KoboListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: KoboResult[];
}
