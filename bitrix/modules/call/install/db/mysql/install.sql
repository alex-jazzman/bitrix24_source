CREATE TABLE IF NOT EXISTS b_call_session
(
	ID int not null auto_increment,
	TYPE int,
	SCHEME int,
	INITIATOR_ID int,
	IS_PUBLIC char(1) not null default 'N',
	PUBLIC_ID varchar(32),
	PROVIDER varchar(32),
	ENTITY_TYPE varchar(32),
	ENTITY_ID varchar(32),
	PARENT_ID int,
	PARENT_UUID varchar (36),
	STATE varchar(50),
	START_DATE datetime,
	END_DATE datetime,
	CHAT_ID int,
	LOG_URL varchar(2000),
	UUID varchar (36),
	SECRET_KEY varchar (10),
	ENDPOINT varchar (255),
	RECORD_AUDIO char(1) not null default 'N',
	AI_ANALYZE char(1) not null default 'N',
	PRIMARY KEY PK_CALL_ID(ID),
	UNIQUE KEY IX_CALL_PID(PUBLIC_ID),
	INDEX IX_CALL_ENT_TYPE(ENTITY_TYPE, ENTITY_ID, TYPE, PROVIDER, END_DATE),
	INDEX IX_CALL_CHAT_ID(CHAT_ID),
	INDEX IX_CALL_UUID(UUID),
	INDEX IX_CALL_STATE_START(STATE, START_DATE)
);

CREATE TABLE IF NOT EXISTS b_call_user
(
	CALL_ID int not null,
	USER_ID int not null,
	STATE varchar(50),
	FIRST_JOINED datetime,
	LAST_SEEN datetime,
	IS_MOBILE char(1),
	SHARED_SCREEN char(1),
	RECORDED char(1),
	PRIMARY KEY PK_CALL_USER(CALL_ID, USER_ID)
);

CREATE TABLE IF NOT EXISTS b_call_conference
(
	ID int(18) not null auto_increment,
	ALIAS_ID int(18) not null,
	PASSWORD text,
	INVITATION text,
	IS_BROADCAST char(1) not null default 'N',
	CONFERENCE_START datetime,
	CONFERENCE_END datetime,
	PRIMARY KEY PK_CALL_CONFERENCE(ID)
);

CREATE TABLE IF NOT EXISTS b_call_conference_user_role
(
	CONFERENCE_ID int not null,
	USER_ID int not null,
	ROLE varchar(64),
	PRIMARY KEY PK_CALL_CONFERENCE_USER_ROLE(CONFERENCE_ID, USER_ID)
);

CREATE TABLE IF NOT EXISTS b_call_chat_entity
(
	ID int not null auto_increment,
	CHAT_ID int not null,
	CALL_TOKEN_VERSION int not null,
	PRIMARY KEY (ID),
	KEY IX_CALL_CHAT_ID (CHAT_ID)
);
CREATE TABLE IF NOT EXISTS b_call_track
(
	ID int not null auto_increment,
	CALL_ID int not null,
	EXTERNAL_TRACK_ID int null,
	FILE_ID int null,
	DISK_FILE_ID int null,
	DATE_CREATE datetime not null default current_timestamp,
	TYPE varchar(50) null,
	DURATION int null,
	DOWNLOAD_URL text null,
	FILE_NAME varchar(100) null,
	FILE_SIZE bigint null,
	FILE_MIME_TYPE varchar(50) default null,
	DOWNLOADED char(1) not null default 'N',
	TEMP_PATH varchar(255) null,
	PRIMARY KEY (ID),
	KEY IX_CALL_TRACK_CALL (CALL_ID, TYPE),
	KEY IX_CALL_TRACK_ADDED (DATE_CREATE)
);

CREATE TABLE IF NOT EXISTS b_call_ai_task
(
	ID int not null auto_increment,
	CALL_ID int not null,
	TRACK_ID int null,
	OUTCOME_ID int null,
	TYPE varchar(50) null,
	DATE_CREATE datetime not null default current_timestamp,
	DATE_FINISHED datetime null,
	STATUS varchar(32) not null,
	HASH varchar(50) null,
	LANGUAGE_ID varchar(10) null default null,
	ERROR_CODE varchar(100) null,
	ERROR_MESSAGE text null,
	PRIMARY KEY (ID),
	KEY IX_CALL_AI_QUEUE_HASH (HASH),
	KEY IX_CALL_AI_QUEUE_CALL (CALL_ID),
	KEY IX_CALL_AI_QUEUE_TRACK (TRACK_ID),
	KEY IX_CALL_AI_QUEUE_OUTCOME (OUTCOME_ID),
	KEY IX_CALL_AI_QUEUE_ADDED (DATE_CREATE)
);

CREATE TABLE IF NOT EXISTS b_call_outcome
(
	ID int not null auto_increment,
	CALL_ID int not null,
	TRACK_ID int null,
	TYPE varchar(50) null,
	DATE_CREATE datetime not null default current_timestamp,
	LANGUAGE_ID varchar(10) null default null,
	CONTENT longtext,
	PRIMARY KEY (ID),
	KEY IX_CALL_OUTCOME_CALL (CALL_ID, TYPE),
	KEY IX_CALL_OUTCOME_TRACK (TRACK_ID),
	KEY IX_CALL_OUTCOME_ADDED (DATE_CREATE)
);

CREATE TABLE IF NOT EXISTS b_call_outcome_property
(
	ID int not null auto_increment,
	OUTCOME_ID int not null,
	CODE varchar(100) not null,
	CONTENT longtext,
	PRIMARY KEY (ID),
	KEY IX_CALL_OUTCOME_PROP_OUTCOME (OUTCOME_ID),
	KEY IX_CALL_OUTCOME_PROP_TYPE (OUTCOME_ID, CODE)
);

CREATE TABLE IF NOT EXISTS b_call_userlog
(
	ID int not null auto_increment,
	SOURCE_TYPE varchar(64) not null,
	SOURCE_CALL_ID int not null,
	USER_ID int not null,
	STATUS varchar(64) not null,
	STATUS_TIME datetime not null,
	PRIMARY KEY (ID),
	UNIQUE KEY UX_SOURCE_USER (SOURCE_TYPE, SOURCE_CALL_ID, USER_ID),
	KEY IX_USER_STATUS_TIME (USER_ID, STATUS_TIME, ID),
	KEY IX_USER_STATUS (USER_ID, STATUS)
);

CREATE TABLE IF NOT EXISTS b_call_userlog_counters
(
	ID int not null auto_increment,
	USERLOG_ID int not null,
	USER_ID int not null,
	PRIMARY KEY (ID),
	UNIQUE KEY UX_USERLOG_USER (USERLOG_ID, USER_ID),
	KEY IX_USER_ID (USER_ID)
);

CREATE TABLE IF NOT EXISTS b_call_userlog_index
(
	USERLOG_ID int not null,
	SEARCH_CONTENT mediumtext null,
	SEARCH_TITLE varchar(511) null,
	PRIMARY KEY (USERLOG_ID),
	KEY IX_CALL_USERLOG_INDEX_1 (SEARCH_TITLE(128))
);

