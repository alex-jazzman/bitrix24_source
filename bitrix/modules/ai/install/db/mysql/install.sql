create table if not exists b_ai_queue
(
	ID int(18) not null auto_increment,
	HASH char(32) not null,
	ENGINE_CLASS varchar(100) not null,
	ENGINE_CODE varchar(100) default null,
	ENGINE_CUSTOM_SETTINGS text DEFAULT null,
	PAYLOAD_CLASS varchar(100) not null,
	PAYLOAD text not null,
	CONTEXT text default null,
	PARAMETERS text default null,
	HISTORY_WRITE char(1) default 'N',
	HISTORY_GROUP_ID int(18) null,
	CACHE_HASH char(32) default null,
	DATE_CREATE timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IX_B_DATE_CREATE (DATE_CREATE),
	UNIQUE IX_B_HASH (HASH)
);

create table if not exists b_ai_history
(
	ID int(18) not null auto_increment,
	CONTEXT_MODULE varchar(100) not null,
	CONTEXT_ID varchar(100) not null,
	ENGINE_CLASS varchar(100) not null,
	ENGINE_CODE varchar(100) default null,
	PAYLOAD_CLASS varchar(100) not null,
	PAYLOAD text not null,
	PARAMETERS text default null,
	GROUP_ID int(18) not null default -1,
	REQUEST_TEXT text default null,
	RESULT_TEXT text default null,
	CONTEXT mediumtext default null,
	CACHED boolean default false,
	DATE_CREATE timestamp not null default current_timestamp,
	CREATED_BY_ID int(18) not null,
	PRIMARY KEY (ID),
	INDEX IX_B_CREATED_BY (CREATED_BY_ID),
	INDEX IX_B_CONTEXT_ID (CONTEXT_ID),
	INDEX IX_B_CONTEXT (CONTEXT_MODULE, CONTEXT_ID, CREATED_BY_ID, GROUP_ID)
);

create table if not exists b_ai_engine
(
	ID int(18) not null auto_increment,
	APP_CODE varchar(128) default null,
	NAME varchar(100) not null,
	CODE varchar(100) not null,
	CATEGORY varchar(20) not null,
	COMPLETIONS_URL varchar(250) not null,
	SETTINGS text default null,
	DATE_CREATE timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IX_B_APP_CODE (APP_CODE, CODE),
	INDEX IX_B_CODE (CODE)
);

create table if not exists b_ai_prompt
(
	ID int(18) not null auto_increment,
	APP_CODE varchar(128) default null,
	PARENT_ID int(18) default null,
	CATEGORY text default null,
	CACHE_CATEGORY text default null,
	SECTION varchar(20) default null,
	SORT int(18) default null,
	CODE varchar(100) not null,
	TYPE varchar(32) default null,
	ICON varchar(50) default null,
	HASH char(32) not null,
	PROMPT text default null,
	TRANSLATE text not null,
	TEXT_TRANSLATES text default null,
	SETTINGS text default null,
	WORK_WITH_RESULT char(1) not null default 'N',
	IS_NEW TINYINT(1) UNSIGNED default 0,
	IS_SYSTEM char(1) not null default 'N',
	DATE_MODIFY timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IX_B_APP_CODE (APP_CODE),
	INDEX IX_B_CODE (CODE),
	INDEX IX_B_PARENT_ID (PARENT_ID),
	INDEX IX_B_IS_NEW (IS_NEW),
	INDEX IX_B_IS_SYSTEM (IS_SYSTEM)
);

create table if not exists b_ai_role
(
	ID int not null auto_increment,
	CODE varchar(100) not null,
	INDUSTRY_CODE varchar(100) default null,
	NAME_TRANSLATES text null,
	DESCRIPTION_TRANSLATES text null,
	HASH char(32) not null,
	INSTRUCTION text not null,
	AVATAR text not null,
	IS_NEW TINYINT(1) UNSIGNED default 0,
	IS_RECOMMENDED TINYINT(1) UNSIGNED default 0,
	SORT int default null,
	DATE_MODIFY timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IX_B_CODE (CODE),
	INDEX IX_B_SORT (SORT),
	INDEX IX_B_INDUSTRY_CODE (INDUSTRY_CODE)
);

create table if not exists b_ai_role_prompt
(
	ROLE_ID int not null,
	PROMPT_ID int not null,
	DATE_CREATE timestamp not null default current_timestamp,
	PRIMARY KEY (ROLE_ID, PROMPT_ID)
);

create table if not exists b_ai_role_industry
(
	ID int not null auto_increment,
	CODE varchar(100) not null,
	HASH char(32) not null,
	NAME_TRANSLATES text not null,
	IS_NEW TINYINT(1) UNSIGNED default 0,
	SORT int default null,
	DATE_MODIFY timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	UNIQUE INDEX IX_B_CODE (CODE),
	INDEX IX_B_SORT (SORT)
);

create table if not exists b_ai_recent_role
(
	ID int not null auto_increment,
	ROLE_CODE varchar(100) not null,
	USER_ID int not null,
	DATE_CREATE timestamp not null default current_timestamp,
	DATE_TOUCH timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	UNIQUE IX_B_ROLE_USER (USER_ID, ROLE_CODE),
	INDEX IX_B_DATE_TOUCH (DATE_TOUCH)
);

create table if not exists b_ai_role_favorite
(
	ID int not null auto_increment,
	ROLE_CODE varchar(100) not null,
	USER_ID int not null,
	DATE_CREATE timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	UNIQUE IX_B_FAVORITE_ROLE_USER (USER_ID, ROLE_CODE)
);

create table if not exists b_ai_plan
(
	ID int(18) not null auto_increment,
	CODE varchar(100) not null,
	HASH char(32) not null,
	MAX_USAGE int(18) not null,
	DATE_MODIFY timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IX_B_CODE (CODE)
);

create table if not exists b_ai_usage
(
	ID int(18) not null auto_increment,
	USER_ID int(18) not null,
	USAGE_PERIOD varchar(50) not null,
	USAGE_COUNT int not null default 1,
	DATE_MODIFY timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IX_B_USER_PERIOD (USER_ID, USAGE_PERIOD),
	INDEX IX_B_USER_ID (USER_ID)
);

create table if not exists b_ai_section
(
	ID int(18) not null auto_increment,
	CODE varchar(100) not null,
	HASH char(32) not null,
	TRANSLATE text not null,
	DATE_MODIFY timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IX_B_CODE (CODE)
);

create table if not exists b_ai_baas_package
(
	ID int(18) not null auto_increment,
	DATE_START date not null,
	DATE_EXPIRED date not null,
	PRIMARY KEY (ID),
	INDEX IX_B_DATE_EXPIRED (DATE_EXPIRED)
);

create table if not exists b_ai_counter
(
	ID int(18) not null auto_increment,
	NAME VARCHAR(100) not null,
	VALUE varchar(200),
	PRIMARY KEY (ID),
	UNIQUE ix_option_name (NAME)
);
