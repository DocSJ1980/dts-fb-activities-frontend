-- public.employee_data definition

-- Drop table

-- DROP TABLE public.employee_data;

CREATE TABLE public.employee_data (
	id serial4 NOT NULL,
	name text NULL,
	fh_name text NULL,
	cnic text NULL,
	personal_no text NULL,
	designation text NULL,
	contact_no text NULL,
	activity_type text NULL,
	username text NULL,
	new_username text NULL,
	town text NULL,
	town_id int4 NULL,
	CONSTRAINT employee_data_pkey PRIMARY KEY (id),
	CONSTRAINT fk_employee_town_id FOREIGN KEY (town_id) REFERENCES public.town_data(id) ON DELETE SET NULL
);

-- Table Triggers

create trigger trg_set_employee_town_id before
insert
    or
update
    of town on
    public.employee_data for each row
    when (((new.town is not null)
        and (new.town <> ''::text))) execute function set_employee_town_id();


-- public.dengue_simple_activities definition

-- Drop table

-- DROP TABLE public.dengue_simple_activities;

CREATE TABLE public.dengue_simple_activities (
	id serial4 NOT NULL,
	record_id varchar NOT NULL,
	district varchar NULL,
	town varchar NULL,
	uc varchar NULL,
	parent_department varchar NULL,
	sub_department varchar NULL,
	tag varchar NULL,
	name_address varchar NOT NULL,
	dengue_larvae varchar NULL,
	latitude float8 NULL,
	longitude float8 NULL,
	"location" public.geometry(point, 4326) NULL,
	before_picture_url varchar NULL,
	after_picture_url varchar NULL,
	submitted_by varchar NULL,
	activity_datetime timestamp NULL,
	picture_time_difference int4 NOT NULL,
	CONSTRAINT dengue_simple_activities_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_dengue_simple_activities_location ON public.dengue_simple_activities USING gist (location);

-- public.dts_case_response_activities definition

-- Drop table

-- DROP TABLE public.dts_case_response_activities;

CREATE TABLE public.dts_case_response_activities (
	sr serial4 NOT NULL,
	activity_id varchar NULL,
	case_response_id varchar NOT NULL,
	district varchar NULL,
	town varchar NULL,
	uc varchar NULL,
	larva_source varchar NULL,
	tag varchar NULL,
	submitted_by varchar NULL,
	submission_date timestamp NULL,
	picture_url varchar NULL,
	CONSTRAINT dts_case_response_activities_case_response_id_key UNIQUE (case_response_id),
	CONSTRAINT dts_case_response_activities_pkey PRIMARY KEY (sr)
);

-- public.dts_surv_activities definition

-- Drop table

-- DROP TABLE public.dts_surv_activities;

CREATE TABLE public.dts_surv_activities (
	id serial4 NOT NULL,
	activity_id varchar NOT NULL,
	name_of_family_head varchar NULL,
	shop_house varchar NULL,
	address varchar NULL,
	locality varchar NULL,
	district varchar NULL,
	town varchar NULL,
	uc varchar NULL,
	report_type varchar NULL,
	submitted_by varchar NULL,
	activity_datetime timestamp NULL,
	picture_url varchar NULL,
	latitude float8 NULL,
	longitude float8 NULL,
	"location" public.geometry(point, 4326) NULL,
	CONSTRAINT dts_surv_activities_activity_id_key UNIQUE (activity_id),
	CONSTRAINT dts_surv_activities_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_dts_surv_activities_location ON public.dts_surv_activities USING gist (location);

-- public.dts_containers definition

-- Drop table

-- DROP TABLE public.dts_containers;

CREATE TABLE public.dts_containers (
	id serial4 NOT NULL,
	activity_id varchar NOT NULL,
	container_tag varchar NULL,
	checked int4 NULL,
	positive int4 NULL,
	CONSTRAINT dts_containers_pkey PRIMARY KEY (id)
);

-- public.dts_patient_activities definition

-- Drop table

-- DROP TABLE public.dts_patient_activities;

CREATE TABLE public.dts_patient_activities (
	id serial4 NOT NULL,
	patient_id varchar NOT NULL,
	patient_name varchar NULL,
	district varchar NULL,
	town varchar NULL,
	uc varchar NULL,
	category_name varchar NULL,
	tag_name varchar NULL,
	patient_place varchar NULL,
	awareness varchar NULL,
	removal_breeding_spot varchar NULL,
	elimination_breeding_spot varchar NULL,
	spary varchar NULL,
	latitude float8 NULL,
	longitude float8 NULL,
	"location" public.geometry(point, 4326) NULL,
	picture_url varchar NULL,
	"comments" varchar NULL,
	submitted_by varchar NULL,
	activity_submission_datetime timestamp NULL,
	provisional_diagnosis varchar NULL,
	CONSTRAINT dts_patient_activities_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_dts_patient_activities_location ON public.dts_patient_activities USING gist (location);

-- public.dts_tpv_activities definition

-- Drop table

-- DROP TABLE public.dts_tpv_activities;

CREATE TABLE public.dts_tpv_activities (
	sr serial4 NOT NULL,
	job_id varchar NOT NULL,
	tpv_activity_date_time timestamp NULL,
	district varchar NULL,
	town varchar NULL,
	uc varchar NULL,
	tpv_type varchar NULL,
	auditor varchar NULL,
	auditor_dept varchar NULL,
	auditee varchar NULL,
	auditee_dept varchar NULL,
	tpv_distance_meters varchar NULL,
	tpv_score varchar NULL,
	picture_url varchar NULL,
	CONSTRAINT dts_tpv_activities_pkey PRIMARY KEY (sr)
);

-- public.town_data definition

-- Drop table

-- DROP TABLE public.town_data;

CREATE TABLE public.town_data (
	id serial4 NOT NULL,
	town text NOT NULL,
	ddho_id int4 NULL,
	CONSTRAINT town_data_pkey PRIMARY KEY (id)
);


-- public.uc_data definition

-- Drop table

-- DROP TABLE public.uc_data;

CREATE TABLE public.uc_data (
	id serial4 NOT NULL,
	uc_sort int4 NOT NULL,
	tracking_db_uc varchar(255) NULL,
	surveillance_db_uc varchar(255) NULL,
	population_2021 int4 NULL,
	population_2022 int4 NULL,
	uc_type varchar(255) NULL,
	houses int4 NULL,
	spots int4 NULL,
	kobo_uc varchar(255) NULL,
	town_id int4 NULL
);