<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_mail_mailbox')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->timestamp('TIMESTAMP_X');
	$columns->char('LID', 2)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SERVICE_ID')->notNull()->default('0');
	$columns->varchar('EMAIL', 255);
	$columns->varchar('EMAIL_NORMALIZED', 255);
	$columns->varchar('USERNAME', 255);
	$columns->varchar('NAME', 255);
	$columns->varchar('SERVER', 255);
	$columns->int('PORT')->notNull()->default('110');
	$columns->varchar('LINK', 255);
	$columns->varchar('LOGIN', 255);
	$columns->varchar('CHARSET', 255);
	$columns->varchar('PASSWORD', 255);
	$columns->text('DESCRIPTION');
	$columns->char('USE_MD5', 1)->notNull()->default('N');
	$columns->char('DELETE_MESSAGES', 1)->notNull()->default('N');
	$columns->int('PERIOD_CHECK');
	$columns->int('MAX_MSG_COUNT')->default('0');
	$columns->int('MAX_MSG_SIZE')->default('0');
	$columns->int('MAX_KEEP_DAYS')->default('0');
	$columns->char('USE_TLS', 1)->notNull()->default('N');
	$columns->varchar('SERVER_TYPE', 10)->notNull()->default('pop3');
	$columns->varchar('DOMAINS', 255);
	$columns->char('RELAY', 1)->notNull()->default('Y');
	$columns->char('AUTH_RELAY', 1)->notNull()->default('Y');
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->int('SYNC_LOCK');
	$columns->mediumText('OPTIONS');
	$columns->int('ACTIVE_GENERATION_ID')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_MAIL_MAILBOX_USER_ID', ['USER_ID']);
	$table->addIndex('IX_B_MAIL_MAILBOX_ACTIVE_GEN', ['ACTIVE_GENERATION_ID']);
	$table->addIndex('IX_B_MAIL_MAILBOX_EMAIL_NORMALIZED', ['EMAIL_NORMALIZED']);
});

$migration->table('b_mail_mailbox_alias')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->varchar('EMAIL', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_MAIL_MBOX_ALIAS_MAILBOX_EMAIL', ['MAILBOX_ID', 'EMAIL']);
	$table->addIndex('IX_MAIL_MBOX_ALIAS_EMAIL', ['EMAIL']);
});

$migration->table('b_mail_filter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->timestamp('TIMESTAMP_X');
	$columns->int('MAILBOX_ID')->notNull();
	$columns->int('PARENT_FILTER_ID');
	$columns->varchar('NAME', 255);
	$columns->text('DESCRIPTION');
	$columns->int('SORT')->notNull()->default('500');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->text('PHP_CONDITION');
	$columns->char('WHEN_MAIL_RECEIVED', 1)->notNull()->default('N');
	$columns->char('WHEN_MANUALLY_RUN', 1)->notNull()->default('N');
	$columns->decimal('SPAM_RATING', 9, 4);
	$columns->char('SPAM_RATING_TYPE', 1)->default('<');
	$columns->int('MESSAGE_SIZE');
	$columns->char('MESSAGE_SIZE_TYPE', 1)->default('<');
	$columns->char('MESSAGE_SIZE_UNIT', 1);
	$columns->char('ACTION_STOP_EXEC', 1)->notNull()->default('N');
	$columns->char('ACTION_DELETE_MESSAGE', 1)->notNull()->default('N');
	$columns->char('ACTION_READ', 1)->notNull()->default('-');
	$columns->text('ACTION_PHP');
	$columns->varchar('ACTION_TYPE', 50);
	$columns->text('ACTION_VARS');
	$columns->char('ACTION_SPAM', 1)->notNull()->default('-');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_FILTER_MAILBOX', ['MAILBOX_ID']);
});

$migration->table('b_mail_filter_cond')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('FILTER_ID')->notNull();
	$columns->varchar('TYPE', 50)->notNull();
	$columns->text('STRINGS')->notNull();
	$columns->varchar('COMPARE_TYPE', 30)->notNull()->default('CONTAIN');
	$table->addPrimaryKey('ID');
});

$migration->table('b_mail_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->longText('FULL_TEXT');
	$columns->int('MESSAGE_SIZE')->notNull();
	$columns->text('HEADER');
	$columns->datetime('FIELD_DATE');
	$columns->varchar('FIELD_FROM', 255);
	$columns->varchar('FIELD_REPLY_TO', 255);
	$columns->varchar('FIELD_TO', 255);
	$columns->varchar('FIELD_CC', 255);
	$columns->varchar('FIELD_BCC', 255);
	$columns->int('FIELD_PRIORITY')->notNull()->default('3');
	$columns->varchar('SUBJECT', 255);
	$columns->longText('BODY');
	$columns->longText('BODY_HTML');
	$columns->text('SEARCH_CONTENT');
	$columns->smallInt('INDEX_VERSION')->unsigned()->notNull()->default('0');
	$columns->int('ATTACHMENTS')->default('0');
	$columns->char('NEW_MESSAGE', 1)->default('Y');
	$columns->char('SPAM', 1)->notNull()->default('?');
	$columns->decimal('SPAM_RATING', 18, 4);
	$columns->varchar('SPAM_WORDS', 255);
	$columns->char('SPAM_LAST_RESULT', 1)->notNull()->default('N');
	$columns->varchar('EXTERNAL_ID', 255);
	$columns->varchar('MSG_ID', 255);
	$columns->varchar('IN_REPLY_TO', 255);
	$columns->int('LEFT_MARGIN')->unsigned();
	$columns->int('RIGHT_MARGIN')->unsigned();
	$columns->datetime('READ_CONFIRMED');
	$columns->text('OPTIONS');
	$columns->tinyInt('SANITIZE_ON_VIEW');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_MESSAGE', ['MAILBOX_ID', 'IN_REPLY_TO(50)', 'MSG_ID(50)']);
	$table->addIndex('IX_MAIL_MESSAGE_2', ['MAILBOX_ID', 'MSG_ID']);
	$table->addIndex('IX_MAIL_MESSAGE_DATE', ['DATE_INSERT', 'MAILBOX_ID']);
	$table->addIndex('IX_MAIL_MESSAGE_DATE_2', ['MAILBOX_ID', 'FIELD_DATE']);
	// Keyset walk over the messages of one mailbox in the order they were created
	$table->addIndex('IX_MAIL_MESSAGE_MBX_ID', ['MAILBOX_ID', 'ID']);
	$table->addIndex('IX_MAIL_MESSAGE_MSG_ID', ['MSG_ID']);
	$table->addIndex('IX_MAIL_MESSAGE_IN_REPLY', ['IN_REPLY_TO']);
	$table->addIndex('IX_MAIL_MESSAGE_INDEX_VERSION_2', ['INDEX_VERSION']);
	$table->addIndex('IX_MAIL_MESSAGE_TREE', ['LEFT_MARGIN', 'RIGHT_MARGIN', 'MAILBOX_ID']);
	$table->addFulltextIndex('IXF_B_MAIL_MESSAGE_SC', ['SEARCH_CONTENT']);
});

$migration->table('b_mail_message_uid')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 32)->notNull();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->varchar('DIR_MD5', 32);
	$columns->int('DIR_UIDV')->unsigned();
	$columns->int('MSG_UID')->unsigned();
	$columns->datetime('INTERNALDATE');
	$columns->varchar('HEADER_MD5', 32);
	$columns->char('IS_SEEN', 1)->notNull()->default('N');
	$columns->varchar('SESSION_ID', 32)->notNull();
	$columns->timestamp('TIMESTAMP_X');
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('DELETE_TIME')->notNull()->default('0');
	$columns->char('IS_OLD', 1)->notNull()->default('N');
	$columns->int('GENERATION_ID')->notNull()->default('0');
	$table->addPrimaryKeys(['ID', 'MAILBOX_ID']);
	$table->addIndex('IX_MAIL_MSG_DIR_UID', ['MAILBOX_ID', 'DIR_MD5', 'DIR_UIDV', 'MSG_UID']);
	$table->addIndex('IX_MAIL_MSG_UID_HASH', ['HEADER_MD5']);
	$table->addIndex('IX_MAIL_MSG_MBX_ID_MD5_DELETE_TIME', ['MAILBOX_ID', 'DIR_MD5', 'DELETE_TIME', 'MSG_UID']);
	$table->addIndex('IX_MAIL_MSG_UID_SEEN_2', ['MAILBOX_ID', 'DIR_MD5', 'IS_SEEN', 'MESSAGE_ID']);
	$table->addIndex('IX_MAIL_MSG_UID_SEEN_3', ['MAILBOX_ID', 'MESSAGE_ID', 'DIR_MD5', 'IS_SEEN']);
	$table->addIndex('IX_MAIL_MSG_UID_MESSAGE_IS_OLD', ['MAILBOX_ID', 'MESSAGE_ID', 'DIR_MD5', 'IS_OLD']);
	$table->addIndex('IX_MAIL_SET_OLD_STATUS', ['MAILBOX_ID', 'MESSAGE_ID', 'INTERNALDATE']);
	$table->addIndex('IX_MAIL_MSG_UID_MBX_INTERNAL_DATE', ['MAILBOX_ID', 'INTERNALDATE']);
	$table->addIndex('IX_MAIL_SEARCH_UNSYNCHRONIZED_MESSAGES_2', ['MAILBOX_ID', 'IS_OLD', 'MESSAGE_ID', 'DATE_INSERT']);
	$table->addIndex('IX_MAIL_MESSAGES_LIST_LOADING', ['MESSAGE_ID', 'MAILBOX_ID', 'DIR_MD5', 'DELETE_TIME']);
	$table->addIndex('IX_B_MAIL_SYNC_DIR', ['MAILBOX_ID', 'DIR_MD5', 'MESSAGE_ID']);
	$table->addIndex('IX_MAIL_DELETE_TIME_2', ['MAILBOX_ID', 'DELETE_TIME', 'DIR_MD5']);
	$table->addIndex('IX_B_MAIL_SYNC_DIR_DELETE_MESSAGES', ['MSG_UID', 'MAILBOX_ID', 'DIR_MD5', 'MESSAGE_ID']);
	$table->addIndex(
		'IX_MAIL_MESSAGE_UID_DIR_START_DATE',
		['MAILBOX_ID', 'DIR_MD5', 'DELETE_TIME', 'IS_OLD', 'INTERNALDATE', 'MESSAGE_ID'],
	);
	$table->addIndex('IX_MAIL_MESSAGE_UID_GEN_DIR_UID', ['MAILBOX_ID', 'GENERATION_ID', 'DIR_MD5', 'DIR_UIDV', 'MSG_UID']);
	$table->addIndex('IX_MAIL_MESSAGE_UID_GEN_MSG_DEL', ['MAILBOX_ID', 'GENERATION_ID', 'MESSAGE_ID', 'DELETE_TIME']);
	$table->addIndex('IX_MAIL_MESSAGE_UID_GEN_OLD_MSG', ['MAILBOX_ID', 'GENERATION_ID', 'IS_OLD', 'MESSAGE_ID', 'DATE_INSERT']);
	/*
		The folder start date belongs to the generations serving the mailbox now. Keeping the
		generation before the folder and countable-state keys stops retained generations from
		joining the MIN(INTERNALDATE) range.
	*/
	$table->addIndex(
		'IX_MAIL_MESSAGE_UID_GEN_DIR_START_DATE',
		['MAILBOX_ID', 'GENERATION_ID', 'DIR_MD5', 'DELETE_TIME', 'IS_OLD', 'INTERNALDATE', 'MESSAGE_ID'],
	);
	/*
		The list, the folder page and the counters answer from this index alone: it holds
		every column they read, so the rows of a retained generation are never touched.
	*/
	$table->addIndex('IX_MAIL_MESSAGE_UID_GEN_LIST', ['MAILBOX_ID', 'GENERATION_ID', 'DIR_MD5', 'DELETE_TIME', 'MESSAGE_ID', 'INTERNALDATE', 'IS_OLD']);
});

$migration->table('b_mail_msg_attachment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('FILE_ID')->notNull()->default('0');
	$columns->varchar('FILE_NAME', 255);
	$columns->int('FILE_SIZE')->notNull()->default('0');
	$columns->longBlob('FILE_DATA');
	$columns->varchar('CONTENT_TYPE', 255);
	$columns->int('IMAGE_WIDTH');
	$columns->int('IMAGE_HEIGHT');
	$columns->int('EXTERNAL_LINK_ID');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_MESSATTACHMENT', ['MESSAGE_ID']);
	$table->addIndex('IX_MAIL_MSG_ATTACHMENT_FILE_ID', ['FILE_ID']);
	$table->addIndex('IX_MAIL_MSG_ATTACH_EXTLINK', ['EXTERNAL_LINK_ID']);
});

$migration->table('b_mail_spam_weight')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('WORD_ID', 32)->notNull();
	$columns->varchar('WORD_REAL', 50)->notNull();
	$columns->int('GOOD_CNT')->notNull()->default('0');
	$columns->int('BAD_CNT')->notNull()->default('0');
	$columns->int('TOTAL_CNT')->notNull()->default('0');
	$columns->timestamp('TIMESTAMP_X');
	$table->addPrimaryKey('WORD_ID');
	$table->addIndex('mail_spam_good', ['GOOD_CNT']);
	$table->addIndex('mail_spam_bad', ['BAD_CNT']);
});

$migration->table('b_mail_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull()->default('0');
	$columns->int('FILTER_ID');
	$columns->int('MESSAGE_ID');
	$columns->varchar('LOG_TYPE', 50);
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->char('STATUS_GOOD', 1)->notNull()->default('Y');
	$columns->varchar('MESSAGE', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_MSGLOG_1', ['MAILBOX_ID']);
	$table->addIndex('IX_MAIL_MSGLOG_2', ['MESSAGE_ID']);
});

$migration->table('b_mail_mailservices')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('SITE_ID', 255)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('SERVICE_TYPE', 10)->notNull()->default('imap');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('SERVER', 255);
	$columns->int('PORT');
	$columns->char('ENCRYPTION', 1);
	$columns->varchar('LINK', 255);
	$columns->int('ICON');
	$columns->varchar('TOKEN', 255);
	$columns->int('FLAGS')->notNull()->default('0');
	$columns->int('SORT')->notNull()->default('100');
	$columns->varchar('SMTP_SERVER', 255);
	$columns->int('SMTP_PORT');
	$columns->char('SMTP_ENCRYPTION', 1);
	$columns->char('SMTP_LOGIN_AS_IMAP', 1)->notNull()->default('N');
	$columns->char('SMTP_PASSWORD_AS_IMAP', 1)->notNull()->default('N');
	$columns->char('UPLOAD_OUTGOING', 1);
	$table->addIndex('IX_B_MAIL_MAILSERVICE_ACTIVE', ['ACTIVE']);
});

$migration->table('b_mail_user_relations')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('TOKEN', 32)->notNull();
	$columns->char('SITE_ID', 2);
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->varchar('ENTITY_ID', 255);
	$columns->varchar('ENTITY_LINK', 255);
	$columns->varchar('BACKURL', 255);
	$table->addPrimaryKey('TOKEN');
	$table->addUniqueIndex('UX_B_MAIL_USER_RELATION', ['USER_ID', 'ENTITY_TYPE(50)', 'ENTITY_ID(50)', 'SITE_ID']);
});

$migration->table('b_mail_blacklist')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->int('MAILBOX_ID')->notNull()->default('0');
	$columns->int('USER_ID')->unsigned()->notNull()->default('0');
	$columns->int('ITEM_TYPE')->notNull();
	$columns->varchar('ITEM_VALUE', 255)->notNull();
	$table->addIndex('IX_B_MAIL_BLACKLIST', ['MAILBOX_ID', 'SITE_ID']);
	$table->addUniqueIndex('UX_B_MAIL_BLACKLIST_MAILBOX_USER_VALUE', ['MAILBOX_ID', 'USER_ID', 'ITEM_VALUE']);
});

$migration->table('b_mail_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('EMAIL', 255);
	$columns->varchar('NAME', 255);
	$columns->varchar('ICON', 255);
	$columns->int('FILE_ID')->unsigned();
	$columns->int('USER_ID')->unsigned();
	$columns->varchar('ADDED_FROM', 50);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_MAIL_CONTACT_USER_ID_EMAIL', ['USER_ID', 'EMAIL']);
});

$migration->table('b_mail_domain_email')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('DOMAIN', 255)->notNull();
	$columns->varchar('LOGIN', 255)->notNull();
	$table->addPrimaryKeys(['LOGIN', 'DOMAIN']);
	$table->addIndex('IX_B_MAIL_DOMAIN_EMAIL', ['DOMAIN(50)']);
});

$migration->table('b_mail_oauth')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('UID', 32)->notNull();
	$columns->text('TOKEN');
	$columns->text('REFRESH_TOKEN');
	$columns->bigInt('TOKEN_EXPIRES')->unsigned();
	$columns->varchar('SECRET', 250);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_MAIL_OAUTH_UID', ['UID']);
});

$migration->table('b_mail_mailbox_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->unsigned()->notNull();
	$columns->int('TASK_ID')->unsigned()->notNull();
	$columns->varchar('ACCESS_CODE', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_MAIL_MAILBOX_ACCESS_CODE', ['ACCESS_CODE', 'TASK_ID']);
});

$migration->table('b_mail_message_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('TOKEN', 32)->notNull();
	$columns->varchar('SECRET', 32)->notNull();
	$columns->int('MAILBOX_ID')->unsigned()->notNull();
	$columns->int('MESSAGE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_UF_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_TYPE', 20)->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->text('OPTIONS');
	$table->addPrimaryKey('TOKEN');
	$table->addIndex('IX_B_MAIL_MESSAGE_ACCESS', ['MESSAGE_ID', 'ENTITY_ID', 'ENTITY_UF_ID', 'MAILBOX_ID']);
	$table->addIndex('IX_B_MAIL_MESSAGE_ACCESS_ENTITY_ID_TYPE', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_mail_message_upload_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 32)->notNull();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->int('SYNC_STAGE')->notNull()->default('0');
	$columns->int('SYNC_LOCK')->notNull()->default('0');
	$columns->int('ATTEMPTS')->notNull()->default('0');
	$columns->int('GENERATION_ID')->notNull()->default('0');
	$table->addPrimaryKeys(['ID', 'MAILBOX_ID']);
	$table->addIndex('IX_MAIL_MESSAGE_UPLOAD_QUEUE_GEN_STAGE', ['MAILBOX_ID', 'GENERATION_ID', 'SYNC_STAGE', 'SYNC_LOCK']);
});

$migration->table('b_mail_user_signature')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->text('SIGNATURE');
	$columns->varchar('SENDER', 255);
});

$migration->table('b_mail_user_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TYPE', 10)->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->varchar('ENTITY_ID', 255);
	$columns->int('USER_ID')->notNull();
	$columns->varchar('SUBJECT', 255);
	$columns->longText('CONTENT');
	$columns->text('ATTACHMENTS');
	$columns->text('HEADERS');
});

$migration->table('b_mail_message_closure')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('MESSAGE_ID')->unsigned()->notNull();
	$columns->int('PARENT_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_MAIL_MESSAGE_CL', ['MESSAGE_ID', 'PARENT_ID']);
	$table->addIndex('IX_MAIL_MESSAGE_CL_R', ['PARENT_ID', 'MESSAGE_ID']);
});

$migration->table('b_mail_message_delete_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PK')->notNull()->autoincrement();
	$columns->varchar('ID', 32)->notNull();
	$columns->int('MAILBOX_ID')->unsigned()->notNull();
	$columns->int('MESSAGE_ID')->unsigned()->notNull();
	$columns->int('GENERATION_ID')->notNull()->default('0');
	$table->addPrimaryKey('PK');
	$table->addUniqueIndex('UX_MAIL_MESSAGE_DQ', ['ID', 'MAILBOX_ID', 'MESSAGE_ID']);
	$table->addIndex('IX_MAIL_MESSAGE_DQ', ['MAILBOX_ID', 'MESSAGE_ID']);
	$table->addIndex('IX_MAIL_MSG_DQ_GEN_MSG', ['MAILBOX_ID', 'GENERATION_ID', 'MESSAGE_ID']);
});

$migration->table('b_mail_mailbox_dir')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->unsigned()->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('PATH')->notNull();
	$columns->text('FLAGS');
	$columns->varchar('DELIMITER', 1);
	$columns->varchar('DIR_MD5', 32);
	$columns->int('LEVEL')->unsigned()->notNull();
	$columns->int('PARENT_ID')->unsigned();
	$columns->int('ROOT_ID')->unsigned();
	$columns->int('MESSAGE_COUNT')->unsigned();
	$columns->tinyInt('IS_SYNC')->unsigned();
	$columns->tinyInt('IS_DISABLED')->unsigned();
	$columns->tinyInt('IS_INCOME')->unsigned();
	$columns->tinyInt('IS_OUTCOME')->unsigned();
	$columns->tinyInt('IS_DRAFT')->unsigned();
	$columns->tinyInt('IS_TRASH')->unsigned();
	$columns->tinyInt('IS_SPAM')->unsigned();
	$columns->int('SYNC_TIME');
	$columns->int('SYNC_LOCK');
	$columns->boolean('IS_DATE_CACHED');
	$columns->datetime('INTERNAL_START_DATE');
	$columns->int('GENERATION_ID')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_MAIL_MAILBOX_DIR_MAILBOX_ID_DIR_MD5', ['MAILBOX_ID', 'DIR_MD5']);
	$table->addIndex('IX_B_MAIL_DIRECTORY_TREE_BUILDING', ['MAILBOX_ID', 'LEVEL']);
	$table->addIndex('IX_MAIL_MAILBOX_DIR_GEN_MD5', ['MAILBOX_ID', 'GENERATION_ID', 'DIR_MD5']);
	$table->addIndex('IX_MAIL_MAILBOX_DIR_GEN_LEVEL', ['MAILBOX_ID', 'GENERATION_ID', 'LEVEL']);
});

$migration->table('b_mail_counter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MAILBOX_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_TYPE', 32)->notNull();
	$columns->varchar('ENTITY_ID', 32)->notNull();
	$columns->int('VALUE')->unsigned()->notNull()->default('0');
	$table->addPrimaryKeys(['MAILBOX_ID', 'ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_B_MAIL_TOTAL_MAILBOX_COUNTER', ['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_mail_entity_options')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MAILBOX_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_TYPE', 32)->notNull();
	$columns->varchar('ENTITY_ID', 32)->notNull();
	$columns->varchar('PROPERTY_NAME', 32)->notNull();
	$columns->varchar('VALUE', 32)->notNull();
	$columns->datetime('DATE_INSERT');
	$table->addPrimaryKeys(['MAILBOX_ID', 'ENTITY_TYPE', 'ENTITY_ID', 'PROPERTY_NAME']);
	$table->addIndex('IX_B_MAIL_FIND_MESSAGE_EMPTY_BODY', ['MAILBOX_ID', 'ENTITY_TYPE', 'ENTITY_ID', 'PROPERTY_NAME', 'VALUE', 'DATE_INSERT']);
});

$migration->table('b_mail_entity_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MAILBOX_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_TYPE', 32)->notNull();
	$columns->varchar('ENTITY_ID', 32)->notNull();
	$columns->varchar('PROPERTY_NAME', 32)->notNull();
	$columns->mediumText('VALUE')->notNull();
	$columns->datetime('DATE_INSERT');
	$table->addPrimaryKeys(['MAILBOX_ID', 'ENTITY_TYPE', 'ENTITY_ID', 'PROPERTY_NAME']);
});

$migration->table('b_mail_access_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 250)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_mail_access_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('PERMISSION_ID', 32)->notNull();
	$columns->tinyInt('VALUE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_MAIL_ACCESS_PERMISSION_ROLE_ID', ['ROLE_ID']);
	$table->addIndex('IX_B_MAIL_ACCESS_PERMISSION_PERMISSION_ID', ['PERMISSION_ID']);
	$table->addUniqueIndex('ROLE_ID', ['ROLE_ID', 'PERMISSION_ID']);
});

$migration->table('b_mail_access_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('RELATION', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_MAIL_ACCESS_ROLE_RELATION_ROLE_ID', ['ROLE_ID']);
	$table->addIndex('IX_B_MAIL_ACCESS_ROLE_RELATION_RELATION', ['RELATION']);
});

$migration->table('b_mail_mass_connect')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('AUTHOR_ID')->notNull();
	$columns->datetime('CREATED_AT');
	$columns->text('SETTINGS_DATA');
	$columns->text('CONNECTION_RESULT');
	$table->addPrimaryKey('ID');
});

$migration->table('b_mail_mailbox_list_search_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('MAILBOX_ID')->notNull();
	$columns->text('SEARCH_INDEX');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('MAILBOX_ID', ['MAILBOX_ID']);
	$table->addFulltextIndex('IXF_B_MAIL_MAILBOX_LIST_INDEX_SEARCH_INDEX', ['SEARCH_INDEX']);
});

$migration->table('b_mail_task_source')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('TASK_ID')->notNull();
	$columns->varchar('SOURCE_TYPE', 32)->notNull();
	$columns->int('SOURCE_ID')->notNull();
	$table->addPrimaryKey('TASK_ID');
});

$migration->table('b_mail_mailbox_connection_request')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('REQUESTER_ID')->notNull();
	$columns->varchar('COMMENT', 100);
	$columns->varchar('STATUS', 20)->notNull()->default('pending');
	$columns->int('ADMIN_ID');
	$columns->int('MAILBOX_ID');
	$columns->int('CHAT_ID');
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addIndex('IX_B_MAIL_CONN_REQ_REQUESTER', ['REQUESTER_ID']);
});

$migration->table('b_mail_draft')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->unsigned()->autoincrement();
	$columns->int('USER_ID')->notNull()->unsigned();
	$columns->varchar('CONTEXT_TYPE', 8)->notNull();
	// Nullable: completion releases the attempt slot of UX_B_MAIL_DRAFT_ATTEMPT.
	$columns->varchar('CLIENT_ID', 36);
	$columns->int('CRM_ENTITY_TYPE_ID');
	$columns->int('CRM_ENTITY_ID');
	$columns->varchar('COMPOSE_MODE', 8)->notNull();
	$columns->int('PARENT_MESSAGE_ID')->unsigned();
	$columns->text('SENDER_DATA');
	$columns->text('RECIPIENTS_DATA')->notNull();
	$columns->longText('TO_RECIPIENTS_SEARCH');
	$columns->text('SUBJECT');
	$columns->longText('BODY');
	$columns->varchar('BODY_PREVIEW', 200);
	$columns->varchar('BODY_FORMAT', 8)->notNull();
	$columns->longText('LARGE_ATTACHMENTS_DATA');
	$columns->varchar('STATUS', 12)->notNull()->default('active');
	$columns->int('REVISION')->notNull()->unsigned()->default('1');
	$columns->datetime('DATE_MODIFY')->notNull();
	$columns->datetime('DATE_EXPIRE')->notNull();
	$columns->datetime('DATE_COMPLETED');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_MAIL_DRAFT_ATTEMPT', ['USER_ID', 'CONTEXT_TYPE', 'CLIENT_ID']);
	$table->addUniqueIndex(
		'UX_B_MAIL_DRAFT_CRM_CONTEXT',
		['USER_ID', 'CONTEXT_TYPE', 'CRM_ENTITY_TYPE_ID', 'CRM_ENTITY_ID'],
	);
	$table->addIndex('IX_B_MAIL_DRAFT_LIST', ['USER_ID', 'CONTEXT_TYPE', 'DATE_MODIFY', 'ID']);
	$table->addIndex('IX_B_MAIL_DRAFT_EXPIRE', ['STATUS', 'DATE_EXPIRE', 'ID']);
	$table->addIndex('IX_B_MAIL_DRAFT_COMPLETED', ['STATUS', 'DATE_COMPLETED', 'ID']);
});

$migration->table('b_mail_draft_attachment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->unsigned()->autoincrement();
	$columns->int('DRAFT_ID')->notNull()->unsigned();
	$columns->int('FILE_ID')->notNull()->unsigned();
	$columns->int('SOURCE_OBJECT_ID')->notNull()->unsigned();
	$columns->int('SOURCE_FILE_ID')->notNull()->unsigned();
	$columns->varchar('FILE_NAME', 255)->notNull();
	$columns->bigInt('FILE_SIZE')->notNull()->unsigned();
	$columns->varchar('CONTENT_TYPE', 255);
	$columns->int('SORT')->notNull()->default('100');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_MAIL_DRAFT_ATTACHMENT_FILE', ['DRAFT_ID', 'FILE_ID']);
	$table->addIndex('IX_B_MAIL_DRAFT_ATTACHMENT_DRAFT', ['DRAFT_ID']);
	$table->addIndex('IX_B_MAIL_DRAFT_ATTACHMENT_FILE_ID', ['FILE_ID']);
});

$migration->table('b_mail_user_label')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('MAILBOX_ID')->notNull()->default('0');
	$columns->varchar('NAME', 128)->notNull();
	$columns->int('SORT')->notNull()->default('100');
	$columns->datetime('DATE_INSERT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_MAIL_USER_LABEL_USER_MAILBOX_NAME', ['USER_ID', 'MAILBOX_ID', 'NAME']);
	$table->addIndex('IX_B_MAIL_USER_LABEL_MAILBOX', ['MAILBOX_ID']);
});

$migration->table('b_mail_message_label')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LABEL_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('MAILBOX_ID')->notNull();
	$table->addPrimaryKeys(['LABEL_ID', 'MESSAGE_ID']);
	$table->addIndex('IX_B_MAIL_MESSAGE_LABEL_MSG', ['MAILBOX_ID', 'MESSAGE_ID']);
});

$migration->table('b_mail_shared_signature')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CREATED_BY')->notNull();
	$columns->int('OWNER_ID')->notNull()->default('0');
	$columns->varchar('SCOPE', 16)->notNull()->default('shared');
	$columns->text('SIGNATURE');
	$columns->int('LEGACY_ID');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_SIGNATURE_OWNER', ['OWNER_ID', 'SCOPE']);
	$table->addUniqueIndex('UX_MAIL_SIGNATURE_LEGACY', ['LEGACY_ID']);
});

$migration->table('b_mail_shared_signature_assignment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('SIGNATURE_ID')->notNull();
	$columns->varchar('TARGET_TYPE', 20)->notNull();
	$columns->int('TARGET_ID')->notNull()->default('0');
	$columns->varchar('TARGET_VALUE', 255);
	$columns->char('IS_FLAT', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_SSA_SIGNATURE', ['SIGNATURE_ID']);
	$table->addIndex('IX_MAIL_SSA_TARGET', ['TARGET_TYPE', 'TARGET_ID']);
});

$migration->table('b_mail_message_mark')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	// Mark kind, see MailMessageMarkTable::CODE_*
	$columns->tinyInt('CODE')->notNull();
	// Zero for mailbox-wide marks, see MailMessageMarkTable::SHARED_USER_ID
	$columns->int('USER_ID')->notNull()->default('0');
	$table->addPrimaryKeys(['MAILBOX_ID', 'MESSAGE_ID', 'CODE', 'USER_ID']);
	$table->addIndex('IX_MAIL_MSG_MARK_USER', ['USER_ID', 'CODE', 'MESSAGE_ID']);
	$table->addIndex('IX_MAIL_MSG_MARK_MESSAGE', ['MESSAGE_ID']);
});

$migration->table('b_mail_mailbox_source_generation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->varchar('OPERATION_ID', 64)->notNull();
	// PREPARING | ACTIVE | ARCHIVED, see MailboxSourceGenerationTable::STATUS_*
	$columns->varchar('STATUS', 16)->notNull();
	$columns->int('REVISION')->notNull()->default('0');
	// IMAP fields mirror b_mail_mailbox; SMTP fields store the sender connection projection
	$columns->int('SERVICE_ID')->notNull()->default('0');
	$columns->varchar('SERVICE_NAME', 255);
	$columns->varchar('EMAIL', 255);
	$columns->varchar('SERVER', 255);
	$columns->int('PORT');
	$columns->char('USE_TLS', 1)->notNull()->default('N');
	$columns->varchar('LOGIN', 255);
	$columns->varchar('PASSWORD', 255);
	$columns->varchar('SMTP_SERVER', 255);
	$columns->int('SMTP_PORT');
	$columns->varchar('SMTP_PROTOCOL', 8);
	$columns->varchar('SMTP_LOGIN', 255);
	$columns->varchar('SMTP_PASSWORD', 255);
	$columns->int('SMTP_LIMIT');
	$columns->mediumText('OPTIONS');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_ACTIVATED');
	$columns->datetime('DATE_ARCHIVED');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_MAIL_SRC_GEN_OPERATION', ['MAILBOX_ID', 'OPERATION_ID']);
	$table->addIndex('IX_MAIL_MAILBOX_SOURCE_GENERATION_STATUS', ['MAILBOX_ID', 'STATUS']);
});

$migration->table('b_mail_migration_operation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->varchar('OPERATION_ID', 64)->notNull();
	$columns->int('GENERATION_ID')->notNull()->default('0');
	$columns->varchar('EXEC_STATE', 16)->notNull();
	$columns->varchar('STAGE', 32)->notNull();
	$columns->char('SNAPSHOT_ACCEPTED', 1)->notNull()->default('N');
	$columns->char('SWITCH_AUTHORIZED', 1)->notNull()->default('N');
	$columns->char('CANCEL_REQUESTED', 1)->notNull()->default('N');
	$columns->char('AUTO_RETRY', 1)->notNull()->default('Y');
	$columns->char('PUBLICATION_PENDING', 1)->notNull()->default('N');
	$columns->char('NOTIFICATION_PENDING', 1)->notNull()->default('N');
	$columns->int('ATTEMPTS')->notNull()->default('0');
	$columns->int('STALLED_ATTEMPTS')->notNull()->default('0');
	$columns->datetime('NEXT_RUN');
	$columns->datetime('LAST_PROGRESS');
	$columns->varchar('LAST_ERROR_CODE', 64);
	$columns->varchar('ERROR_OWNER', 16);
	$columns->varchar('MIGRATOR_SERVICE', 255);
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_mail_migration_operation_pair', ['MAILBOX_ID', 'OPERATION_ID']);
	$table->addIndex('ix_mail_migration_operation_queue', ['EXEC_STATE', 'NEXT_RUN']);
	$table->addIndex('ix_mail_migration_operation_latest', ['MAILBOX_ID', 'ID']);
	$table->addIndex('ix_mail_migration_operation_publication', ['PUBLICATION_PENDING', 'ID']);
});

$migration->table('b_mail_message_fingerprint')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('GENERATION_ID')->notNull()->default('0');
	// MIGRATOR_ID | MESSAGE_ID | CONTENT, see MessageFingerprintTable::KIND_*
	$columns->varchar('KIND', 16)->notNull();
	$columns->int('ALGORITHM_VERSION')->notNull();
	// SHA-256 hex, no open message content is stored here
	$columns->char('HASH', 64)->notNull();
	$columns->char('IS_COMPLETE', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_MESSAGE_FINGERPRINT_LOOKUP', ['MAILBOX_ID', 'KIND', 'ALGORITHM_VERSION', 'HASH']);
	$table->addIndex('IX_MAIL_MESSAGE_FINGERPRINT_MESSAGE', ['MAILBOX_ID', 'MESSAGE_ID']);
	/*
		The sweep of a cancelled transfer asks this table for the rows of one generation and takes
		a page of them at a time. Without this index the two above narrow the scan to the mailbox
		only, and the fingerprints of the generation the mailbox keeps are walked again for every
		page taken - the smaller the page, the more times.
	*/
	$table->addIndex('IX_MAIL_MESSAGE_FINGERPRINT_GENERATION', ['MAILBOX_ID', 'GENERATION_ID', 'ID']);
});

$migration->table('b_mail_source_generation_match')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->int('GENERATION_ID')->notNull();
	$columns->varchar('UID_ID', 32)->notNull();
	$columns->varchar('OPERATION_ID', 64)->notNull();
	// MATCHED | NEW | AMBIGUOUS, see SourceGenerationMatchTable::STATE_*
	$columns->varchar('STATE', 16)->notNull();
	// Final local identity: the previous message for MATCHED, a new one for NEW/AMBIGUOUS
	$columns->int('MESSAGE_ID')->notNull()->default('0');
	$columns->int('NORMALIZER_VERSION')->notNull();
	$columns->varchar('REASON_CODE', 32);
	$columns->int('ATTEMPTS')->notNull()->default('0');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_UPDATE');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_MAIL_SRC_GEN_MATCH', ['GENERATION_ID', 'UID_ID']);
	/*
		The mailbox scoped index: the deletion of a mailbox addresses the journal by
		MAILBOX_ID alone, and the outcome distribution of a generation is answered by
		this index without reading a row.
	*/
	$table->addIndex('IX_MAIL_SOURCE_GENERATION_MATCH_MAILBOX', ['MAILBOX_ID', 'GENERATION_ID', 'STATE', 'ATTEMPTS']);
	/*
		A reset walks one generation by increasing journal ID in bounded pages. STATE in the
		index above breaks that order, so the cursor needs its own ordered tail.
	*/
	$table->addIndex('IX_MAIL_SOURCE_GENERATION_MATCH_RESET', ['MAILBOX_ID', 'GENERATION_ID', 'ID']);
	/*
		The cleanup after a deleted letter names its rows by the local identity, once per letter
		of a batch. The index above serves that lookup by MAILBOX_ID alone, so the journal of the
		mailbox was walked every time.
	*/
	$table->addIndex('IX_MAIL_SOURCE_GENERATION_MATCH_MESSAGE', ['MAILBOX_ID', 'MESSAGE_ID']);
});

$migration->table('b_mail_source_generation_tail_mark')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILBOX_ID')->notNull();
	$columns->int('GENERATION_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	// SHA-256 hex of the one time mark; the mark itself travels in the letter and is stored nowhere
	$columns->char('MARK_HASH', 64)->notNull();
	// PENDING | USED, see SourceGenerationTailMarkTable::STATE_*
	$columns->varchar('STATE', 16)->notNull();
	// The folder the letter was appended into, named the way a placement row names one
	$columns->char('DIR_MD5', 32)->notNull();
	/*
		The epoch of the folder and the number of the letter, learned at the reverse read: an
		append this route exists for is answered with neither of them.
	*/
	$columns->int('DIR_UIDV')->notNull()->default('0');
	$columns->int('MSG_UID')->notNull()->default('0');
	$columns->int('ATTEMPTS')->notNull()->default('0');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_UPDATE');
	$table->addPrimaryKey('ID');
	/*
		The mark is what the reverse read arrives with and the only thing it arrives with, so the
		hash alone addresses the row - and uniquely, which is what makes a one time mark one.
	*/
	$table->addUniqueIndex('UX_MAIL_SRC_GEN_TAIL_HASH', ['MARK_HASH']);
	/*
		And the lock the stage has no other form of: two passes over one remainder must not both
		append the same letter, and the pair is what the second of them collides with.
	*/
	$table->addUniqueIndex('UX_MAIL_SRC_GEN_TAIL_MSG', ['GENERATION_ID', 'MESSAGE_ID']);
	// The deletion of a mailbox addresses the records by MAILBOX_ID alone
	$table->addIndex('IX_MAIL_SOURCE_GENERATION_TAIL_MARK_MAILBOX', ['MAILBOX_ID', 'GENERATION_ID', 'STATE']);
});

// Queue storage of the module, see Internal\Async\Model\MessengerTable. Columns repeat
// b_main_messenger_message - the ORM map comes from the parent class and is not redeclared.
// Index names carry the module prefix on purpose: in PostgreSQL an index name is a schema-wide
// object, so reusing the names of the main table would collide with it.
$migration->table('b_mail_messenger_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('QUEUE_ID', 255)->notNull();
	$columns->varchar('ITEM_ID', 255);
	$columns->varchar('CLASS', 255)->notNull();
	$columns->text('PAYLOAD')->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$columns->int('TTL')->notNull();
	$columns->datetime('AVAILABLE_AT')->notNull();
	$columns->varchar('STATUS', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_MAIL_MSGR_QUEUE_STATUS_AVAIL', ['QUEUE_ID', 'STATUS', 'AVAILABLE_AT']);
	// Serves requeueStaleMessages(): STATUS plus the age of the row.
	$table->addIndex('IX_MAIL_MSGR_STATUS_UPDATED', ['STATUS', 'UPDATED_AT']);
});
