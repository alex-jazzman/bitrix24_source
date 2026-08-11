<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_rest_event')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID');
	$columns->varchar('EVENT_NAME', 255)->notNull();
	$columns->varchar('EVENT_HANDLER', 255)->notNull();
	$columns->int('USER_ID')->default('0');
	$columns->varchar('TITLE', 255)->default('');
	$columns->varchar('COMMENT', 255)->default('');
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$columns->varchar('APPLICATION_TOKEN', 50)->default('');
	$columns->varchar('CONNECTOR_ID', 255)->default('');
	$columns->int('INTEGRATION_ID');
	$columns->varchar('OPTIONS', 1024);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_event_app_event', ['APP_ID', 'EVENT_NAME(50)', 'EVENT_HANDLER(180)', 'USER_ID', 'CONNECTOR_ID(70)']);
	$table->addIndex('ix_b_rest_event_event_name', ['EVENT_NAME']);
});

$migration->table('b_rest_app')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CLIENT_ID', 128)->notNull();
	$columns->varchar('CODE', 128)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('INSTALLED', 1)->notNull()->default('N');
	$columns->varchar('URL', 1000)->notNull();
	$columns->varchar('URL_DEMO', 1000);
	$columns->varchar('URL_INSTALL', 1000);
	$columns->varchar('URL_SETTINGS', 1000);
	$columns->varchar('VERSION', 4)->default('1');
	$columns->varchar('SCOPE', 2000)->notNull();
	$columns->char('STATUS', 1)->notNull()->default('F');
	$columns->date('DATE_FINISH');
	$columns->char('IS_TRIALED', 1)->default('N');
	$columns->varchar('SHARED_KEY', 32);
	$columns->varchar('CLIENT_SECRET', 100);
	$columns->varchar('APP_NAME', 1000);
	$columns->varchar('ACCESS', 2000)->default('');
	$columns->varchar('APPLICATION_TOKEN', 50)->default('');
	$columns->char('MOBILE', 1)->default('N');
	$columns->char('USER_INSTALL', 1)->default('N');
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$columns->datetime('DATE_INSTALL')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_app1', ['CLIENT_ID']);
});

$migration->table('b_rest_app_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID')->notNull();
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->varchar('MENU_NAME', 500);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_app_lang1', ['APP_ID', 'LANGUAGE_ID']);
});

$migration->table('b_rest_app_attribute')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID')->notNull();
	$columns->char('TYPE', 1)->notNull()->default('S');
	$columns->varchar('CODE', 50)->notNull();
	$columns->varchar('VALUE', 1000);
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_app_attribute_app_type_code', ['APP_ID', 'TYPE', 'CODE']);
});

$migration->table('b_rest_ap')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('PASSWORD', 50)->notNull();
	$columns->char('ACTIVE', 1)->default('Y');
	$columns->varchar('TYPE', 15)->notNull()->default('user');
	$columns->varchar('TITLE', 255)->default('');
	$columns->varchar('COMMENT', 255)->default('');
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$columns->datetime('DATE_LOGIN');
	$columns->varchar('LAST_IP', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_rest_ap', ['USER_ID', 'PASSWORD', 'ACTIVE']);
});

$migration->table('b_rest_ap_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PASSWORD_ID')->notNull();
	$columns->varchar('PERM', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_ap_perm1', ['PASSWORD_ID', 'PERM']);
});

$migration->table('b_rest_incoming_webhook_attribute')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PASSWORD_ID')->notNull();
	$columns->char('TYPE', 1)->notNull()->default('S');
	$columns->varchar('CODE', 50)->notNull();
	$columns->varchar('VALUE', 1000);
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_incoming_webhook_attribute_password_type_code', ['PASSWORD_ID', 'TYPE', 'CODE']);
});

$migration->table('b_rest_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->timestamp('TIMESTAMP_X')->notNull()->defaultCurrentTimestamp();
	$columns->varchar('CLIENT_ID', 45);
	$columns->int('PASSWORD_ID');
	$columns->int('EVENT_ID');
	$columns->varchar('SCOPE', 50);
	$columns->varchar('METHOD', 255);
	$columns->varchar('REQUEST_METHOD', 10);
	$columns->varchar('REQUEST_URI', 255);
	$columns->text('REQUEST_AUTH');
	$columns->text('REQUEST_DATA');
	$columns->varchar('RESPONSE_STATUS', 20);
	$columns->longText('RESPONSE_DATA');
	$columns->longText('MESSAGE');
	$table->addPrimaryKey('ID');
});

$migration->table('b_rest_placement')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID');
	$columns->int('USER_ID')->default('0');
	$columns->varchar('PLACEMENT', 255)->notNull();
	$columns->varchar('PLACEMENT_HANDLER', 255)->notNull();
	$columns->int('ICON_ID');
	$columns->varchar('TITLE', 255)->default('');
	$columns->varchar('GROUP_NAME', 255)->default('');
	$columns->varchar('COMMENT', 255)->default('');
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$columns->varchar('ADDITIONAL', 255);
	$columns->varchar('OPTIONS', 2048);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_placement1', ['APP_ID', 'PLACEMENT(100)', 'PLACEMENT_HANDLER(200)']);
	$table->addIndex('ix_b_rest_placement3', ['PLACEMENT(100)', 'ADDITIONAL(100)']);
	$table->addIndex('ix_b_rest_placement4', ['PLACEMENT', 'USER_ID']);
});

$migration->table('b_rest_event_offline')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->timestamp('TIMESTAMP_X')->defaultCurrentTimestamp();
	$columns->varchar('MESSAGE_ID', 100)->notNull();
	$columns->int('APP_ID')->notNull();
	$columns->varchar('EVENT_NAME', 255)->notNull();
	$columns->text('EVENT_DATA');
	$columns->text('EVENT_ADDITIONAL');
	$columns->varchar('PROCESS_ID', 255)->default('');
	$columns->varchar('CONNECTOR_ID', 255)->default('');
	$columns->int('ERROR')->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_event_offline1', ['MESSAGE_ID(50)', 'APP_ID', 'CONNECTOR_ID(100)', 'PROCESS_ID(50)']);
	$table->addIndex('ix_b_rest_event_offline2', ['TIMESTAMP_X']);
	$table->addIndex('ix_b_rest_event_offline3', ['APP_ID', 'CONNECTOR_ID']);
	$table->addIndex('ix_b_rest_event_offline4', ['PROCESS_ID']);
});

$migration->table('b_rest_stat_method')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->char('METHOD_TYPE', 1)->default('M');
	$table->addUniqueIndex('ux_b_rest_stat_method', ['NAME']);
});

$migration->table('b_rest_stat_app')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('APP_ID')->notNull();
	$columns->varchar('APP_CODE', 128)->notNull();
	$table->addPrimaryKey('APP_ID');
	$table->addIndex('ix_b_rest_stat_app_code', ['APP_CODE']);
});

$migration->table('b_rest_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->date('STAT_DATE')->notNull();
	$columns->int('APP_ID')->notNull();
	$columns->int('METHOD_ID')->notNull();
	$columns->int('HOUR_0')->notNull()->default('0');
	$columns->int('HOUR_1')->notNull()->default('0');
	$columns->int('HOUR_2')->notNull()->default('0');
	$columns->int('HOUR_3')->notNull()->default('0');
	$columns->int('HOUR_4')->notNull()->default('0');
	$columns->int('HOUR_5')->notNull()->default('0');
	$columns->int('HOUR_6')->notNull()->default('0');
	$columns->int('HOUR_7')->notNull()->default('0');
	$columns->int('HOUR_8')->notNull()->default('0');
	$columns->int('HOUR_9')->notNull()->default('0');
	$columns->int('HOUR_10')->notNull()->default('0');
	$columns->int('HOUR_11')->notNull()->default('0');
	$columns->int('HOUR_12')->notNull()->default('0');
	$columns->int('HOUR_13')->notNull()->default('0');
	$columns->int('HOUR_14')->notNull()->default('0');
	$columns->int('HOUR_15')->notNull()->default('0');
	$columns->int('HOUR_16')->notNull()->default('0');
	$columns->int('HOUR_17')->notNull()->default('0');
	$columns->int('HOUR_18')->notNull()->default('0');
	$columns->int('HOUR_19')->notNull()->default('0');
	$columns->int('HOUR_20')->notNull()->default('0');
	$columns->int('HOUR_21')->notNull()->default('0');
	$columns->int('HOUR_22')->notNull()->default('0');
	$columns->int('HOUR_23')->notNull()->default('0');
	$table->addPrimaryKeys(['APP_ID', 'STAT_DATE', 'METHOD_ID']);
});

$migration->table('b_rest_app_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->timestamp('TIMESTAMP_X')->notNull()->defaultCurrentTimestamp();
	$columns->int('APP_ID')->notNull();
	$columns->varchar('ACTION_TYPE', 50)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->char('USER_ADMIN', 1)->default('Y');
	$table->addIndex('ix_b_rest_app_log1', ['APP_ID']);
});

$migration->table('b_rest_usage_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_CODE', 255);
	$columns->char('SUB_ENTITY_TYPE', 1);
	$columns->varchar('SUB_ENTITY_NAME', 255);
	$table->addUniqueIndex('ix_b_rest_usage_entity', ['ENTITY_TYPE', 'ENTITY_ID', 'SUB_ENTITY_TYPE', 'SUB_ENTITY_NAME']);
});

$migration->table('b_rest_usage_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->date('STAT_DATE')->notNull();
	$columns->int('ENTITY_ID')->notNull()->default('0');
	$columns->char('IS_SENT', 1)->notNull()->default('N');
	$columns->int('HOUR_0')->notNull()->default('0');
	$columns->int('HOUR_1')->notNull()->default('0');
	$columns->int('HOUR_2')->notNull()->default('0');
	$columns->int('HOUR_3')->notNull()->default('0');
	$columns->int('HOUR_4')->notNull()->default('0');
	$columns->int('HOUR_5')->notNull()->default('0');
	$columns->int('HOUR_6')->notNull()->default('0');
	$columns->int('HOUR_7')->notNull()->default('0');
	$columns->int('HOUR_8')->notNull()->default('0');
	$columns->int('HOUR_9')->notNull()->default('0');
	$columns->int('HOUR_10')->notNull()->default('0');
	$columns->int('HOUR_11')->notNull()->default('0');
	$columns->int('HOUR_12')->notNull()->default('0');
	$columns->int('HOUR_13')->notNull()->default('0');
	$columns->int('HOUR_14')->notNull()->default('0');
	$columns->int('HOUR_15')->notNull()->default('0');
	$columns->int('HOUR_16')->notNull()->default('0');
	$columns->int('HOUR_17')->notNull()->default('0');
	$columns->int('HOUR_18')->notNull()->default('0');
	$columns->int('HOUR_19')->notNull()->default('0');
	$columns->int('HOUR_20')->notNull()->default('0');
	$columns->int('HOUR_21')->notNull()->default('0');
	$columns->int('HOUR_22')->notNull()->default('0');
	$columns->int('HOUR_23')->notNull()->default('0');
	$table->addPrimaryKeys(['STAT_DATE', 'ENTITY_ID']);
	$table->addIndex('ix_b_rest_usage', ['ENTITY_ID', 'STAT_DATE']);
});

$migration->table('b_rest_owner_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('OWNER_TYPE', 1)->notNull();
	$columns->int('OWNER')->notNull();
	$columns->varchar('ENTITY_TYPE', 32)->notNull();
	$columns->varchar('ENTITY', 32)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_b_rest_owner_entity', ['ENTITY_TYPE', 'ENTITY']);
});

$migration->table('b_rest_integration')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID');
	$columns->varchar('ELEMENT_CODE', 256)->notNull();
	$columns->varchar('TITLE', 256)->notNull();
	$columns->int('PASSWORD_ID');
	$columns->int('APP_ID');
	$columns->text('SCOPE');
	$columns->text('QUERY');
	$columns->text('OUTGOING_EVENTS');
	$columns->char('OUTGOING_NEEDED', 1);
	$columns->varchar('OUTGOING_HANDLER_URL', 2048);
	$columns->char('WIDGET_NEEDED', 1);
	$columns->varchar('WIDGET_HANDLER_URL', 2048);
	$columns->text('WIDGET_LIST');
	$columns->varchar('APPLICATION_TOKEN', 50);
	$columns->char('APPLICATION_NEEDED', 1);
	$columns->char('APPLICATION_ONLY_API', 1);
	$columns->int('BOT_ID');
	$columns->varchar('BOT_HANDLER_URL', 2048);
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
});

$migration->table('b_rest_configuration_storage')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->timestamp('CREATE_TIME');
	$columns->varchar('CONTEXT', 128)->notNull();
	$columns->varchar('CODE', 32)->notNull();
	$columns->longText('DATA')->notNull();
});

$migration->table('b_rest_placement_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('PLACEMENT_ID')->notNull();
	$columns->varchar('LANGUAGE_ID', 2)->notNull();
	$columns->varchar('TITLE', 255);
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('GROUP_NAME', 255);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('b_rest_placement_lang_unique', ['PLACEMENT_ID', 'LANGUAGE_ID']);
});

$migration->table('b_rest_access_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	$columns->varchar('PERMISSION', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_rest_access_permission', ['ENTITY_TYPE', 'ACCESS_CODE', 'PERMISSION']);
});

$migration->table('b_rest_free_app')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('APP_CODE', 128)->notNull();
	$table->addPrimaryKey('APP_CODE');
	$table->addUniqueIndex('APP_CODE', ['APP_CODE']);
});

$migration->table('b_rest_system_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ACCOUNT_TYPE', 32)->notNull();
	$columns->varchar('RESOURCE_TYPE', 32)->notNull();
	$columns->int('RESOURCE_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('idx_brsu_resource_id_resource_type', ['RESOURCE_ID', 'RESOURCE_TYPE']);
});

$migration->table('b_rest_app_scope_request')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID')->notNull();
	$columns->text('SCOPE')->notNull();
	$columns->int('STATE_ID');
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_rest_app_scope_request_app', ['APP_ID']);
	$table->addIndex('ix_b_rest_app_scope_request_state', ['STATE_ID']);
});

$migration->table('b_rest_app_scope_request_state')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('REQUEST_ID')->notNull();
	$columns->varchar('STATUS', 32)->notNull();
	$columns->text('COMMENT');
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_rest_app_scope_request_state_request', ['REQUEST_ID']);
});

