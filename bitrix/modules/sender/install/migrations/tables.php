<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_sender_list')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 100);
	$columns->varchar('CODE', 60);
	$columns->int('SORT')->notNull()->default('100');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sender_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->datetime('DATE_UPDATE');
	$columns->int('TYPE_ID')->notNull()->default('1');
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('NAME', 255);
	$columns->int('USER_ID');
	$columns->char('BLACKLISTED', 1)->notNull()->default('N');
	$columns->char('IS_READ', 1)->notNull()->default('N');
	$columns->char('IS_CLICK', 1)->notNull()->default('N');
	$columns->char('IS_UNSUB', 1)->notNull()->default('N');
	$columns->char('IS_SEND_SUCCESS', 1)->notNull()->default('N');
	$columns->char('CONSENT_STATUS', 1)->notNull()->default('N');
	$columns->int('CONSENT_REQUEST')->notNull()->default('0');
	$columns->varchar('IP', 15);
	$columns->int('AGENT')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UK_B_SENDER_CONTACT_TYPE_CODE', ['TYPE_ID', 'CODE']);
	$table->addIndex('IX_SENDER_CONTACT_BLACKLISTED_DATE_INSERT', ['BLACKLISTED', 'DATE_INSERT']);
});

$migration->table('b_sender_contact_list')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CONTACT_ID')->notNull();
	$columns->int('LIST_ID')->notNull();
	$table->addUniqueIndex('UK_SENDER_CONTACT_LIST', ['CONTACT_ID', 'LIST_ID']);
	$table->addIndex('IX_SENDER_CONTACT_LIST_LST_ID', ['LIST_ID']);
});

$migration->table('b_sender_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 30);
	$columns->varchar('NAME', 100);
	$columns->text('DESCRIPTION');
	$columns->int('SORT')->notNull()->default('100');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('HIDDEN', 1)->notNull()->default('N');
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->int('ADDRESS_COUNT')->notNull()->default('0');
	$columns->int('USE_COUNT')->notNull()->default('0');
	$columns->int('USE_COUNT_EXCLUDE')->notNull()->default('0');
	$columns->datetime('DATE_INSERT');
	$columns->datetime('DATE_UPDATE');
	$columns->datetime('DATE_USE');
	$columns->datetime('DATE_USE_EXCLUDE');
	$columns->varchar('STATUS', 1)->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UK_SENDER_GROUP_CODE', ['CODE']);
	$table->addIndex('IX_SENDER_GROUP_STATUS', ['STATUS']);
});

$migration->table('b_sender_group_connector')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->varchar('NAME', 100);
	$columns->longText('ENDPOINT');
	$columns->int('ADDRESS_COUNT')->notNull()->default('0');
	$columns->varchar('FILTER_ID', 256);
	$table->addIndex('IX_SENDER_GROUP_CONNECTOR', ['GROUP_ID']);
});

$migration->table('b_sender_group_counter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->int('TYPE_ID')->notNull();
	$columns->int('CNT')->notNull()->default('0');
	$table->addUniqueIndex('UK_SENDER_GROUP_COUNTER', ['GROUP_ID', 'TYPE_ID']);
});

$migration->table('b_sender_mailing')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT');
	$columns->varchar('NAME', 100);
	$columns->text('DESCRIPTION');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('SITE_ID', 2)->notNull();
	$columns->int('SORT')->notNull()->default('100');
	$columns->char('IS_PUBLIC', 1)->notNull()->default('Y');
	$columns->char('TRACK_CLICK', 1)->notNull()->default('N');
	$columns->text('TRIGGER_FIELDS');
	$columns->varchar('EMAIL_FROM', 255);
	$columns->char('IS_TRIGGER', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sender_mailing_chain')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MAILING_ID')->notNull();
	$columns->char('STATUS', 1)->notNull();
	$columns->int('POSTING_ID');
	$columns->int('CREATED_BY');
	$columns->int('UPDATED_BY');
	$columns->int('PARENT_ID');
	$columns->varchar('MESSAGE_CODE', 20)->notNull()->default('mail');
	$columns->varchar('MESSAGE_ID', 20)->notNull();
	$columns->char('IS_TRIGGER', 1)->notNull()->default('N');
	$columns->char('IS_ADS', 1)->notNull()->default('N');
	$columns->datetime('DATE_INSERT');
	$columns->datetime('DATE_UPDATE');
	$columns->int('TIME_SHIFT')->notNull()->default('0');
	$columns->datetime('LAST_EXECUTED');
	$columns->datetime('AUTO_SEND_TIME');
	$columns->varchar('TITLE', 255);
	$columns->varchar('EMAIL_FROM', 255);
	$columns->varchar('SUBJECT', 255);
	$columns->longText('MESSAGE');
	$columns->varchar('PRIORITY', 60);
	$columns->varchar('LINK_PARAMS', 255);
	$columns->varchar('TEMPLATE_TYPE', 30);
	$columns->varchar('TEMPLATE_ID', 60);
	$columns->char('REITERATE', 1)->notNull()->default('N');
	$columns->varchar('MONTHS_OF_YEAR', 100);
	$columns->varchar('DAYS_OF_MONTH', 100);
	$columns->varchar('DAYS_OF_WEEK', 15);
	$columns->varchar('TIMES_OF_DAY', 255);
	$columns->text('ERROR_MESSAGE');
	$columns->longText('SEARCH_CONTENT');
	$columns->char('WAITING_RECIPIENT', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_MAILING_CHAIN_MAILING', ['MAILING_ID', 'STATUS']);
	$table->addIndex('IX_SENDER_MAILING_CHAIN_REITERATE', ['REITERATE', 'STATUS']);
	$table->addIndex('IX_SENDER_MAILING_CHAIN_POSTING_ID', ['POSTING_ID']);
	$table->addFulltextIndex('IXF_B_SENDER_MAILING_CHAIN_1', ['SEARCH_CONTENT']);
});

$migration->table('b_sender_mailing_chain_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CHAIN_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->int('INCLUDE')->notNull()->default('0');
	$table->addUniqueIndex('UK_SENDER_MAILING_CH_GROUP', ['CHAIN_ID', 'GROUP_ID', 'INCLUDE']);
});

$migration->table('b_sender_mailing_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MAILING_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->int('INCLUDE')->notNull()->default('0');
	$table->addUniqueIndex('UK_SENDER_MAILING_GROUP', ['MAILING_ID', 'GROUP_ID', 'INCLUDE']);
});

$migration->table('b_sender_mailing_subscription')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MAILING_ID')->notNull();
	$columns->int('CONTACT_ID')->notNull();
	$columns->datetime('DATE_INSERT');
	$columns->char('IS_UNSUB', 1)->notNull()->default('N');
	$table->addPrimaryKeys(['MAILING_ID', 'CONTACT_ID', 'IS_UNSUB']);
});

$migration->table('b_sender_posting')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_UPDATE');
	$columns->int('MAILING_ID')->notNull();
	$columns->int('MAILING_CHAIN_ID')->notNull();
	$columns->char('STATUS', 1)->notNull()->default('D');
	$columns->datetime('DATE_SEND');
	$columns->datetime('DATE_PAUSE');
	$columns->datetime('DATE_SENT');
	$columns->datetime('DATE_CREATE');
	$columns->int('COUNT_SEND_ALL')->notNull()->default('0');
	$columns->int('COUNT_SEND_NONE')->notNull()->default('0');
	$columns->int('COUNT_SEND_ERROR')->notNull()->default('0');
	$columns->int('COUNT_SEND_SUCCESS')->notNull()->default('0');
	$columns->int('COUNT_SEND_DENY')->notNull()->default('0');
	$columns->int('COUNT_READ')->notNull()->default('0');
	$columns->int('COUNT_CLICK')->notNull()->default('0');
	$columns->int('COUNT_UNSUB')->notNull()->default('0');
	$columns->char('CONSENT_SUPPORT', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_POSTING_MAILING_CHAIN', ['MAILING_ID', 'STATUS']);
	$table->addIndex('IX_SENDER_POSTING_MAILING', ['MAILING_CHAIN_ID', 'STATUS']);
});

$migration->table('b_sender_posting_recipient')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('POSTING_ID')->notNull();
	$columns->int('CONTACT_ID')->notNull();
	$columns->char('STATUS', 1)->notNull();
	$columns->datetime('DATE_SENT');
	$columns->int('USER_ID');
	$columns->datetime('DATE_DENY');
	$columns->datetime('DATE_UPDATE')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$columns->longText('FIELDS');
	$columns->int('ROOT_ID');
	$columns->char('IS_READ', 1)->notNull()->default('N');
	$columns->char('IS_CLICK', 1)->notNull()->default('N');
	$columns->char('IS_UNSUB', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UK_SENDER_POSTING_RCPNT', ['POSTING_ID', 'CONTACT_ID']);
	$table->addIndex('IX_SENDER_POSTING_RECIP_1', ['POSTING_ID', 'STATUS']);
	$table->addIndex('IX_B_SENDER_POSTING_RECIPIENT_CONTACT_ID', ['CONTACT_ID']);
	$table->addIndex('IX_B_SENDER_POSTING_RECIPIENT_CONTACT_ID_STATUS', ['CONTACT_ID', 'STATUS']);
});

$migration->table('b_sender_posting_read')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('POSTING_ID')->notNull();
	$columns->int('RECIPIENT_ID');
	$columns->datetime('DATE_INSERT');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_POSTING_READ', ['POSTING_ID', 'RECIPIENT_ID']);
	$table->addIndex('ix_b_sender_posting_read_recip_id', ['RECIPIENT_ID']);
});

$migration->table('b_sender_posting_click')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('POSTING_ID')->notNull();
	$columns->int('RECIPIENT_ID');
	$columns->datetime('DATE_INSERT');
	$columns->varchar('URL', 2000);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_POSTING_CLICK', ['POSTING_ID', 'RECIPIENT_ID']);
	$table->addIndex('IX_SENDER_POSTING_CLICK_RCPID', ['RECIPIENT_ID']);
});

$migration->table('b_sender_posting_unsub')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('RECIPIENT_ID')->notNull();
	$columns->int('POSTING_ID')->notNull();
	$columns->datetime('DATE_INSERT');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_POSTING_UNSUB', ['POSTING_ID', 'RECIPIENT_ID']);
});

$migration->table('b_sender_preset_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('NAME', 255)->notNull();
	$columns->longText('CONTENT');
	$columns->int('USE_COUNT')->notNull()->default('0');
	$columns->datetime('DATE_INSERT');
	$columns->datetime('DATE_USE');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sender_mailing_attachment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CHAIN_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$table->addPrimaryKeys(['CHAIN_ID', 'FILE_ID']);
});

$migration->table('b_sender_mailing_trigger')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MAILING_CHAIN_ID')->notNull();
	$columns->int('IS_TYPE_START')->notNull()->default('1');
	$columns->varchar('NAME', 255);
	$columns->varchar('EVENT', 255)->notNull();
	$columns->text('ENDPOINT')->notNull();
});

$migration->table('b_sender_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_sender_message_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('TYPE', 20)->notNull();
	$columns->longText('VALUE');
	$table->addPrimaryKeys(['MESSAGE_ID', 'CODE']);
});

$migration->table('b_sender_call_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('CALL_ID', 255)->notNull();
	$columns->int('RECIPIENT_ID')->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$table->addPrimaryKeys(['CALL_ID', 'RECIPIENT_ID']);
});

$migration->table('b_sender_agreement')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('EMAIL', 255);
	$columns->datetime('DATE')->notNull();
	$columns->varchar('IP_ADDRESS', 39)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_sender_abuse')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->text('TEXT');
	$columns->int('CONTACT_ID')->unsigned();
	$columns->int('CONTACT_TYPE_ID')->unsigned();
	$columns->varchar('CONTACT_CODE', 255)->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_ABUSE_DATE_INSERT', ['DATE_INSERT']);
});

$migration->table('b_sender_counter_daily')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->date('DATE_STAT')->notNull();
	$columns->int('SENT_CNT')->notNull()->default('0');
	$columns->int('TEST_SENT_CNT')->notNull()->default('0');
	$columns->int('ERROR_CNT')->notNull()->default('0');
	$columns->int('ABUSE_CNT')->notNull()->default('0');
	$table->addPrimaryKey('DATE_STAT');
});

$migration->table('b_sender_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 20)->notNull();
	$columns->varchar('ENTITY_ID', 10)->notNull();
	$columns->varchar('LAST_ITEM', 255)->notNull();
	$table->addPrimaryKeys(['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_sender_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('DEAL_CATEGORY_ID')->default('-1');
	$columns->varchar('XML_ID', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_ROLE_XML_ID', ['XML_ID']);
});

$migration->table('b_sender_role_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('ENTITY', 50)->notNull();
	$columns->varchar('ACTION', 50)->notNull();
	$columns->char('PERMISSION', 1);
	$table->addPrimaryKey('ID');
});

$migration->table('b_sender_role_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_ROLE_ACC_ROLE_ID', ['ROLE_ID']);
});

$migration->table('b_sender_counter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('CODE', 25)->notNull();
	$columns->int('VALUE')->notNull()->default('0');
	$columns->datetime('DATE_UPDATE')->notNull();
	$table->addPrimaryKey('CODE');
});

$migration->table('b_sender_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('RELATION', 8)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_ROLE_REL_ROLE_ID', ['ROLE_ID']);
	$table->addIndex('IX_SENDER_ROLE_REL_RELATION', ['RELATION']);
});

$migration->table('b_sender_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('PERMISSION_ID', 32)->notNull()->default('0');
	$columns->tinyInt('VALUE')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_SENDER_PERMISSION_ROLE_ID_PERMISSION_ID', ['ROLE_ID', 'PERMISSION_ID']);
});

$migration->table('b_sender_group_deal_category')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->unsigned()->notNull();
	$columns->int('DEAL_CATEGORY_ID')->unsigned()->notNull();
	$table->addIndex('IX_SENDER_GROUP_CATEGORY_GROUP_ID', ['GROUP_ID']);
	$table->addIndex('IX_SENDER_GROUP_CATEGORY_DEAL_CATEGORY_ID', ['DEAL_CATEGORY_ID']);
});

$migration->table('b_sender_posting_thread')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('THREAD_ID')->unsigned()->notNull();
	$columns->int('POSTING_ID')->unsigned()->notNull();
	$columns->varchar('STATUS', 1)->notNull()->default('N');
	$columns->text('THREAD_TYPE')->notNull();
	$columns->datetime('EXPIRE_AT')->notNull();
	$table->addUniqueIndex('IX_SENDER_THREAD_INFO_POSTING_ID_THREAD_ID', ['THREAD_ID', 'POSTING_ID']);
});

$migration->table('b_sender_message_utm')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MESSAGE_ID')->unsigned()->notNull();
	$columns->varchar('CODE', 70)->notNull();
	$columns->varchar('VALUE', 512)->notNull();
	$table->addUniqueIndex('IX_SENDER_MESSAGE_UTM_MESSAGE_ID_CODE', ['MESSAGE_ID', 'CODE']);
	$table->addIndex('IX_SENDER_MESSAGE_UTM_CODE', ['CODE']);
});

$migration->table('b_sender_timeline_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->autoincrement();
	$columns->int('POSTING_ID')->unsigned()->notNull();
	$columns->int('RECIPIENT_ID')->unsigned();
	$columns->longText('FIELDS');
	$columns->int('ENTITY_ID')->unsigned();
	$columns->int('CONTACT_TYPE_ID')->unsigned();
	$columns->varchar('CONTACT_CODE', 255)->notNull();
	$columns->varchar('STATUS', 1)->notNull()->default('N');
	$columns->datetime('DATE_INSERT')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_sender_group_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->autoincrement();
	$columns->int('GROUP_ID')->notNull();
	$columns->datetime('DATE_INSERT')->notNull()->defaultCurrentTimestamp();
	$columns->varchar('FILTER_ID', 256)->notNull();
	$columns->int('CRM_ENTITY_ID');
	$columns->int('CRM_ENTITY_TYPE_ID');
	$columns->varchar('NAME', 511);
	$columns->varchar('CRM_ENTITY_TYPE', 128);
	$columns->int('CONTACT_ID');
	$columns->int('COMPANY_ID');
	$columns->varchar('EMAIL', 511);
	$columns->varchar('IM', 511);
	$columns->varchar('PHONE', 128);
	$columns->varchar('HAS_EMAIL', 1);
	$columns->varchar('HAS_IMOL', 1);
	$columns->varchar('HAS_PHONE', 1);
	$columns->int('SENDER_TYPE_ID');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_GROUP_DATA_GROUP_ID_FILTER_ID', ['GROUP_ID', 'FILTER_ID']);
});

$migration->table('b_sender_group_state')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('GROUP_ID')->notNull();
	$columns->datetime('DATE_INSERT')->defaultCurrentTimestamp();
	$columns->varchar('FILTER_ID', 256)->notNull();
	$columns->int('STATE');
	$columns->longText('ENDPOINT');
	$columns->int('OFFSET');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_GROUP_STATE_GROUP_ID_FILTER_ID', ['GROUP_ID', 'FILTER_ID']);
	$table->addIndex('IX_SENDER_GROUP_STATE_STATE', ['STATE']);
});

$migration->table('b_sender_group_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->datetime('DATE_INSERT')->notNull()->defaultCurrentTimestamp();
	$columns->int('GROUP_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('TYPE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_GROUP_QUEUE_TYPE_ENTITY_ID_GROUP_ID', ['TYPE', 'ENTITY_ID', 'GROUP_ID']);
});

$migration->table('b_sender_group_thread')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('THREAD_ID')->unsigned()->notNull();
	$columns->int('GROUP_STATE_ID')->unsigned()->notNull();
	$columns->varchar('STATUS', 1)->notNull()->default('N');
	$columns->int('STEP')->unsigned()->notNull()->default('0');
	$columns->text('THREAD_TYPE')->notNull();
	$columns->datetime('EXPIRE_AT')->notNull();
	$table->addUniqueIndex('IX_SENDER_GROUP_THREAD_INFO_THREAD_ID_GROUP_STATE', ['THREAD_ID', 'GROUP_STATE_ID']);
});

$migration->table('b_sender_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->autoincrement();
	$columns->int('FILE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_FILE_ENTITY_TYPE_ENTITY_ID', ['ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('IX_SENDER_FILE_FILE_ID', ['FILE_ID']);
});

$migration->table('b_sender_file_info')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull();
	$columns->varchar('FILE_NAME', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SENDER_UNIQUE_FILES_FILE_NAME', ['FILE_NAME']);
});

