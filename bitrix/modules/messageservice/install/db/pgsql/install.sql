
CREATE TABLE b_messageservice_message (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  TYPE varchar(30) NOT NULL,
  SENDER_ID varchar(50) NOT NULL,
  AUTHOR_ID int NOT NULL DEFAULT 0,
  MESSAGE_FROM varchar(260),
  MESSAGE_TO varchar(50) NOT NULL,
  MESSAGE_HEADERS text,
  MESSAGE_BODY text NOT NULL,
  DATE_INSERT timestamp,
  DATE_EXEC timestamp,
  NEXT_EXEC timestamp,
  SUCCESS_EXEC char(1) NOT NULL DEFAULT 'N',
  EXEC_ERROR varchar(255),
  STATUS_ID int NOT NULL DEFAULT 0,
  EXTERNAL_ID varchar(128),
  EXTERNAL_STATUS varchar(128),
  CLUSTER_GROUP int,
  PRIMARY KEY (ID)
);
CREATE INDEX ix_b_messageservice_message_date_exec ON b_messageservice_message (date_exec);
CREATE INDEX ix_b_messageservice_message_success_exec_cluster_group ON b_messageservice_message (success_exec, cluster_group);
CREATE INDEX ix_b_messageservice_message_sender_id_external_id ON b_messageservice_message (sender_id, external_id);
CREATE INDEX ix_b_messageservice_message_success_exec_next_exec ON b_messageservice_message (success_exec, next_exec);
CREATE INDEX ix_b_messageservice_message_date_insert ON b_messageservice_message (date_insert);

CREATE TABLE b_messageservice_rest_app (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  APP_ID varchar(128) NOT NULL,
  CODE varchar(128) NOT NULL,
  TYPE varchar(30) NOT NULL,
  HANDLER varchar(1000) NOT NULL,
  DATE_ADD timestamp,
  AUTHOR_ID int NOT NULL DEFAULT 0,
  PRIMARY KEY (ID)
);
CREATE UNIQUE INDEX ux_b_messageservice_rest_app_app_id_code ON b_messageservice_rest_app (app_id, code);

CREATE TABLE b_messageservice_rest_app_lang (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  APP_ID int NOT NULL,
  LANGUAGE_ID char(2) NOT NULL,
  NAME varchar(500),
  APP_NAME varchar(500),
  DESCRIPTION varchar(1000),
  PRIMARY KEY (ID)
);

CREATE TABLE b_messageservice_incoming_message (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  REQUEST_BODY text,
  DATE_EXEC timestamp,
  SENDER_ID varchar(50) NOT NULL,
  EXTERNAL_ID varchar(128),
  PRIMARY KEY (ID)
);
CREATE UNIQUE INDEX ux_b_messageservice_incoming_message_sender_id_external_id ON b_messageservice_incoming_message (sender_id, external_id);

CREATE TABLE b_messageservice_restriction (
  ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  CODE varchar(128) NOT NULL,
  COUNTER int,
  DATE_CREATE date NOT NULL,
  ADDITIONAL_PARAMS text NOT NULL,
  PRIMARY KEY (ID)
);
CREATE UNIQUE INDEX ux_b_messageservice_restriction_code_date_create ON b_messageservice_restriction (code, date_create);

CREATE TABLE b_messageservice_channel (
	ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
	SENDER_ID varchar(50) NOT NULL,
	EXTERNAL_ID varchar(128) NOT NULL,
	TYPE varchar(30) NOT NULL,
	NAME varchar(500) NOT NULL,
	DATE_CREATE timestamp NOT NULL DEFAULT current_timestamp,
	ADDITIONAL_PARAMS text,
	PRIMARY KEY (ID)
);
CREATE UNIQUE INDEX ux_b_messageservice_channel_sender_external_type ON b_messageservice_channel (sender_id, external_id, type);

CREATE TABLE b_messageservice_template (
	ID int GENERATED BY DEFAULT AS IDENTITY NOT NULL,
	NAME varchar(500) NOT NULL,
	TITLE varchar(500) NOT NULL,
	DATE_CREATE timestamp NOT NULL DEFAULT current_timestamp,
	ACTIVE char(1) NOT NULL DEFAULT 'Y',
	PRIMARY KEY (ID)
)
