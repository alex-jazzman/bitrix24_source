create table b_ldap_server
(
	ID				int 			not null	auto_increment,
	TIMESTAMP_X		timestamp		not null default CURRENT_TIMESTAMP,
	NAME			varchar(255)	not null,
	DESCRIPTION		text,
	CODE			varchar(255),
	ACTIVE			char(1)			not null	default 'Y',
	SERVER			varchar(255)	not null,
	PORT			int				not null	default 389,
	ADMIN_LOGIN		varchar(255)	not null,
	ADMIN_PASSWORD	varchar(255)	not null,
	BASE_DN			varchar(255)	not null,
	GROUP_FILTER	text            not null,
	GROUP_ID_ATTR	varchar(255)	not null,
	GROUP_NAME_ATTR	varchar(255),
	GROUP_MEMBERS_ATTR	varchar(255),
	USER_FILTER 	text        	not null,
	USER_ID_ATTR	varchar(255)	not null,
	USER_NAME_ATTR	varchar(255),
	USER_LAST_NAME_ATTR	varchar(255),
	USER_EMAIL_ATTR	varchar(255),
	USER_GROUP_ATTR	varchar(255),
	USER_GROUP_ACCESSORY	char(1)	null	default 'N',
	USER_DEPARTMENT_ATTR varchar(255),
	USER_MANAGER_ATTR varchar(255),
	CONVERT_UTF8	char(1)	null	default 'N',
	SYNC_PERIOD 	int(18),
	FIELD_MAP 		text,
	ROOT_DEPARTMENT	int(18),
	DEFAULT_DEPARTMENT_NAME varchar(255),
	IMPORT_STRUCT	char(1)	null	default 'N',
	STRUCT_HAVE_DEFAULT	char(1),
	SET_DEPARTMENT_HEAD	char(1) DEFAULT 'Y',
	SYNC 			char(1),
	SYNC_ATTR 		varchar(255),
	SYNC_LAST 		datetime,
	MAX_PAGE_SIZE	int null,
	LDAP_OPT_TIMELIMIT	INT NOT NULL DEFAULT 100,
	LDAP_OPT_TIMEOUT	INT NOT NULL DEFAULT 5,
	LDAP_OPT_NETWORK_TIMEOUT	INT NOT NULL DEFAULT 5,
	SYNC_USER_ADD 			char(1),
	CONNECTION_TYPE int null,
	primary key(ID)
);

create table b_ldap_group
(
	LDAP_SERVER_ID	int				not null,
	GROUP_ID		int				not null,
	LDAP_GROUP_ID	varchar(255)	not null,
	primary key (LDAP_SERVER_ID, GROUP_ID, LDAP_GROUP_ID)
);

create table b_ldap_sync_session
(
	ID int not null auto_increment,
	SERVER_ID int NOT NULL,
	STATE varchar(20) NOT NULL,
	STARTED_AT datetime NOT NULL,
	UPDATED_AT datetime DEFAULT NULL,
	FINISHED_AT datetime DEFAULT NULL,
	PROGRESS text DEFAULT NULL,
	MESSAGE varchar(255) DEFAULT NULL,
	primary key (ID)
);

create table b_ldap_user_last_sync
(
	USER_ID int NOT NULL,
	SERVER_ID int NOT NULL,
	SESSION_ID int NOT NULL,
	LAST_SYNC_AT datetime NOT NULL,
	PRIMARY KEY (USER_ID, SERVER_ID)
);
