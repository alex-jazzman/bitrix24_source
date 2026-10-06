<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_sign_blank')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('EXTERNAL_ID');
	$columns->varchar('HOST', 255);
	$columns->text('FILE_ID')->notNull();
	$columns->text('STATUS');
	$columns->char('CONVERTED', 1)->notNull()->default('N');
	$columns->tinyInt('SCENARIO')->unsigned()->notNull()->default('0');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$columns->tinyInt('FOR_TEMPLATE')->notNull()->default('0');
	$columns->tinyInt('HAS_PLACEHOLDERS')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_EXTERNAL_HOST', ['EXTERNAL_ID', 'HOST']);
});

$migration->table('b_sign_document')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TITLE', 255);
	$columns->char('HASH', 19);
	$columns->char('SEC_CODE', 20);
	$columns->varchar('HOST', 255);
	$columns->int('BLANK_ID')->notNull();
	$columns->tinyInt('SCENARIO')->unsigned();
	$columns->varchar('UID', 20);
	$columns->varchar('STATUS', 10);
	$columns->varchar('ENTITY_TYPE', 20)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->text('META');
	$columns->char('PROCESSING_STATUS', 1)->notNull()->default('B');
	$columns->text('PROCESSING_ERROR');
	$columns->char('LANG_ID', 2);
	$columns->int('RESULT_FILE_ID');
	$columns->tinyInt('VERSION')->unsigned()->default('1');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->bigInt('GROUP_ID')->unsigned();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$columns->datetime('DATE_SIGN');
	$columns->int('COMPANY_ENTITY_ID')->unsigned();
	$columns->varchar('COMPANY_UID', 32);
	$columns->int('REPRESENTATIVE_ID');
	$columns->int('PARTIES')->notNull()->default('2');
	$columns->varchar('EXTERNAL_ID', 255);
	$columns->tinyInt('SCHEME')->unsigned()->default('0');
	$columns->varchar('REGION_DOCUMENT_TYPE', 255);
	$columns->int('STOPPED_BY_ID');
	$columns->datetime('EXTERNAL_DATE_CREATE');
	$columns->varchar('PROVIDER_CODE', 255);
	$columns->bigInt('TEMPLATE_ID')->unsigned();
	$columns->int('CHAT_ID');
	$columns->int('CREATED_FROM_DOCUMENT_ID');
	$columns->tinyInt('INITIATED_BY_TYPE')->default('0');
	$columns->int('HCMLINK_COMPANY_ID')->unsigned();
	$columns->datetime('DATE_STATUS_CHANGED');
	$columns->smallInt('EXTERNAL_ID_SOURCE_TYPE')->default('0');
	$columns->smallInt('EXTERNAL_DATE_CREATE_SOURCE_TYPE')->default('0');
	$columns->int('HCMLINK_DATE_SETTING_ID')->unsigned();
	$columns->int('HCMLINK_EXTERNAL_ID_SETTING_ID')->unsigned();
	$columns->int('HCMLINK_DOCUMENT_TYPE_SETTING_ID')->unsigned();
	$columns->datetime('DATE_SIGN_UNTIL');
	$columns->varchar('CONFIGURED_DATE_FORMAT', 50);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_ENTITY', ['ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('IX_B_HOST', ['HOST']);
	$table->addIndex('IX_B_UID', ['UID']);
	$table->addIndex('IX_B_COMPANY', ['COMPANY_UID']);
	$table->addIndex('IX_B_BLANK_ID', ['BLANK_ID']);
	$table->addIndex('IX_B_GROUP_ID', ['GROUP_ID']);
	$table->addIndex('IX_B_CREATED_BY_ID_DATE_CREATE', ['CREATED_BY_ID', 'DATE_CREATE']);
	$table->addIndex('IX_B_TEMPLATE_ID_INITIATED_BY_TYPE', ['TEMPLATE_ID', 'INITIATED_BY_TYPE']);
	$table->addIndex('IX_B_SIGN_DOCUMENT_REPRESENTATIVE_ID', ['REPRESENTATIVE_ID']);
	$table->addUniqueIndex('UK_SIGN_DOCUMENT_HASH', ['HASH']);
});

$migration->table('b_sign_member')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('DOCUMENT_ID')->unsigned()->notNull();
	$columns->bigInt('CONTACT_ID')->unsigned()->notNull();
	$columns->int('PART')->notNull();
	$columns->char('HASH', 32)->notNull();
	$columns->char('SIGNED', 1)->notNull()->default('N');
	$columns->char('VERIFIED', 1)->notNull()->default('N');
	$columns->char('MUTE', 1)->notNull()->default('N');
	$columns->varchar('COMMUNICATION_TYPE', 20);
	$columns->varchar('COMMUNICATION_VALUE', 100);
	$columns->text('USER_DATA');
	$columns->text('META');
	$columns->int('SIGNATURE_FILE_ID');
	$columns->int('STAMP_FILE_ID');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$columns->datetime('DATE_SIGN');
	$columns->datetime('DATE_DOC_DOWNLOAD');
	$columns->datetime('DATE_DOC_VERIFY');
	$columns->varchar('IP', 15);
	$columns->varchar('TIME_ZONE_NAME', 50);
	$columns->int('TIME_ZONE_OFFSET');
	$columns->bigInt('ENTITY_ID')->unsigned();
	$columns->varchar('ENTITY_TYPE', 20);
	$columns->bigInt('PRESET_ID')->unsigned();
	$columns->tinyInt('ROLE');
	$columns->tinyInt('CONFIGURED');
	$columns->tinyInt('REMINDER_TYPE')->default('0');
	$columns->datetime('REMINDER_LAST_SEND_DATE');
	$columns->datetime('REMINDER_PLANNED_NEXT_SEND_DATE');
	$columns->tinyInt('REMINDER_COMPLETED')->default('0');
	$columns->datetime('REMINDER_START_DATE');
	$columns->int('EMPLOYEE_ID');
	$columns->int('HCMLINK_JOB_ID')->unsigned();
	$columns->datetime('DATE_SEND');
	$columns->datetime('DATE_STATUS_CHANGED');
	// Reversible annulment mark of a single signing (PRD-kedo-annulment-signing-chat-2026-07-10).
	$columns->tinyInt('ANNULLED')->notNull()->default('0');
	$columns->int('ANNULLED_BY_ID');
	$columns->datetime('DATE_ANNULLED');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_DOCUMENT_ID', ['DOCUMENT_ID']);
	$table->addIndex('IX_B_HASH', ['HASH']);
	$table->addIndex('IX_B_SIGN_MEMBER_ENTITY_ROLE', ['ENTITY_ID', 'ENTITY_TYPE', 'ROLE']);
});

$migration->table('b_sign_block')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 50)->notNull();
	$columns->varchar('TYPE', 20);
	$columns->int('BLANK_ID')->notNull();
	$columns->text('BLANK_POSITION')->notNull();
	$columns->text('BLANK_STYLE');
	$columns->text('BLANK_DATA')->notNull();
	$columns->int('PART')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$columns->tinyInt('ROLE');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_BLANK_ID', ['BLANK_ID']);
	$table->addIndex('IX_B_PART', ['BLANK_ID', 'PART']);
});

$migration->table('b_sign_integration_form')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('BLANK_ID')->notNull();
	$columns->int('PART')->notNull();
	$columns->int('FORM_ID')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_BLANK_PART', ['BLANK_ID', 'PART']);
});

$migration->table('b_sign_documentgenerator_blank')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('BLANK_ID')->unsigned()->notNull();
	$columns->bigInt('DOCUMENT_GENERATOR_TEMPLATE_ID')->unsigned()->notNull();
	$columns->varchar('INITIATOR', 1024);
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('DOCUMENT_GENERATOR_TEMPLATE_ID', ['DOCUMENT_GENERATOR_TEMPLATE_ID']);
});

$migration->table('b_sign_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('PERMISSION_ID', 32)->notNull()->default('');
	$columns->varchar('VALUE', 32)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_SIGN_PERMISSION_ROLE_ID_PERMISSION_ID', ['ROLE_ID', 'PERMISSION_ID']);
});

$migration->table('b_sign_service_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('USER_ID')->unsigned()->notNull();
	$columns->varchar('UID', 32)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('USER_ID');
	$table->addUniqueIndex('IX_B_SIGNS_B2E_USERS_UID', ['UID']);
});

$migration->table('b_sign_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->tinyInt('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->bigInt('ENTITY_ID')->unsigned()->notNull();
	$columns->tinyInt('CODE')->unsigned()->notNull();
	$columns->int('FILE_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_SIGN_FILE_ENTITY_TYPE_ENTITY_ID_CODE', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'CODE']);
});

$migration->table('b_sign_blank_resource')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('BLANK_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_sign_legal_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('DOCUMENT_ID')->unsigned()->notNull();
	$columns->varchar('DOCUMENT_UID', 20)->notNull();
	$columns->bigInt('MEMBER_ID')->unsigned();
	$columns->varchar('MEMBER_UID', 32);
	$columns->varchar('CODE', 50)->notNull();
	$columns->text('DESCRIPTION')->notNull();
	$columns->bigInt('USER_ID')->unsigned();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SIGNSAFE_LEGAL_LOG_DOCUMENT_ID', ['DOCUMENT_ID']);
});

$migration->table('b_sign_document_required_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('DOCUMENT_ID')->unsigned()->notNull();
	$columns->varchar('TYPE', 20)->notNull();
	$columns->tinyInt('ROLE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SIGN_REQUIRED_FIELDS_DOCUMENT_ID', ['DOCUMENT_ID']);
});

$migration->table('b_sign_document_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('CHAT_ID')->unsigned()->notNull();
	$columns->bigInt('DOCUMENT_ID')->unsigned()->notNull();
	$columns->tinyInt('TYPE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SIGN_CHAT_DOCUMENT_ID', ['DOCUMENT_ID']);
});

$migration->table('b_sign_document_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->char('UID', 32)->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->tinyInt('STATUS')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID');
	$columns->timestamp('DATE_CREATE')->notNull();
	$columns->timestamp('DATE_MODIFY');
	$columns->tinyInt('VISIBILITY')->notNull()->default('0');
	$columns->bigInt('FOLDER_ID');
	$columns->tinyInt('HIDDEN')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UK_B_SIGN_DOCUMENT_TEMPLATE_UID', ['UID']);
	$table->addIndex('IX_B_SIGN_DOCUMENT_TEMPLATE_FOLDER_ID', ['FOLDER_ID']);
	$table->addIndex('IX_B_SIGN_DOCUMENT_TEMPLATE_HIDDEN', ['HIDDEN']);
	$table->addIndex('IX_B_SIGN_DOCUMENT_TEMPLATE_TITLE_HIDDEN', ['TITLE', 'HIDDEN']);
	$table->addIndex('IX_B_SIGN_DOCUMENT_TEMPLATE_STATUS_VISIBILITY', ['STATUS', 'VISIBILITY']);
});

$migration->table('b_sign_document_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sign_node_sync')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->bigInt('NODE_ID')->unsigned()->notNull();
	$columns->tinyInt('IS_FLAT')->unsigned()->notNull();
	$columns->tinyInt('STATUS')->unsigned()->notNull();
	$columns->int('PAGE')->unsigned()->notNull();
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_SIGN_NODE_SYNC_DOCUMENT_NODE', ['DOCUMENT_ID', 'NODE_ID', 'IS_FLAT']);
	$table->addIndex('IX_B_SIGN_NODE_SYNC_DOCUMENT_STATUS', ['DOCUMENT_ID', 'STATUS']);
});

$migration->table('b_sign_member_node')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('MEMBER_ID')->unsigned()->notNull();
	$columns->bigInt('NODE_SYNC_ID')->unsigned()->notNull();
	$columns->bigInt('USER_ID')->unsigned()->notNull();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->datetime('DATE_CREATE');
	$table->addPrimaryKeys(['MEMBER_ID', 'NODE_SYNC_ID']);
	$table->addIndex('IX_B_SIGN_MEMBER_NODE_DOCUMENT_NODE', ['DOCUMENT_ID', 'NODE_SYNC_ID']);
});

$migration->table('b_sign_field_value')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('MEMBER_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 255)->notNull();
	$columns->text('VALUE')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UK_B_SIGN_FIELD_VALUE_FIELD_NAME_MEMBER_ID', ['FIELD_NAME', 'MEMBER_ID']);
});

$migration->table('b_sign_document_template_folder')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE')->notNull();
	$columns->tinyInt('VISIBILITY')->notNull()->default('0');
	$columns->tinyInt('STATUS')->notNull();
	$columns->int('MODIFIED_BY_ID');
	$columns->timestamp('DATE_MODIFY');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sign_document_template_folder_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('ENTITY_ID')->notNull();
	$columns->bigInt('PARENT_ID')->notNull()->default('0');
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->bigInt('DEPTH_LEVEL')->notNull()->default('0');
	$columns->bigInt('CREATED_BY_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UK_B_SIGN_DOCUMENT_TEMPLATE_FOLDER_RELATION', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_B_SIGN_DOCUMENT_TEMPLATE_FOLDER_RELATION_PARENT_ENTITY_TYPE', ['PARENT_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_B_SIGN_DOCUMENT_TEMPLATE_FOLDER_RELATION_ENTITY_TYPE', ['ENTITY_TYPE']);
});

$migration->table('b_sign_document_folder')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('VISIBILITY')->notNull();
	$columns->int('STATUS')->notNull();
	$columns->int('MODIFIED_BY_ID');
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SIGN_DOC_FOLDER_CREATED_BY', ['CREATED_BY_ID']);
});

$migration->table('b_sign_document_folder_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->bigInt('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$columns->int('PARENT_ID')->notNull()->default('0');
	$columns->int('DEPTH_LEVEL')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_SIGN_DOC_FOLDER_REL_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_B_SIGN_DOC_FOLDER_REL_PARENT', ['PARENT_ID', 'ENTITY_TYPE', 'DEPTH_LEVEL']);
	$table->addIndex('IX_B_SIGN_DOC_FOLDER_REL_TYPE_DEPTH', ['ENTITY_TYPE', 'DEPTH_LEVEL']);
});

$migration->table('b_sign_signers_list')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->bigInt('CREATED_BY_ID')->notNull();
	$columns->bigInt('MODIFIED_BY_ID');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sign_signers_list_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LIST_ID')->unsigned()->notNull();
	$columns->bigInt('USER_ID')->notNull();
	$columns->bigInt('CREATED_BY_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKeys(['LIST_ID', 'USER_ID']);
});

$migration->table('b_sign_signers_list_user_option')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LIST_ID')->unsigned()->notNull();
	$columns->bigInt('USER_ID')->notNull();
	$columns->int('OPTION_CODE')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKeys(['LIST_ID', 'USER_ID', 'OPTION_CODE']);
	$table->addIndex('IX_B_SIGN_SLUO_USER_OPTION', ['USER_ID', 'OPTION_CODE', 'LIST_ID']);
});
