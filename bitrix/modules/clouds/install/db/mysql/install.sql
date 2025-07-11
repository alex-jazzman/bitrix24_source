CREATE TABLE b_clouds_file_bucket
(
	ID INT(11) NOT NULL auto_increment,
	ACTIVE CHAR(1) DEFAULT 'Y',
	SORT INT(11) DEFAULT 500,
	READ_ONLY CHAR(1) DEFAULT 'N',
	SERVICE_ID VARCHAR(50),
	BUCKET VARCHAR(63),
	LOCATION VARCHAR(50),
	CNAME VARCHAR(100),
	FILE_COUNT INT(11) default 0,
	FILE_SIZE double default 0,
	LAST_FILE_ID INT(11),
	PREFIX VARCHAR(100),
	SETTINGS TEXT,
	FILE_RULES TEXT,
	FAILOVER_ACTIVE CHAR(1) DEFAULT 'N',
	FAILOVER_BUCKET_ID INT(11),
	FAILOVER_COPY CHAR(1) DEFAULT 'N',
	FAILOVER_DELETE CHAR(1) DEFAULT 'N',
	FAILOVER_DELETE_DELAY INT(11),
	PRIMARY KEY pk_b_clouds_file_bucket(ID)
);

CREATE TABLE b_clouds_file_upload
(
	ID VARCHAR(32) NOT NULL,
	TIMESTAMP_X DATETIME NOT NULL,
	FILE_PATH VARCHAR(500) NOT NULL,
	FILE_SIZE BIGINT NULL,
	TMP_FILE VARCHAR(500) NULL,
	BUCKET_ID INT(11) NOT NULL,
	PART_SIZE INT(11) NOT NULL,
	PART_NO INT(11) NOT NULL,
	PART_FAIL_COUNTER INT(11) NOT NULL,
	NEXT_STEP MEDIUMTEXT,
	PRIMARY KEY pk_b_clouds_file_upload(ID)
);

CREATE TABLE b_clouds_file_resize
(
	ID INT(11) NOT NULL auto_increment,
	TIMESTAMP_X DATETIME NOT NULL,
	ERROR_CODE INT NOT NULL DEFAULT 0,
	FILE_ID INT(11),
	PARAMS TEXT,
	FROM_PATH VARCHAR(500),
	TO_PATH VARCHAR(500),
	PRIMARY KEY pk_b_file_resize(ID),
	INDEX ix_b_file_resize_ts (TIMESTAMP_X),
	INDEX ix_b_file_resize_path (TO_PATH(100)),
	INDEX ix_b_file_resize_file (FILE_ID)
);

CREATE TABLE b_clouds_copy_queue
(
	ID INT(32) NOT NULL auto_increment,
	TIMESTAMP_X DATETIME NOT NULL,
	OP CHAR(1) NOT NULL,
	SOURCE_BUCKET_ID INT(11) NOT NULL,
	SOURCE_FILE_PATH VARCHAR(500) NOT NULL,
	TARGET_BUCKET_ID INT(11) NOT NULL,
	TARGET_FILE_PATH VARCHAR(500) NOT NULL,
	FILE_SIZE INT(11) not null default -1,
	FILE_POS INT(11) not null default 0,
	FAIL_COUNTER INT(11) not null default 0,
	STATUS CHAR(1) not null default 'Y',
	ERROR_MESSAGE VARCHAR(500),
	PRIMARY KEY pk_b_clouds_copy_queue(ID)
);

CREATE TABLE b_clouds_delete_queue
(
	ID INT(32) NOT NULL auto_increment,
	TIMESTAMP_X DATETIME NOT NULL,
	BUCKET_ID INT(11) NOT NULL,
	FILE_PATH VARCHAR(500) NOT NULL,
	PRIMARY KEY pk_b_clouds_delete_queue(ID),
	INDEX ix_b_clouds_delete_queue_1(BUCKET_ID, FILE_PATH(100))
);

CREATE TABLE b_clouds_file_save
(
	ID INT(32) NOT NULL auto_increment,
	TIMESTAMP_X DATETIME NOT NULL,
	BUCKET_ID INT(11) NOT NULL,
	SUBDIR VARCHAR(255),
	FILE_NAME VARCHAR(255) not null,
	EXTERNAL_ID VARCHAR(50),
	FILE_SIZE BIGINT null,
	INDEX IX_EXTERNAL_ID(EXTERNAL_ID),
	PRIMARY KEY pk_b_clouds_file_upload(ID)
);

CREATE TABLE b_clouds_file_hash
(
	ID INT(32) NOT NULL auto_increment,
	BUCKET_ID INT(11) NOT NULL,
	FILE_PATH VARCHAR(760) NOT NULL,
	FILE_SIZE BIGINT,
	FILE_MTIME DATETIME,
	FILE_HASH VARCHAR(50),
	PRIMARY KEY pk_b_clouds_file_hash(ID),
	INDEX ix_b_clouds_file_hash(BUCKET_ID, FILE_PATH(190))
);

CREATE TABLE b_clouds_size_queue
(
	ID BIGINT NOT NULL auto_increment,
	BUCKET_ID INT NOT NULL,
	FILE_COUNT INT NOT NULL,
	FILE_SIZE BIGINT,
	PRIMARY KEY pk_b_clouds_size_queue(ID)
);
