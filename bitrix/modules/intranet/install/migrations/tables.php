<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_intranet_sharepoint')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('SP_LIST_ID', 32)->notNull();
	$columns->varchar('SP_URL', 255)->notNull();
	$columns->varchar('SP_AUTH_USER', 50)->default('');
	$columns->varchar('SP_AUTH_PASS', 50)->default('');
	$columns->datetime('SYNC_DATE');
	$columns->int('SYNC_PERIOD')->default('86400');
	$columns->int('SYNC_ERRORS')->default('0');
	$columns->varchar('SYNC_LAST_TOKEN', 100)->default('');
	$columns->varchar('SYNC_PAGING', 100)->default('');
	$columns->varchar('HANDLER_MODULE', 50)->default('');
	$columns->varchar('HANDLER_CLASS', 100)->default('');
	$columns->char('PRIORITY', 1)->default('B');
	$table->addPrimaryKey('IBLOCK_ID');
});

$migration->table('b_intranet_sharepoint_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('FIELD_ID', 50)->notNull();
	$columns->varchar('SP_FIELD', 50)->notNull();
	$columns->varchar('SP_FIELD_TYPE', 50)->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKeys(['IBLOCK_ID', 'FIELD_ID']);
});

$migration->table('b_intranet_sharepoint_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('SP_METHOD', 100)->notNull();
	$columns->text('SP_METHOD_PARAMS');
	$columns->text('CALLBACK');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_intranet_sharepoint_queue_1', ['IBLOCK_ID']);
});

$migration->table('b_intranet_sharepoint_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('ELEMENT_ID')->notNull();
	$columns->int('VERSION')->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ui_b_intranet_sharepoint_log', ['IBLOCK_ID', 'ELEMENT_ID']);
});

$migration->table('b_rating_subordinate')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('RATING_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->decimal('VOTES', 18, 4)->default('0.0000');
	$table->addPrimaryKey('ID');
	$table->addIndex('RATING_ID', ['RATING_ID', 'ENTITY_ID']);
});

$migration->table('b_intranet_ustat_hour')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('HOUR')->notNull();
	$columns->smallInt('TOTAL')->unsigned()->notNull()->default('0');
	$columns->smallInt('SOCNET')->unsigned()->notNull()->default('0');
	$columns->smallInt('LIKES')->unsigned()->notNull()->default('0');
	$columns->smallInt('TASKS')->unsigned()->notNull()->default('0');
	$columns->smallInt('IM')->unsigned()->notNull()->default('0');
	$columns->smallInt('DISK')->unsigned()->notNull()->default('0');
	$columns->smallInt('MOBILE')->unsigned()->notNull()->default('0');
	$columns->smallInt('CRM')->unsigned()->notNull()->default('0');
	$table->addPrimaryKeys(['USER_ID', 'HOUR']);
	$table->addIndex('HOUR', ['HOUR']);
});

$migration->table('b_intranet_ustat_day')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->date('DAY')->notNull();
	$columns->smallInt('TOTAL')->unsigned()->notNull()->default('0');
	$columns->smallInt('SOCNET')->unsigned()->notNull()->default('0');
	$columns->smallInt('LIKES')->unsigned()->notNull()->default('0');
	$columns->smallInt('TASKS')->unsigned()->notNull()->default('0');
	$columns->smallInt('IM')->unsigned()->notNull()->default('0');
	$columns->smallInt('DISK')->unsigned()->notNull()->default('0');
	$columns->smallInt('MOBILE')->unsigned()->notNull()->default('0');
	$columns->smallInt('CRM')->unsigned()->notNull()->default('0');
	$table->addPrimaryKeys(['USER_ID', 'DAY']);
	$table->addIndex('DAY', ['DAY']);
});

$migration->table('b_intranet_dstat_hour')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DEPT_ID')->notNull();
	$columns->datetime('HOUR')->notNull();
	$columns->mediumInt('TOTAL')->unsigned()->notNull()->default('0');
	$columns->mediumInt('SOCNET')->unsigned()->notNull()->default('0');
	$columns->mediumInt('LIKES')->unsigned()->notNull()->default('0');
	$columns->mediumInt('TASKS')->unsigned()->notNull()->default('0');
	$columns->mediumInt('IM')->unsigned()->notNull()->default('0');
	$columns->mediumInt('DISK')->unsigned()->notNull()->default('0');
	$columns->mediumInt('MOBILE')->unsigned()->notNull()->default('0');
	$columns->mediumInt('CRM')->unsigned()->notNull()->default('0');
	$table->addPrimaryKeys(['DEPT_ID', 'HOUR']);
	$table->addIndex('HOUR', ['HOUR']);
});

$migration->table('b_intranet_dstat_day')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DEPT_ID')->notNull();
	$columns->date('DAY')->notNull();
	$columns->mediumInt('ACTIVE_USERS')->unsigned()->notNull()->default('0');
	$columns->tinyInt('INVOLVEMENT')->unsigned()->notNull()->default('0');
	$columns->int('TOTAL')->unsigned()->notNull()->default('0');
	$columns->mediumInt('SOCNET')->unsigned()->notNull()->default('0');
	$columns->mediumInt('LIKES')->unsigned()->notNull()->default('0');
	$columns->mediumInt('TASKS')->unsigned()->notNull()->default('0');
	$columns->mediumInt('IM')->unsigned()->notNull()->default('0');
	$columns->mediumInt('DISK')->unsigned()->notNull()->default('0');
	$columns->mediumInt('MOBILE')->unsigned()->notNull()->default('0');
	$columns->mediumInt('CRM')->unsigned()->notNull()->default('0');
	$table->addPrimaryKeys(['DEPT_ID', 'DAY']);
	$table->addIndex('DAY', ['DAY']);
});

$migration->table('b_intranet_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 20)->notNull();
	$columns->varchar('ENTITY_ID', 10)->notNull();
	$columns->varchar('LAST_ITEM', 255)->notNull();
	$table->addPrimaryKeys(['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_intranet_invitation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('ORIGINATOR_ID')->notNull();
	$columns->varchar('INVITATION_TYPE', 50);
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->char('INITIALIZED', 1)->notNull()->default('N');
	$columns->char('IS_MASS', 1)->notNull()->default('N');
	$columns->char('IS_DEPARTMENT', 1)->notNull()->default('N');
	$columns->char('IS_INTEGRATOR', 1)->notNull()->default('N');
	$columns->char('IS_REGISTER', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_intranet_invitation_created', ['DATE_CREATE']);
	$table->addUniqueIndex('ix_intranet_invitation_user_originator', ['USER_ID', 'ORIGINATOR_ID']);
});

$migration->table('b_intranet_theme')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('THEME_ID', 100)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('CONTEXT', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_intranet_theme_entity_context', ['ENTITY_TYPE', 'ENTITY_ID', 'CONTEXT']);
});

$migration->table('b_intranet_custom_section')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_intranet_custom_section_table', ['CODE']);
	$table->addIndex('ix_intranet_custom_section_module_id', ['MODULE_ID']);
});

$migration->table('b_intranet_custom_section_page')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('CUSTOM_SECTION_ID')->unsigned()->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('SORT')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->varchar('SETTINGS', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_intranet_custom_section_page_module_id_settings', ['MODULE_ID', 'SETTINGS']);
});

$migration->table('b_intranet_invitation_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 15)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('CODE', 64)->notNull();
	$columns->int('CREATED_BY');
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('EXPIRED_AT');
	$table->addUniqueIndex('ux_b_intranet_invitation_link_entity_type_entity_id', ['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_intranet_user_annual_summary')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->mediumText('VALUE');
	$columns->int('TOTAL');
	$table->addUniqueIndex('ux_user_name', ['USER_ID', 'NAME']);
});

$migration->table('b_intranet_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('INITIALIZED', 1)->notNull()->default('N');
	$table->addUniqueIndex('ux_b_intranet_user_user_id', ['USER_ID']);
	$table->addIndex('IX_B_USER_ID_INITIALIZED', ['USER_ID', 'INITIALIZED']);
});
