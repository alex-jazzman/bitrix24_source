CREATE TABLE b_tasks (
	ID int(11) NOT NULL AUTO_INCREMENT,
	TITLE varchar(255) DEFAULT NULL,
	DESCRIPTION text,
	DESCRIPTION_IN_BBCODE char(1) NOT NULL DEFAULT 'N',
	PRIORITY tinyint UNSIGNED NOT NULL DEFAULT 1,
	STATUS tinyint UNSIGNED NOT NULL DEFAULT 0,
	RESPONSIBLE_ID int(11) DEFAULT NULL,
	DATE_START datetime DEFAULT NULL,
	DURATION_PLAN int(11) DEFAULT NULL,
	DURATION_FACT int(11) DEFAULT NULL,
	DURATION_TYPE varchar(5) NOT NULL DEFAULT 'days',
	TIME_ESTIMATE int(11) NOT NULL DEFAULT 0,
	REPLICATE char(1) NOT NULL DEFAULT 'N',
	DEADLINE datetime DEFAULT NULL,
	START_DATE_PLAN datetime DEFAULT NULL,
	END_DATE_PLAN datetime DEFAULT NULL,
	CREATED_BY int(11) DEFAULT NULL,
	CREATED_DATE datetime DEFAULT NULL,
	CHANGED_BY int(11) DEFAULT NULL,
	CHANGED_DATE datetime DEFAULT NULL,
	STATUS_CHANGED_BY int(11) DEFAULT NULL,
	STATUS_CHANGED_DATE datetime DEFAULT NULL,
	CLOSED_BY int(11) DEFAULT NULL,
	CLOSED_DATE datetime DEFAULT NULL,
	ACTIVITY_DATE datetime DEFAULT NULL,
	GUID varchar(50) DEFAULT NULL,
	XML_ID varchar(50) DEFAULT NULL,
	EXCHANGE_ID varchar(196) DEFAULT NULL,
	EXCHANGE_MODIFIED varchar(196) DEFAULT NULL,
	OUTLOOK_VERSION int(11) DEFAULT NULL,
	MARK char(1) DEFAULT NULL,
	ALLOW_CHANGE_DEADLINE char(1) NOT NULL DEFAULT 'N',
	ALLOW_TIME_TRACKING char(1) NOT NULL DEFAULT 'N',
	MATCH_WORK_TIME char(1) NOT NULL DEFAULT 'N',
	TASK_CONTROL char(1) NOT NULL DEFAULT 'N',
	ADD_IN_REPORT char(1) NOT NULL DEFAULT 'N',
	GROUP_ID int(11) DEFAULT '0',
	PARENT_ID int(11) DEFAULT NULL,
	FORUM_TOPIC_ID bigint(20) DEFAULT NULL,
	MULTITASK char(1) NOT NULL DEFAULT 'N',
	IS_REGULAR char(1) NOT NULL DEFAULT 'N',
	SITE_ID char(2) NOT NULL,
	DECLINE_REASON text,
	FORKED_BY_TEMPLATE_ID int(11) DEFAULT NULL,
	ZOMBIE char(1) NOT NULL DEFAULT 'N',
	DEADLINE_COUNTED int(11) NOT NULL DEFAULT 0,
	STAGE_ID int(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (ID),
	KEY FORUM_TOPIC_ID (FORUM_TOPIC_ID),
	KEY PARENT_ID (PARENT_ID),
	KEY CREATED_BY (CREATED_BY),
	KEY RESPONSIBLE_ID (RESPONSIBLE_ID),
	KEY CHANGED_BY (CHANGED_BY),
	UNIQUE KEY GUID (GUID),
	INDEX ix_b_tasks_activity_created_date (ACTIVITY_DATE, CREATED_DATE),
	INDEX ix_b_tasks_created_activity_date (CREATED_DATE, ACTIVITY_DATE),
	INDEX b_tasks_deadline_ibuk (DEADLINE, DEADLINE_COUNTED),
	INDEX ix_tasks_deadline_g (GROUP_ID),
	INDEX ix_b_tasks_status_is_regular(STATUS, IS_REGULAR),
	INDEX ix_tasks_standard_filter (DEADLINE, STATUS, GROUP_ID)
);

CREATE TABLE b_tasks_files_temporary (
	USER_ID int(11) NOT NULL,
	FILE_ID int(11) NOT NULL,
	UNIX_TS int(11) NOT NULL,
	PRIMARY KEY (FILE_ID),
	KEY UNIX_TS (UNIX_TS),
	KEY USER_ID (USER_ID)
);

CREATE TABLE b_tasks_dependence (
	TASK_ID int(11) NOT NULL DEFAULT '0',
	DEPENDS_ON_ID int(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (TASK_ID,DEPENDS_ON_ID),
	KEY DEPENDS_ON_ID (DEPENDS_ON_ID)
);

CREATE TABLE b_tasks_proj_dep (
	TASK_ID int(11) NOT NULL DEFAULT '0',
	DEPENDS_ON_ID int(11) NOT NULL DEFAULT '0',
	TYPE tinyint NOT NULL DEFAULT '2',
	DIRECT tinyint DEFAULT '0',
	MPCITY int(11) DEFAULT '1',
  CREATOR_ID int(11),
	PRIMARY KEY (TASK_ID,DEPENDS_ON_ID),
	KEY IX_TASKS_PROJ_DEP_DOI (DEPENDS_ON_ID),
	KEY IX_TASKS_PROJ_DEP_DIR (DIRECT)
);

CREATE TABLE b_tasks_file (
	TASK_ID int(11) NOT NULL DEFAULT '0',
	FILE_ID int(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (TASK_ID,FILE_ID),
	KEY FILE_ID (FILE_ID)
);

CREATE TABLE b_tasks_member (
	TASK_ID int(11) NOT NULL DEFAULT '0',
	USER_ID int(11) NOT NULL DEFAULT '0',
	TYPE char(1) NOT NULL DEFAULT '',
	PRIMARY KEY (TASK_ID,USER_ID,TYPE),
	KEY USER_ID_TYPE (USER_ID, TYPE)
);

CREATE TABLE b_tasks_tag (
	TASK_ID int(11) NOT NULL,
	USER_ID int(11) NOT NULL,
	NAME varchar(255) NOT NULL,
	PRIMARY KEY (TASK_ID,USER_ID,NAME),
	KEY NAME (NAME),
	INDEX ix_tasks_tag_user_id_name (USER_ID, NAME)
);

CREATE TABLE b_tasks_template (
	ID int(11) NOT NULL AUTO_INCREMENT,
	TASK_ID int(11) DEFAULT NULL,
	TITLE varchar(255) DEFAULT NULL,
	DESCRIPTION text,
	DESCRIPTION_IN_BBCODE char(1) NOT NULL DEFAULT 'N',
	PRIORITY char(1) NOT NULL DEFAULT '1',
	STATUS char(1) NOT NULL DEFAULT '1',
	RESPONSIBLE_ID int(11) DEFAULT NULL,
	DEADLINE_AFTER int(11) DEFAULT NULL,
  START_DATE_PLAN_AFTER int(11) DEFAULT NULL,
  END_DATE_PLAN_AFTER int(11) DEFAULT NULL,
  TIME_ESTIMATE int(11) NOT NULL DEFAULT 0,
	REPLICATE char(1) NOT NULL DEFAULT 'N',
	REPLICATE_PARAMS text,
	CREATED_BY int(11) DEFAULT NULL,
	XML_ID varchar(50) DEFAULT NULL,
	ALLOW_CHANGE_DEADLINE char(1) NOT NULL DEFAULT 'N',
	ALLOW_TIME_TRACKING char(1) NOT NULL DEFAULT 'N',
	TASK_CONTROL char(1) NOT NULL DEFAULT 'N',
	MATCH_WORK_TIME char(1) NOT NULL DEFAULT 'N',
	ADD_IN_REPORT char(1) NOT NULL DEFAULT 'N',
	GROUP_ID int(11) DEFAULT NULL,
	PARENT_ID int(11) DEFAULT NULL,
	MULTITASK char(1) NOT NULL DEFAULT 'N',
	SITE_ID char(2) NOT NULL,
	ACCOMPLICES text,
	AUDITORS text,
	RESPONSIBLES text,
	FILES text,
	TAGS text,
	DEPENDS_ON text,
	TPARAM_TYPE int,
	TPARAM_REPLICATION_COUNT int DEFAULT '0',
	STAGE_ID int(11) NOT NULL DEFAULT '0',
	ZOMBIE char(1) NOT NULL DEFAULT 'N',
	PRIMARY KEY (ID),
	KEY TASK_ID (TASK_ID),
	KEY PARENT_ID (PARENT_ID),
	KEY CREATED_BY (CREATED_BY),
	KEY RESPONSIBLE_ID (RESPONSIBLE_ID)
);

CREATE TABLE b_tasks_template_dep (
	TEMPLATE_ID int(11) NOT NULL,
	PARENT_TEMPLATE_ID int(11) NOT NULL,
	DIRECT tinyint default '0',

	PRIMARY KEY (TEMPLATE_ID,PARENT_TEMPLATE_ID),
	KEY IX_TASKS_TASK_DEP_DIR (DIRECT)
);

CREATE TABLE b_tasks_viewed (
	TASK_ID int(11) NOT NULL,
	USER_ID int(11) NOT NULL,
	VIEWED_DATE timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	IS_REAL_VIEW char(1) NOT NULL DEFAULT 'Y',
	PRIMARY KEY (TASK_ID, USER_ID),
	KEY USER_ID (USER_ID),
	UNIQUE INDEX b_tasks_viewed_task_user_viewed_idx(TASK_ID, USER_ID, IS_REAL_VIEW)
);

CREATE TABLE b_tasks_log (
	ID int(11) NOT NULL AUTO_INCREMENT,
	CREATED_DATE datetime NOT NULL,
	USER_ID int(11) NOT NULL,
	TASK_ID int(11) NOT NULL,
	FIELD varchar(50) NOT NULL,
	FROM_VALUE text,
	TO_VALUE text,
	PRIMARY KEY pk_b_tasks_log(ID),
	INDEX b_tasks_log1 (TASK_ID, CREATED_DATE),
	INDEX ix_tasks_log_user_id_field (USER_ID, FIELD)
);

CREATE TABLE b_tasks_elapsed_time (
  ID int(11) NOT NULL AUTO_INCREMENT,
  CREATED_DATE timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  DATE_START datetime DEFAULT NULL,
  DATE_STOP datetime DEFAULT NULL,
  USER_ID int(11) NOT NULL,
  TASK_ID int(11) NOT NULL,
  MINUTES int(11) NOT NULL,
  SECONDS int(11) NOT NULL DEFAULT '0',
  SOURCE int(11) NOT NULL DEFAULT '1',
  COMMENT_TEXT text,
  PRIMARY KEY (ID),
  KEY TASK_ID (TASK_ID)
);

CREATE INDEX USER_ID ON b_tasks_elapsed_time(USER_ID);

CREATE TABLE b_tasks_reminder (
  ID int(11) NOT NULL AUTO_INCREMENT,
  USER_ID int(11) NOT NULL,
  TASK_ID int(11) NOT NULL,
  REMIND_DATE datetime NOT NULL,
  TYPE char(1) NOT NULL,
  TRANSPORT char(1) NOT NULL,
  RECEPIENT_TYPE char(1) default 'S',
  KEY USER_ID (USER_ID,TASK_ID),
  PRIMARY KEY pk_b_tasks_reminder(ID)
);

CREATE INDEX IX_TASKS_REMINDER_RD ON b_tasks_reminder(REMIND_DATE);

CREATE TABLE b_tasks_filters (
	ID int(11) NOT NULL AUTO_INCREMENT,
	USER_ID int(11) NOT NULL,
	NAME varchar(255) DEFAULT NULL,
	PARENT int(11) NOT NULL,
	SERIALIZED_FILTER text,
	PRIMARY KEY (ID),
	KEY USER_ID (USER_ID)
);

CREATE TABLE b_tasks_checklist_items (
	ID int(11) NOT NULL AUTO_INCREMENT,
	TASK_ID int(11) NOT NULL,
	CREATED_BY int(11) NOT NULL,
	TOGGLED_BY int(11) DEFAULT NULL,
	TOGGLED_DATE datetime DEFAULT NULL,
	TITLE TEXT DEFAULT NULL,
	IS_COMPLETE char(1) NOT NULL DEFAULT 'N',
	IS_IMPORTANT char(1) NOT NULL DEFAULT 'N',
	SORT_INDEX int(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (ID),
	KEY USER_ID (TASK_ID)
);

CREATE TABLE b_tasks_checklist_items_tree (
    PARENT_ID INT NOT NULL,
    CHILD_ID INT NOT NULL,
    LEVEL SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (PARENT_ID, CHILD_ID)
);
CREATE INDEX ix_tasks_checklist_items_tree_child_id_level  ON b_tasks_checklist_items_tree(CHILD_ID, LEVEL);

CREATE TABLE b_tasks_checklist_items_member (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ITEM_ID INT(11) NOT NULL,
    USER_ID INT(11) NOT NULL,
    TYPE CHAR(1) NOT NULL,
    UNIQUE (ITEM_ID, USER_ID, TYPE),
    KEY USER_ID_TYPE (USER_ID, TYPE)
);

create table b_tasks_template_chl_item (
	ID int NOT NULL AUTO_INCREMENT,
	TEMPLATE_ID int(11) NOT NULL,
	SORT int(11) DEFAULT '0',
	TITLE text NOT NULL,
	CHECKED tinyint default '0',
	IS_IMPORTANT char(1) NOT NULL DEFAULT 'N',
	PRIMARY KEY (ID)
);

CREATE TABLE b_tasks_template_chl_item_tree (
    PARENT_ID INT NOT NULL,
    CHILD_ID INT NOT NULL,
    LEVEL SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (PARENT_ID, CHILD_ID)
);
CREATE INDEX ix_tasks_template_chl_item_tree_child_id_level  ON b_tasks_template_chl_item_tree(CHILD_ID, LEVEL);

CREATE TABLE b_tasks_template_chl_item_member (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ITEM_ID INT(11) NOT NULL,
    USER_ID INT(11) NOT NULL,
    TYPE CHAR(1) NOT NULL,
    UNIQUE (ITEM_ID, USER_ID, TYPE),
    KEY USER_ID_TYPE (USER_ID, TYPE)
);

CREATE TABLE b_tasks_timer (
	TASK_ID int(11) NOT NULL,
	USER_ID int(11) NOT NULL,
	TIMER_STARTED_AT int(11) NOT NULL DEFAULT '0',
	TIMER_ACCUMULATOR int(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (USER_ID),
	KEY TASK_ID (TASK_ID)
);

CREATE TABLE b_tasks_columns (
	ID int(11) NOT NULL AUTO_INCREMENT,
	USER_ID int(11) NOT NULL,
	CONTEXT_ID int(11) NOT NULL,
	NAME varchar(255) DEFAULT NULL,
	SERIALIZED_COLUMNS text,
	PRIMARY KEY (ID),
	KEY USER_ID (USER_ID)
);

CREATE TABLE b_tasks_favorite (
	TASK_ID int NOT NULL,
	USER_ID int NOT NULL,
	PRIMARY KEY (TASK_ID, USER_ID)
);

CREATE TABLE b_tasks_msg_throttle (
	ID int(11) NOT NULL AUTO_INCREMENT,
	TASK_ID int(11) NOT NULL,
	AUTHOR_ID int(11),
	INFORM_AUTHOR char(1) DEFAULT '0',
	STATE_ORIG text,
	STATE_LAST text,

	PRIMARY KEY (ID)
);

CREATE INDEX ix_tasks_msg_throttle_ti ON b_tasks_msg_throttle(TASK_ID);

CREATE TABLE b_tasks_sorting (
	ID int(11) NOT NULL AUTO_INCREMENT,
	TASK_ID int(11) NOT NULL,
	SORT decimal(18,7) NOT NULL,
	USER_ID int(11) NOT NULL DEFAULT 0,
	GROUP_ID int(11) NOT NULL DEFAULT 0,
	PREV_TASK_ID int(11) NOT NULL DEFAULT 0,
	NEXT_TASK_ID int(11) NOT NULL DEFAULT 0,
	PRIMARY KEY (ID)
);

CREATE INDEX ix_tasks_sorting_tid_uid ON b_tasks_sorting(TASK_ID, USER_ID);
CREATE INDEX ix_tasks_sorting_tid_gid ON b_tasks_sorting(TASK_ID, GROUP_ID);
CREATE INDEX ix_tasks_sorting_sort ON b_tasks_sorting(SORT);
ALTER TABLE b_tasks_sorting ADD INDEX ix_tasks_sorting_perf1 (USER_ID, SORT, TASK_ID);
ALTER TABLE b_tasks_sorting ADD INDEX ix_tasks_sorting_perf2 (GROUP_ID, SORT, TASK_ID);

CREATE TABLE b_tasks_syslog (
	ID int(11) NOT NULL AUTO_INCREMENT,
	TYPE tinyint,
	CREATED_DATE datetime,
	MESSAGE varchar(255),
	ENTITY_ID int(11),
	ENTITY_TYPE tinyint,
  PARAM_A int,
	ERROR text,
	PRIMARY KEY (ID)
);

CREATE INDEX ix_tasks_syslog_etei ON b_tasks_syslog(ENTITY_TYPE, ENTITY_ID);
CREATE INDEX ix_tasks_syslog_d ON b_tasks_syslog(CREATED_DATE);

create table b_tasks_task_template_access
(
  ID int not null primary key auto_increment,
  GROUP_CODE varchar(50) NOT NULL,
  ENTITY_ID int not null,
  TASK_ID int not null
);

create index ix_tasks_task_template_a_get on b_tasks_task_template_access (GROUP_CODE, ENTITY_ID, TASK_ID);

create table b_tasks_task_parameter (
  ID int not null AUTO_INCREMENT PRIMARY KEY,
  TASK_ID int not null,
  CODE tinyint not null,
  VALUE varchar(10) default null
);

CREATE UNIQUE INDEX ix_tasks_task_parameter_ticv ON b_tasks_task_parameter(TASK_ID, CODE, VALUE);

CREATE TABLE b_tasks_task_dep (
  TASK_ID int(11) NOT NULL,
  PARENT_TASK_ID int(11) NOT NULL,
  DIRECT tinyint default '0',

  UNIQUE index (TASK_ID, PARENT_TASK_ID, DIRECT),
  UNIQUE index (PARENT_TASK_ID, TASK_ID, DIRECT)
);

CREATE TABLE b_tasks_stages (
  ID int(18) NOT NULL AUTO_INCREMENT,
  TITLE varchar(255) DEFAULT NULL,
  SORT int(11) DEFAULT NULL,
  COLOR char(6) DEFAULT NULL,
  SYSTEM_TYPE varchar(20) DEFAULT NULL,
  ENTITY_ID int(18) DEFAULT 0,
  ENTITY_TYPE char(1) DEFAULT 'G',
  ADDITIONAL_FILTER text default null,
  TO_UPDATE text default null,
  TO_UPDATE_ACCESS varchar(255) default null,
  PRIMARY KEY (`ID`),
  INDEX ix_tasks_stages_entity_id_entity_type (ENTITY_ID, ENTITY_TYPE)
);

CREATE TABLE b_tasks_task_stage (
  ID int(18) NOT NULL AUTO_INCREMENT,
  TASK_ID int(11) NOT NULL,
  STAGE_ID int(18) NOT NULL,
  PRIMARY KEY (ID),
  UNIQUE KEY STAGE_TASK (STAGE_ID, TASK_ID),
  KEY TASK_ID (TASK_ID)
);

CREATE TABLE b_tasks_projects (
  ID int(11) NOT NULL AUTO_INCREMENT,
  ORDER_NEW_TASK varchar(10) NOT NULL default 'desc',
  PRIMARY KEY (`ID`)
);

ALTER TABLE b_tasks ADD INDEX IDX_TASKS_STAGE_ID (STAGE_ID);
ALTER TABLE b_tasks_template ADD INDEX IDX_TASKS_STAGE_ID (STAGE_ID);

CREATE TABLE IF NOT EXISTS b_tasks_scorer (
	`ID` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`USER_ID` INT(11) NOT NULL DEFAULT '0',
	`TASK_ID` INT(11) NOT NULL DEFAULT '0',
	`GROUP_ID` INT(11) NOT NULL DEFAULT '0',
	`TYPE` VARCHAR(64) NOT NULL DEFAULT '0',
	`VALUE` MEDIUMINT(8) UNSIGNED NOT NULL DEFAULT '0',
	PRIMARY KEY (`ID`),
	INDEX `ix_tasks_scorer_group` (`GROUP_ID`),
	INDEX `ix_tasks_scorer_utype` (`USER_ID`, `TYPE`, `TASK_ID`),
	INDEX `ix_tasks_scorer_utype2` (`USER_ID`, `TASK_ID`, `TYPE`),
	INDEX `ix_tasks_scorer_type` (`TASK_ID`, `TYPE`)
);

CREATE TABLE IF NOT EXISTS b_tasks_scorer_queue (
	`ID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`USER_ID` INT(10) UNSIGNED NOT NULL,
	`TYPE` VARCHAR(32) NOT NULL DEFAULT '',
	`TASK_ID` INT(10) UNSIGNED NOT NULL,
	`DATETIME` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`ID`),
	INDEX `ix_tasks_scorer_queue` (`USER_ID`, `TYPE`)
);

CREATE TABLE IF NOT EXISTS b_tasks_effective(
  `ID` INT(11) NOT NULL AUTO_INCREMENT,
  `DATETIME` DATETIME NOT NULL,
  `DATETIME_REPAIR` DATETIME NULL,
  `USER_ID` INT(11) NOT NULL,
  `GROUP_ID` INT(11) NOT NULL DEFAULT '0',
  `EFFECTIVE` TINYINT(4) NOT NULL DEFAULT '0',
  `TASK_ID` INT(11) NOT NULL,
  `TASK_TITLE` VARCHAR(255) NULL,
  `TASK_DEADLINE` DATETIME NULL,
  `USER_TYPE` CHAR(1) NOT NULL,
  `IS_VIOLATION` CHAR(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`ID`),
  INDEX b_tasks_effective_USER_ID (USER_ID),
  INDEX ix_tasks_effective_user_id_datetime (USER_ID, DATETIME),
  INDEX ix_tasks_effective_task_id_is_violation_datetime (TASK_ID, IS_VIOLATION, DATETIME),
  INDEX ix_tasks_effective_user_id_is_violation_datetime (USER_ID, IS_VIOLATION, DATETIME),
  INDEX ix_tasks_effective_group_id_is_violation_datetime (GROUP_ID, IS_VIOLATION, DATETIME)
);

CREATE TABLE b_tasks_search_index (
    ID bigint(20) auto_increment primary key,
    TASK_ID int not null,
    MESSAGE_ID bigint(20) default 0 not null,
    SEARCH_INDEX mediumtext null,
    unique (TASK_ID, MESSAGE_ID),
    fulltext index IXF_TASKS_SEARCH_INDEX_SEARCH_INDEX (SEARCH_INDEX)
);

CREATE TABLE IF NOT EXISTS b_tasks_sprint (
	ID int(18) NOT NULL AUTO_INCREMENT,
	GROUP_ID int(18) NOT NULL,
	CREATED_BY_ID int(18) NOT NULL,
	MODIFIED_BY_ID int(18) NOT NULL,
	START_TIME timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	FINISH_TIME timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
	PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_role (
    ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    NAME VARCHAR(250) NOT NULL,
    PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_role_relation (
    ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    ROLE_ID INT(10) UNSIGNED NOT NULL,
    RELATION VARCHAR(8) NOT NULL DEFAULT '',
    PRIMARY KEY (ID),
    INDEX ROLE_ID (ROLE_ID),
    INDEX RELATION (RELATION)
);

CREATE TABLE IF NOT EXISTS b_tasks_permission (
    ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    ROLE_ID INT(10) UNSIGNED NOT NULL,
    PERMISSION_ID VARCHAR(32) NOT NULL DEFAULT '0',
    VALUE TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
    PRIMARY KEY (ID),
    INDEX ROLE_ID (ROLE_ID),
    INDEX PERMISSION_ID (PERMISSION_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_template_permission (
	ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	TEMPLATE_ID INT(10) UNSIGNED NULL DEFAULT NULL,
	ACCESS_CODE VARCHAR(8) NULL DEFAULT NULL,
	PERMISSION_ID VARCHAR(32) NULL DEFAULT NULL,
	VALUE TINYINT(3) UNSIGNED NULL DEFAULT '0',
	PRIMARY KEY (ID),
	INDEX TEMPLATE_ID (TEMPLATE_ID),
	INDEX ACCESS_CODE (ACCESS_CODE),
	INDEX PERMISSION_ID (PERMISSION_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_user_option (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    TASK_ID INT(11) NOT NULL,
    USER_ID INT(11) NOT NULL,
    OPTION_CODE INT NOT NULL,
    UNIQUE KEY TASK_USER_OPTION (TASK_ID, USER_ID, OPTION_CODE),
    INDEX TASK_USER_OPTION_CODE (USER_ID, OPTION_CODE)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_entity (
	ID INT(18) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	GROUP_ID INT(18) NOT NULL,
	ENTITY_TYPE VARCHAR(20) NOT NULL,
	NAME VARCHAR(255) NULL DEFAULT NULL,
	SORT TINYINT(4) NULL DEFAULT NULL,
	CREATED_BY INT(18) NOT NULL,
	MODIFIED_BY INT(18) NOT NULL,
	DATE_START DATETIME NULL DEFAULT NULL,
	DATE_END DATETIME NULL DEFAULT NULL,
	DATE_START_TZ VARCHAR(50) NULL DEFAULT NULL,
	DATE_END_TZ VARCHAR(50) NULL DEFAULT NULL,
	STATUS VARCHAR(32) NULL DEFAULT NULL,
	INFO MEDIUMTEXT NULL,
	INDEX GROUP_ID (GROUP_ID),
	INDEX ENTITY_TYPE (ENTITY_TYPE)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_item (
	ID INT(18) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	ENTITY_ID INT(18) NOT NULL,
	TYPE_ID INT(18) NULL,
	EPIC_ID INT NULL,
	ACTIVE CHAR(1) DEFAULT 'Y',
	NAME VARCHAR(255) NULL DEFAULT NULL,
	DESCRIPTION TEXT NULL DEFAULT NULL,
	SORT TINYINT(4) NULL DEFAULT NULL,
	CREATED_BY INT(18) NOT NULL,
	MODIFIED_BY INT(18) NOT NULL,
	STORY_POINTS VARCHAR(255) NULL DEFAULT NULL,
	SOURCE_ID INT(18) NULL DEFAULT NULL,
	INFO MEDIUMTEXT NULL,
	INDEX ENTITY_ID (ENTITY_ID),
	INDEX TYPE_ID (TYPE_ID),
	INDEX EPIC_ID (EPIC_ID),
	INDEX SOURCE_ID (SOURCE_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_type (
	ID INT(18) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	ENTITY_ID INT(18) NOT NULL,
	NAME VARCHAR(255) NOT NULL,
	SORT TINYINT(4) NULL DEFAULT NULL,
	DOD_REQUIRED CHAR(1) NULL DEFAULT NULL,
	INDEX ENTITY_ID (ENTITY_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_type_checklist_items (
	ID int(11) NOT NULL AUTO_INCREMENT,
	ENTITY_ID int(11) NOT NULL,
	CREATED_BY int(11) NOT NULL,
	TOGGLED_BY int(11) DEFAULT NULL,
	TOGGLED_DATE datetime DEFAULT NULL,
	TITLE varchar(255) DEFAULT NULL,
	IS_COMPLETE char(1) NOT NULL DEFAULT 'N',
	IS_IMPORTANT char(1) NOT NULL DEFAULT 'N',
	SORT_INDEX int(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (ID),
	KEY USER_ID (ENTITY_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_type_checklist_tree (
	PARENT_ID INT NOT NULL,
	CHILD_ID INT NOT NULL,
	LEVEL SMALLINT NOT NULL DEFAULT 0,
	PRIMARY KEY (PARENT_ID, CHILD_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_item_checklist_items (
	ID int(11) NOT NULL AUTO_INCREMENT,
	ITEM_ID int(11) NOT NULL,
	CREATED_BY int(11) NOT NULL,
	TOGGLED_BY int(11) DEFAULT NULL,
	TOGGLED_DATE datetime DEFAULT NULL,
	TITLE varchar(255) DEFAULT NULL,
	IS_COMPLETE char(1) NOT NULL DEFAULT 'N',
	IS_IMPORTANT char(1) NOT NULL DEFAULT 'N',
	SORT_INDEX int(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (ID),
	KEY USER_ID (ITEM_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_item_checklist_tree (
	PARENT_ID INT NOT NULL,
	CHILD_ID INT NOT NULL,
	LEVEL SMALLINT NOT NULL DEFAULT 0,
	PRIMARY KEY (PARENT_ID, CHILD_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scorer_event (
	`ID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`HID` VARCHAR(64) NOT NULL,
	`TYPE` VARCHAR(64) NOT NULL,
	`DATA` MEDIUMTEXT NOT NULL,
	`TASK_DATA` MEDIUMTEXT NULL DEFAULT NULL,
	`CREATED` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`PROCESSED` DATETIME NOT NULL,
	PRIMARY KEY (`ID`),
	INDEX `HID` (`HID`),
	INDEX `PROCESSED` (`PROCESSED`)
);

CREATE TABLE IF NOT EXISTS b_tasks_project_last_activity (
	PROJECT_ID int(11) NOT NULL,
	ACTIVITY_DATE datetime NOT NULL DEFAULT NOW(),
	PRIMARY KEY (PROJECT_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_project_user_option (
	ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	PROJECT_ID INT(11) NOT NULL,
	USER_ID INT(11) NOT NULL,
	OPTION_CODE INT NOT NULL,
	UNIQUE KEY PROJECT_USER_OPTION (PROJECT_ID, USER_ID, OPTION_CODE),
	INDEX IX_TASKS_PROJECT_USER_OPTION_USER_ID_OPTION_CODE (USER_ID, OPTION_CODE)
);

CREATE TABLE IF NOT EXISTS b_tasks_result (
	ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	TASK_ID INT(11) UNSIGNED NOT NULL,
	COMMENT_ID INT(11) UNSIGNED NOT NULL,
	TEXT MEDIUMTEXT NOT NULL,
	CREATED_BY INT(11) UNSIGNED NOT NULL,
	CREATED_AT DATETIME NOT NULL,
	UPDATED_AT DATETIME NOT NULL,
	STATUS TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
	INDEX IX_TASKS_RESULT_TASK_ID (TASK_ID),
	INDEX IX_TASKS_RESULT_COMMENT_ID (COMMENT_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_epic (
	ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	GROUP_ID INT NOT NULL,
	NAME VARCHAR(255) NULL DEFAULT NULL,
	DESCRIPTION TEXT NULL DEFAULT NULL,
	CREATED_BY INT NOT NULL,
	MODIFIED_BY INT DEFAULT NULL,
	COLOR VARCHAR(18) NULL DEFAULT NULL,
	INDEX B_TASKS_SCRUM_EPIC_GROUP_ID (GROUP_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_chat (
	ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	CHAT_ID INT NOT NULL,
	GROUP_ID INT NOT NULL,
	INDEX IX_TASKS_SCRUM_CHAT_GROUP_ID (GROUP_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scrum_type_participants (
	ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	TYPE_ID INT NOT NULL,
	CODE VARCHAR(24) NOT NULL,
	INDEX IX_TASKS_SCRUM_TYPE_PARTICIPANTS_TYPE_ID (TYPE_ID)
);

CREATE TABLE b_tasks_marketing (
	ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	USER_ID INT(10) UNSIGNED NOT NULL DEFAULT 0,
	EVENT VARCHAR(255) NOT NULL,
	DATE_CREATED INT(10) UNSIGNED NOT NULL,
	DATE_SHEDULED INT(10) UNSIGNED NOT NULL DEFAULT 0,
	DATE_EXECUTED INT(10) UNSIGNED NOT NULL DEFAULT 0,
	PARAMS MEDIUMTEXT NULL DEFAULT NULL,
	PRIMARY KEY (ID),
	INDEX EVENT (EVENT, USER_ID),
	INDEX DATE_EXECUTED (DATE_EXECUTED, DATE_SHEDULED)
);

CREATE TABLE b_tasks_template_member (
	ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	TEMPLATE_ID int(11) NOT NULL DEFAULT '0',
	USER_ID int(11) NOT NULL DEFAULT '0',
	TYPE char(1) NOT NULL DEFAULT '',
	PRIMARY KEY (ID),
	UNIQUE INDEX TEMPLATE_MEMBER (TEMPLATE_ID,USER_ID,TYPE),
	INDEX TEMPLATE_USER_TYPE (USER_ID, TYPE)
);

CREATE TABLE b_tasks_template_tag (
	ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	TEMPLATE_ID int(11) NOT NULL,
	USER_ID int(11) NOT NULL,
	`NAME` VARCHAR(255) NOT NULL,
	PRIMARY KEY (ID),
	UNIQUE INDEX TEMPLATE_TAG (TEMPLATE_ID,USER_ID,`NAME`),
	INDEX TEMPLATE_TAG_NAME (`NAME`),
	INDEX TEMPLATE_TAG_USER (USER_ID)
);

CREATE TABLE b_tasks_template_dependence (
	ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    TEMPLATE_ID INT(10) NOT NULL,
	DEPENDS_ON_ID INT(10) NOT NULL,
	PRIMARY KEY (ID),
	UNIQUE INDEX TEMPLATE_DEPENDENCE (TEMPLATE_ID, DEPENDS_ON_ID),
	INDEX TEMPLATE_DEPENDS_ON_ID (DEPENDS_ON_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_label (
	ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	USER_ID INT(11) DEFAULT 0,
	NAME VARCHAR(255) NOT NULL,
	GROUP_ID INT(11) DEFAULT 0,
	PRIMARY KEY (ID),
	INDEX TASKS_TAGS_NAME (NAME),
	UNIQUE INDEX TASKS_TAG_USER_NAME_GROUP (USER_ID, GROUP_ID, NAME)
);

CREATE TABLE IF NOT EXISTS b_tasks_task_tag (
	ID INT(11) UNSIGNED AUTO_INCREMENT NOT NULL,
	TAG_ID INT(11) NOT NULL,
	TASK_ID INT(11) NOT NULL,
	PRIMARY KEY (ID),
	UNIQUE INDEX TASKS_TASK_TAG (TAG_ID, TASK_ID),
	INDEX ix_b_tasks_task_tag_task_id(TASK_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_viewed_group (
   GROUP_ID int(11) NOT NULL,
   USER_ID int(11) NOT NULL,
   TYPE_ID int(11) NOT NULL,
   MEMBER_TYPE char(1) NOT NULL DEFAULT '',
   VIEWED_DATE timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (GROUP_ID,USER_ID, MEMBER_TYPE, TYPE_ID)
);

CREATE TABLE IF NOT EXISTS b_tasks_scenario (
	TASK_ID  INT(11) UNSIGNED NOT NULL,
	SCENARIO varchar(8) NOT NULL DEFAULT 'default',
	INDEX task_scenario_index (TASK_ID, SCENARIO)
);

CREATE TABLE IF NOT EXISTS b_tasks_template_scenario (
	TEMPLATE_ID INT(11) UNSIGNED NOT NULL,
	SCENARIO varchar(8) NOT NULL DEFAULT 'default',
	PRIMARY KEY (TEMPLATE_ID),
	INDEX idx_scenario (SCENARIO)
);

CREATE TABLE IF NOT EXISTS b_tasks_regular_parameters (
	ID INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	TASK_ID INT(11) NOT NULL,
	REGULAR_PARAMETERS TEXT NOT NULL,
	START_TIME DATETIME DEFAULT NULL,
	START_DAY DATE DEFAULT NULL,
	NOTIFICATION_SENT char(1) NOT NULL DEFAULT 'N',
	PRIMARY KEY (ID),
	UNIQUE INDEX idx_b_tasks_regular_parameters_task_id (TASK_ID),
	INDEX idx_b_tasks_regular_parameters_start_day_notification_sent (START_DAY, NOTIFICATION_SENT)
);

CREATE TABLE IF NOT EXISTS b_tasks_custom_sort
(
	ID           int(11)        NOT NULL AUTO_INCREMENT,
	TASK_ID      int(11)        NOT NULL,
	SORT         decimal(18, 7) NOT NULL,
	USER_ID      int(11)        NOT NULL DEFAULT 0,
	GROUP_ID     int(11)        NOT NULL DEFAULT 0,
	PREV_TASK_ID int(11)        NOT NULL DEFAULT 0,
	NEXT_TASK_ID int(11)        NOT NULL DEFAULT 0,
	PRIMARY KEY (ID),
	INDEX ix_tasks_custom_sort_user_id_sort_task_id (USER_ID, SORT, TASK_ID),
	INDEX ix_tasks_custom_sort_group_id_sort_task_id (GROUP_ID, SORT, TASK_ID),
	INDEX ix_b_tasks_custom_sort_task_id_group_id (TASK_ID, GROUP_ID),
	UNIQUE INDEX ix_b_tasks_custom_sort_task_id_user_id_group_id (TASK_ID, USER_ID, GROUP_ID)
);

create table if not exists b_tasks_flow (
	ID int not null auto_increment,
	OWNER_ID int not null,
	CREATOR_ID int not null,
	GROUP_ID int not null,
	TEMPLATE_ID int not null default 0,
	EFFICIENCY int not null default 100,
	ACTIVE tinyint(1) not null default 0,
	PLANNED_COMPLETION_TIME int not null default 0,
	ACTIVITY datetime not null default now(),
	NAME varchar(255) not null,
	DESCRIPTION text,
	DISTRIBUTION_TYPE varchar(16) not null default '',
	DEMO tinyint(1) not null default 0,
	primary key (ID),
	index idx_b_tasks_flow_group_id (GROUP_ID),
	index idx_b_tasks_flow_activity (ACTIVITY),
	index idx_b_tasks_flow_creator (CREATOR_ID),
	index idx_b_tasks_flow_owner (OWNER_ID),
	index idx_b_tasks_flow_efficiency (EFFICIENCY),
	unique index idx_b_tasks_flow_name (NAME)
);

create table if not exists b_tasks_flow_task (
	ID int not null auto_increment,
	FLOW_ID int not null,
	TASK_ID int not null,
	primary key (ID),
	index idx_b_tasks_flow_task_flow_id_task_id (FLOW_ID, TASK_ID),
	unique index idx_b_tasks_flow_task_task_id (TASK_ID)
);

create table if not exists b_tasks_flow_option (
	ID int not null auto_increment,
	FLOW_ID int not null,
	NAME varchar(255) not null,
	VALUE varchar(255) not null,
	primary key (ID),
	unique index idx_b_tasks_flow_option_name_value (FLOW_ID, NAME)
);

create table if not exists b_tasks_flow_responsible_queue (
	ID int not null auto_increment,
	FLOW_ID int not null,
	USER_ID int not null,
	NEXT_USER_ID int not null,
	SORT tinyint not null default 0,
	primary key (ID),
	unique index idx_b_tasks_flow_responsible_queue_flow_id_user_id (FLOW_ID, USER_ID),
	index idx_b_tasks_flow_responsible_queue_flow_id_sort (FLOW_ID, SORT)
);

create table if not exists b_tasks_flow_notification
(
	ID int not null auto_increment,
	FLOW_ID int not null,
	INTEGRATION_ID int not null default 0,
	STATUS varchar(50) not null default 'SYNC',
	DATA text not null,
	UPDATED_AT datetime not null default now(),
	index b_tasks_flow_notification_flow (FLOW_ID),
	primary key (ID)
);

create table if not exists b_tasks_flow_search_index
(
	ID int not null auto_increment,
	FLOW_ID int not null,
	SEARCH_INDEX mediumtext null,
	unique index ux_b_tasks_flow_search_index_flow_id (FLOW_ID),
	fulltext index IXF_TASKS_FLOW_SEARCH_INDEX_SEARCH_INDEX (SEARCH_INDEX),
	primary key (ID)
);

create table if not exists b_tasks_flow_member
(
	ID int not null auto_increment,
	FLOW_ID int not null,
	ACCESS_CODE varchar(100) not null,
	ENTITY_ID int not null,
	ENTITY_TYPE varchar(100) not null,
	ROLE char(2) not null,
	unique index ix_flow_access (FLOW_ID, ACCESS_CODE, ROLE),
	index ix_access (ACCESS_CODE),
	index ix_role (ROLE),
	index ix_entity (ENTITY_ID, ENTITY_TYPE),
	primary key (ID)
);

create table if not exists b_tasks_flow_auto_created_robot
(
	ID int not null auto_increment,
	FLOW_ID int not null,
	STAGE_ID int not null,
	BIZ_PROC_TEMPLATE_ID int not null,
	STAGE_TYPE varchar(255) not null,
	ROBOT varchar(255) not null,
	primary key (ID),
	unique index ix_flow_robot(FLOW_ID, ROBOT)
);

create table if not exists b_tasks_flow_user_option
(
	ID int not null auto_increment,
	FLOW_ID int not null,
	USER_ID int not null,
	NAME varchar(255) not null,
	VALUE varchar(255) not null,
	primary key (ID),
	unique index ix_b_task_flow_user_option_name_value(FLOW_ID, USER_ID, NAME)
);


create table if not exists b_tasks_flow_copilot_advice
(
	FLOW_ID int not null,
	ADVICE  text,
	UPDATED_DATE datetime default null,
	primary key (FLOW_ID)
);

create table if not exists b_tasks_flow_copilot_collected_data
(
	FLOW_ID int not null,
	DATA  text,
	STATUS varchar(255),
	index b_tasks_flow_copilot_collected_data_status_idx (STATUS),
	primary key (FLOW_ID)
);

create table if not exists b_tasks_onboarding_queue
(
	ID int not null auto_increment,
	TASK_ID int not null,
	USER_ID int not null,
	TYPE varchar(150) not null,
	NEXT_EXECUTION datetime not null,
	CREATED_DATE datetime default now(),
	CODE varchar(150) not null ,
	PROCESSED_DATE datetime default null,
	IS_PROCESSED tinyint default 0,

	primary key (ID),
	index ix_b_tasks_onboarding_queue_execution_processed (NEXT_EXECUTION, IS_PROCESSED),
	index ix_b_tasks_onboarding_queue_user_id_task_id_type (USER_ID, TASK_ID, TYPE),
	index ix_b_tasks_onboarding_queue_type (TYPE)
);

create table if not exists b_tasks_onboarding_queue_job_count
(
	ID int not null auto_increment,
	CODE varchar(150) not null ,
	JOB_COUNT int default 0,

	primary key (ID),
	unique index ix_b_tasks_onboarding_queue_job_count_code (CODE)
);

create table if not exists b_tasks_deadline_user_option
(
	ID int not null auto_increment,
	USER_ID int not null,
	DEFAULT_DEADLINE int default 0,
	IS_EXACT_DEADLINE_TIME tinyint default 0,
	SKIP_NOTIFICATION_PERIOD varchar(16) not null default '',
	SKIP_NOTIFICATION_START_DATE datetime default null,

	primary key (ID),
	unique index ix_b_tasks_deadline_user_option_user_id (USER_ID)
);

create table if not exists b_tasks_task_chat (
	TASK_ID  INT(11) UNSIGNED NOT NULL,
	CHAT_ID  INT(11) UNSIGNED NOT NULL,
	INDEX task_chat_index (TASK_ID, CHAT_ID)
);

create table if not exists b_tasks_task_result_file (
	ID int not null auto_increment,
	RESULT_ID  int(11) unsigned not null,
	FILE_ID int(11) not null ,
	PRIMARY KEY (ID),
	index task_result_file_index (RESULT_ID)
);
