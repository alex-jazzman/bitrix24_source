CREATE TABLE b_documentgenerator_template (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  ACTIVE char(1) NOT NULL DEFAULT 'Y',
  NAME varchar(255) NOT NULL,
  CODE varchar(50),
  REGION varchar(50),
  SORT int NOT NULL DEFAULT 500,
  CREATE_TIME timestamp NOT NULL,
  UPDATE_TIME timestamp,
  CREATED_BY int,
  UPDATED_BY int,
  MODULE_ID varchar(50) NOT NULL,
  FILE_ID int NOT NULL,
  BODY_TYPE varchar(255) NOT NULL,
  NUMERATOR_ID int,
  WITH_STAMPS char(1) NOT NULL DEFAULT 'N',
  PRODUCTS_TABLE_VARIANT char(7) NOT NULL DEFAULT '',
  IS_DELETED char(1) NOT NULL DEFAULT 'N',
  IS_DEFAULT char(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (ID)
);

CREATE TABLE b_documentgenerator_template_provider (
  TEMPLATE_ID int NOT NULL,
  PROVIDER varchar(255) NOT NULL
);
CREATE UNIQUE INDEX ux_b_documentgenerator_template_provider_template_id_provider ON b_documentgenerator_template_provider (template_id, provider);
CREATE INDEX ix_b_documentgenerator_template_provider_provider ON b_documentgenerator_template_provider (provider);

CREATE TABLE b_documentgenerator_template_user (
  TEMPLATE_ID int NOT NULL,
  ACCESS_CODE varchar(100)
);
CREATE UNIQUE INDEX ux_b_documentgenerator_template_user_template_id_access_code ON b_documentgenerator_template_user (template_id, access_code);
CREATE INDEX ix_b_documentgenerator_template_user_access_code ON b_documentgenerator_template_user (access_code);

CREATE TABLE b_documentgenerator_field (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  TEMPLATE_ID int,
  TITLE varchar(50),
  PLACEHOLDER varchar(255) NOT NULL,
  PROVIDER varchar(255),
  PROVIDER_NAME varchar(255),
  VALUE text,
  REQUIRED char(1) NOT NULL DEFAULT 'N',
  HIDE_ROW char(1) NOT NULL DEFAULT 'N',
  TYPE varchar(255),
  CREATE_TIME timestamp NOT NULL,
  UPDATE_TIME timestamp,
  CREATED_BY int,
  UPDATED_BY int,
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_documentgenerator_field_placeholder ON b_documentgenerator_field (placeholder);
CREATE UNIQUE INDEX ux_b_documentgenerator_field_template_id_placeholder ON b_documentgenerator_field (template_id, placeholder);

CREATE TABLE b_documentgenerator_spreadsheet (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  FIELD_ID int NOT NULL,
  TITLE varchar(50),
  PLACEHOLDER varchar(255),
  PROVIDER_NAME varchar(255),
  VALUE text,
  SORT int NOT NULL DEFAULT 500,
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_documentgenerator_spreadsheet_field_id ON b_documentgenerator_spreadsheet (field_id);

CREATE TABLE b_documentgenerator_document (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  TITLE varchar(255) NOT NULL,
  NUMBER varchar(255) NOT NULL,
  TEMPLATE_ID int NOT NULL,
  PROVIDER varchar(255) NOT NULL,
  VALUE text NOT NULL,
  FILE_ID int NOT NULL,
  IMAGE_ID int,
  PDF_ID int,
  CREATE_TIME timestamp NOT NULL,
  UPDATE_TIME timestamp NOT NULL,
  CREATED_BY int,
  UPDATED_BY int,
  VALUES text,
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_documentgenerator_document_template_id_value ON b_documentgenerator_document (template_id, value);
CREATE INDEX ix_b_documentgenerator_document_value_provider ON b_documentgenerator_document (value, provider);
CREATE INDEX ix_b_documentgenerator_document_file_id ON b_documentgenerator_document (file_id);

CREATE TABLE b_documentgenerator_file (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  STORAGE_TYPE varchar(255) NOT NULL,
  STORAGE_WHERE varchar(255) NOT NULL,
  PRIMARY KEY (ID)
);

CREATE TABLE b_documentgenerator_external_link (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  DOCUMENT_ID int NOT NULL,
  HASH varchar(32) NOT NULL,
  VIEWED_TIME timestamp,
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_documentgenerator_external_link_document_id ON b_documentgenerator_external_link (document_id);
CREATE INDEX ix_b_documentgenerator_external_link_hash ON b_documentgenerator_external_link (hash);

CREATE TABLE b_documentgenerator_region (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  TITLE varchar(255) NOT NULL,
  LANGUAGE_ID char(2),
  FORMAT_DATE varchar(255),
  FORMAT_DATETIME varchar(255),
  FORMAT_NAME varchar(255),
  PRIMARY KEY (ID)
);

CREATE TABLE b_documentgenerator_region_phrase (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  REGION_ID int NOT NULL,
  CODE varchar(255) NOT NULL,
  PHRASE text,
  PRIMARY KEY (ID)
);

CREATE TABLE b_documentgenerator_role (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  NAME varchar(255) NOT NULL,
  CODE varchar(255),
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_documentgenerator_role_code ON b_documentgenerator_role (code);

CREATE TABLE b_documentgenerator_role_permission (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  ROLE_ID int NOT NULL,
  ENTITY varchar(50) NOT NULL,
  ACTION varchar(50) NOT NULL,
  PERMISSION char(1),
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_documentgenerator_role_permission_role_id ON b_documentgenerator_role_permission (role_id);

CREATE TABLE b_documentgenerator_role_access (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  ROLE_ID int NOT NULL,
  ACCESS_CODE varchar(100) NOT NULL,
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_documentgenerator_role_access_role_id ON b_documentgenerator_role_access (role_id);

CREATE TABLE b_documentgenerator_document_binding (
  ID int8 GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  DOCUMENT_ID int8 NOT NULL,
  ENTITY_NAME varchar(255) NOT NULL,
  ENTITY_ID int NOT NULL,
  PRIMARY KEY (ID)
);

CREATE TABLE b_documentgenerator_actualize_queue (
  DOCUMENT_ID int8 NOT NULL,
  ADDED_TIME timestamp NOT NULL,
  USER_ID int8,
  PRIMARY KEY (DOCUMENT_ID)
);