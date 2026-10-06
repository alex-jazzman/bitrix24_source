<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_biconnector_key')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->int('CREATED_BY')->notNull();
	$table->addColumn()->timestamp('TIMESTAMP_X')->notNull();
	$table->addColumn()->varchar('ACCESS_KEY', 64)->notNull();
	$table->addColumn()->varchar('CONNECTION', 50)->notNull();
	$table->addColumn()->char('ACTIVE', 1)->notNull()->default('Y');
	$table->addColumn()->int('APP_ID');
	$table->addColumn()->varchar('SERVICE_ID', 64);
	$table->addColumn()->datetime('LAST_ACTIVITY_DATE');
	$table->addIndex('ix_b_biconnector_key', ['ACCESS_KEY']);
	$table->addIndex('ix_b_biconnector_key_app', ['APP_ID']);
});

$migration->table('b_biconnector_key_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->timestamp('TIMESTAMP_X')->notNull();
	$table->addColumn()->int('CREATED_BY')->notNull();
	$table->addColumn()->int('KEY_ID')->notNull();
	$table->addColumn()->varchar('USER_ID', 50)->notNull();
	$table->addIndex('ix_b_biconnector_key_user', ['USER_ID', 'KEY_ID']);
	$table->addIndex('ix_b_biconnector_key_user_1', ['KEY_ID', 'USER_ID']);
});

$migration->table('b_biconnector_dashboard')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->timestamp('TIMESTAMP_X')->notNull();
	$table->addColumn()->int('CREATED_BY')->notNull();
	$table->addColumn()->int('LAST_VIEW_BY');
	$table->addColumn()->datetime('DATE_LAST_VIEW');
	$table->addColumn()->varchar('NAME', 50)->notNull();
	$table->addColumn()->varchar('URL', 1024)->notNull();
});

$migration->table('b_biconnector_dashboard_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->timestamp('TIMESTAMP_X')->notNull();
	$table->addColumn()->int('CREATED_BY')->notNull();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addColumn()->varchar('USER_ID', 50)->notNull();
	$table->addIndex('ix_b_biconnector_dashboard_user', ['USER_ID', 'DASHBOARD_ID']);
	$table->addIndex('ix_b_biconnector_dashboard_user_1', ['DASHBOARD_ID', 'USER_ID']);
});

$migration->table('b_biconnector_dictionary_cache')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addColumn()->int('DICTIONARY_ID')->notNull();
	$table->addColumn()->datetime('UPDATE_DATE')->notNull();
	$table->addColumn()->int('TTL')->notNull();
	$table->addPrimaryKey('DICTIONARY_ID');
});

$migration->table('b_biconnector_dictionary_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addColumn()->int('DICTIONARY_ID')->notNull();
	$table->addColumn()->int('VALUE_ID')->notNull();
	$table->addColumn()->varchar('VALUE_STR', 500);
	$table->addPrimaryKeys(['DICTIONARY_ID', 'VALUE_ID']);
});

$migration->table('b_biconnector_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->timestamp('TIMESTAMP_X')->notNull();
	$table->addColumn()->int('KEY_ID')->notNull();
	$table->addColumn()->varchar('SERVICE_ID', 150)->notNull();
	$table->addColumn()->varchar('SOURCE_ID', 150)->notNull();
	$table->addColumn()->text('FIELDS');
	$table->addColumn()->text('FILTERS');
	$table->addColumn()->text('INPUT');
	$table->addColumn()->varchar('REQUEST_METHOD', 15);
	$table->addColumn()->varchar('REQUEST_URI', 2000);
	$table->addColumn()->int('ROW_NUM');
	$table->addColumn()->int('DATA_SIZE');
	$table->addColumn()->double('REAL_TIME');
	$table->addColumn()->char('IS_OVER_LIMIT', 1)->default('N');
	$table->addColumn()->varchar('SOURCE', 255);
	$table->addColumn()->int('EXTERNAL_DASHBOARD_ID');
	$table->addColumn()->varchar('EXTERNAL_DASHBOARD_NAME', 500);
	$table->addColumn()->varchar('EXTERNAL_CHART_ID', 255);
	$table->addColumn()->varchar('EXTERNAL_CHART_NAME', 250);
	$table->addColumn()->int('EXTERNAL_DATASET_ID');
	$table->addColumn()->varchar('EXTERNAL_DATASET_NAME', 250);
	$table->addIndex('ix_b_biconnector_log_time', ['TIMESTAMP_X', 'ROW_NUM']);
	$table->addIndex('ix_b_biconnector_log_key', ['KEY_ID', 'TIMESTAMP_X']);
	$table->addIndex('IX_BI_LOG_DASHBOARD', ['EXTERNAL_DASHBOARD_ID']);
	$table->addIndex('IX_BI_LOG_CHART', ['EXTERNAL_CHART_ID']);
	$table->addIndex('IX_BI_LOG_DATASET', ['EXTERNAL_DATASET_ID']);
	$table->addIndex('IX_BI_LOG_REAL_TIME', ['REAL_TIME']);
	$table->addIndex('IX_BI_LOG_DATA_SIZE', ['DATA_SIZE']);
});

$migration->table('b_biconnector_superset_dashboard')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('EXTERNAL_ID');
	$table->addColumn()->char('STATUS', 1)->notNull()->default('R');
	$table->addColumn()->varchar('TITLE', 128);
	$table->addColumn()->date('DATE_FILTER_START');
	$table->addColumn()->date('DATE_FILTER_END');
	$table->addColumn()->varchar('TYPE', 50)->notNull();
	$table->addColumn()->varchar('APP_ID', 128);
	$table->addColumn()->int('SOURCE_ID');
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->datetime('DATE_MODIFY')->notNull();
	$table->addColumn()->varchar('FILTER_PERIOD', 50);
	$table->addColumn()->int('CREATED_BY_ID');
	$table->addColumn()->int('OWNER_ID');
	$table->addColumn()->varchar('LANG', 2);
	$table->addColumn()->char('INCLUDE_LAST_FILTER_DATE', 1);
	$table->addIndex('ix_b_biconnector_superset_dashboard_app_id', ['APP_ID']);
	$table->addIndex('ix_b_biconnector_superset_dashboard_external_id', ['EXTERNAL_ID']);
	$table->addIndex('ix_b_biconnector_superset_dashboard_source_id', ['SOURCE_ID']);
});

$migration->table('b_biconnector_superset_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('USER_ID')->notNull();
	$table->addColumn()->varchar('CLIENT_ID', 32)->notNull();
	$table->addColumn()->varchar('PERMISSION_HASH', 32);
	$table->addColumn()->char('UPDATED', 1)->notNull()->default('Y');
	$table->addIndex('ix_b_biconnector_superset_user_user_id', ['USER_ID']);
});

$migration->table('b_biconnector_superset_tag')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('USER_ID')->notNull();
	$table->addColumn()->varchar('TITLE', 255)->notNull();
	$table->addUniqueIndex('IX_BICONNECTOR_USER_TAG', ['USER_ID', 'TITLE']);
});

$migration->table('b_biconnector_superset_dashboard_tag')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addColumn()->int('TAG_ID')->notNull();
	$table->addUniqueIndex('IX_BICONNECTOR_DASHBOARD_TAG', ['TAG_ID', 'DASHBOARD_ID']);
});

$migration->table('b_biconnector_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addColumn()->int('ID')->unsigned()->notNull()->autoincrement();
	$table->addColumn()->varchar('NAME', 250)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_biconnector_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addColumn()->int('ID')->unsigned()->notNull()->autoincrement();
	$table->addColumn()->int('ROLE_ID')->unsigned()->notNull();
	$table->addColumn()->varchar('RELATION', 24)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('ROLE_ID', ['ROLE_ID']);
	$table->addIndex('RELATION', ['RELATION']);
});

$migration->table('b_biconnector_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addColumn()->int('ID')->unsigned()->notNull()->autoincrement();
	$table->addColumn()->int('ROLE_ID')->unsigned()->notNull();
	$table->addColumn()->varchar('PERMISSION_ID', 32)->notNull()->default('0');
	$table->addColumn()->int('VALUE')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('ROLE_ID', ['ROLE_ID']);
	$table->addIndex('PERMISSION_ID', ['PERMISSION_ID']);
});

$migration->table('b_biconnector_superset_scope')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addColumn()->varchar('SCOPE_CODE', 255)->notNull();
	$table->addUniqueIndex('IX_BICONNECTOR_DASHBOARD_SCOPE', ['SCOPE_CODE', 'DASHBOARD_ID']);
});

$migration->table('b_biconnector_superset_dashboard_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->varchar('CODE', 50)->notNull();
	$table->addColumn()->varchar('NAME', 512)->notNull();
	$table->addColumn()->varchar('TYPE', 50)->notNull();
	$table->addColumn()->int('OWNER_ID');
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->datetime('DATE_MODIFY')->notNull();
	$table->addUniqueIndex('IX_BICONNECTOR_DASHBOARD_GROUP_CODE', ['CODE']);
});

$migration->table('b_biconnector_superset_dashboard_group_binding')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('GROUP_ID')->notNull();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addUniqueIndex('IX_BICONNECTOR_DASHBOARD_GROUP', ['GROUP_ID', 'DASHBOARD_ID']);
});

$migration->table('b_biconnector_superset_dashboard_group_scope')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('GROUP_ID')->notNull();
	$table->addColumn()->varchar('SCOPE_CODE', 255)->notNull();
	$table->addUniqueIndex('IX_BICONNECTOR_DASHBOARD_GROUP_SCOPE', ['GROUP_ID', 'SCOPE_CODE']);
});

$migration->table('b_biconnector_superset_dashboard_url_parameter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_ID');
	$table->addColumn()->varchar('CODE', 255)->notNull();
	$table->addIndex('IX_DASHBOARD_ID', ['DASHBOARD_ID']);
	$table->addIndex('IX_CODE', ['CODE']);
});

$migration->table('b_biconnector_dict_structure_agg')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addColumn()->int('DEP_ID');
	$table->addColumn()->varchar('DEP_NAME', 255);
	$table->addColumn()->text('DEP_IDS');
	$table->addColumn()->text('DEP_NAMES');
	$table->addColumn()->text('DEP_NAME_IDS');
	$table->addPrimaryKey('DEP_ID');
});

$migration->table('b_biconnector_external_source')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->varchar('TYPE', 50)->notNull();
	$table->addColumn()->varchar('CODE', 512)->notNull();
	$table->addColumn()->varchar('TITLE', 512)->notNull();
	$table->addColumn()->text('DESCRIPTION');
	$table->addColumn()->char('ACTIVE', 1)->notNull()->default('Y');
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->datetime('DATE_UPDATE');
	$table->addColumn()->int('CREATED_BY_ID')->notNull();
	$table->addColumn()->int('UPDATED_BY_ID');
});

$migration->table('b_biconnector_external_source_settings')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('SOURCE_ID')->notNull();
	$table->addColumn()->varchar('CODE', 512)->notNull();
	$table->addColumn()->text('VALUE');
	$table->addColumn()->varchar('NAME', 512)->notNull();
	$table->addColumn()->varchar('TYPE', 50)->notNull();
	$table->addIndex('IX_BICONNECTOR_EXTERNAL_SOURCE_SETTINGS_SOURCE', ['SOURCE_ID']);
});

$migration->table('b_biconnector_external_dataset')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->varchar('TYPE', 50)->notNull();
	$table->addColumn()->varchar('NAME', 250)->notNull();
	$table->addColumn()->text('DESCRIPTION');
	$table->addColumn()->varchar('EXTERNAL_CODE', 512);
	$table->addColumn()->varchar('EXTERNAL_NAME', 512);
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->datetime('DATE_UPDATE');
	$table->addColumn()->int('CREATED_BY_ID')->notNull();
	$table->addColumn()->int('UPDATED_BY_ID');
	$table->addColumn()->int('EXTERNAL_ID');
	$table->addUniqueIndex('IX_BICONNECTOR_EXTERNAL_DATASET_NAME', ['NAME']);
});

$migration->table('b_biconnector_external_source_dataset_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('SOURCE_ID')->notNull();
	$table->addColumn()->int('DATASET_ID')->notNull();
	$table->addIndex('IX_BICONNECTOR_EXTERNAL_SOURCE_DATASET_RELATION_SOURCE_DATASET', ['SOURCE_ID', 'DATASET_ID']);
});

$migration->table('b_biconnector_external_dataset_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DATASET_ID')->notNull();
	$table->addColumn()->varchar('TYPE', 50)->notNull();
	$table->addColumn()->varchar('NAME', 512)->notNull();
	$table->addColumn()->varchar('EXTERNAL_CODE', 512);
	$table->addColumn()->char('VISIBLE', 1)->notNull()->default('Y');
	$table->addColumn()->text('DESCRIPTION');
	$table->addIndex('IX_BICONNECTOR_EXTERNAL_DATASET_FIELD_DATASET', ['DATASET_ID']);
});

$migration->table('b_biconnector_external_dataset_field_format')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DATASET_ID')->notNull();
	$table->addColumn()->varchar('TYPE', 50)->notNull();
	$table->addColumn()->varchar('FORMAT', 50)->notNull();
	$table->addIndex('IX_BICONNECTOR_EXTERNAL_DATASET_SETTINGS_DATASET', ['DATASET_ID']);
});

$migration->table('b_biconnector_external_source_rest_connector')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->varchar('TITLE', 512)->notNull();
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->text('LOGO')->notNull();
	$table->addColumn()->text('DESCRIPTION');
	$table->addColumn()->text('SETTINGS');
	$table->addColumn()->int('SORT')->notNull()->default('100');
	$table->addColumn()->varchar('APP_ID', 128)->notNull();
	$table->addColumn()->varchar('URL_CHECK', 2048)->notNull();
	$table->addColumn()->varchar('URL_DATA', 2048)->notNull();
	$table->addColumn()->varchar('URL_TABLE_LIST', 2048)->notNull();
	$table->addColumn()->varchar('URL_TABLE_DESCRIPTION', 2048)->notNull();
	$table->addColumn()->char('SUPPORT_MAPPING', 1)->notNull()->default('N');
	$table->addColumn()->varchar('SOURCE_CODE', 64);
});

$migration->table('b_biconnector_external_source_rest')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('CONNECTOR_ID')->notNull();
	$table->addColumn()->int('SOURCE_ID')->notNull();
	$table->addUniqueIndex('IX_BICONNECTOR_EXTERNAL_SOURCE_CODE', ['SOURCE_ID', 'CONNECTOR_ID']);
});

$migration->table('b_biconnector_superset_dashboard_share')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addColumn()->varchar('TOKEN', 64)->notNull();
	$table->addColumn()->varchar('PASSWORD', 255)->notNull();
	$table->addColumn()->datetime('DATE_EXPIRE')->notNull();
	$table->addColumn()->char('ACTIVE', 1)->notNull()->default('Y');
	$table->addColumn()->int('CREATED_BY_ID')->notNull();
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addColumn()->datetime('DATE_MODIFY')->notNull();
	$table->addColumn()->text('EXTERNAL_FILTER_VALUES');
	$table->addColumn()->text('URL_PARAMETER_VALUES');
	$table->addColumn()->int('LOGIN_ATTEMPTS')->notNull()->default('0');
	$table->addColumn()->datetime('LOGIN_LOCKED_TILL');
	$table->addUniqueIndex('IX_BICONNECTOR_SHARE_TOKEN', ['TOKEN']);
	$table->addUniqueIndex('IX_BICONNECTOR_SHARE_DASHBOARD_CREATOR', ['DASHBOARD_ID', 'CREATED_BY_ID']);
});

$migration->table('b_biconnector_superset_dashboard_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addColumn()->int('USER_ID')->notNull();
	$table->addColumn()->datetime('VIEWED_AT')->notNull();
	$table->addIndex('ix_b_biconnector_superset_dashboard_view_dashboard_id', ['DASHBOARD_ID']);
	$table->addIndex('ix_b_biconnector_superset_dashboard_view_user_id', ['USER_ID']);
});

$migration->table('b_biconnector_superset_dashboard_info')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addColumn()->int('PUBLISHED_BY_ID');
	$table->addColumn()->datetime('PUBLISHED_DATE');
	$table->addColumn()->int('UPDATED_BY_ID');
	$table->addColumn()->datetime('UPDATED_DATE');
	$table->addColumn()->text('DESCRIPTION');
	$table->addColumn()->int('IMAGE_ID');
	$table->addUniqueIndex('ix_b_biconnector_superset_dashboard_info_dashboard_id', ['DASHBOARD_ID']);
	$table->addIndex('ix_b_biconnector_superset_dashboard_info_published_by_id', ['PUBLISHED_BY_ID']);
	$table->addIndex('ix_b_biconnector_superset_dashboard_info_updated_by_id', ['UPDATED_BY_ID']);
});

$migration->table('b_biconnector_superset_dashboard_info_gallery')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_INFO_ID')->notNull();
	$table->addColumn()->int('IMAGE_ID')->notNull();
	$table->addColumn()->int('SORT')->notNull()->default('500');
	$table->addIndex('ix_b_biconnector_superset_dashboard_info_gallery_info', ['DASHBOARD_INFO_ID']);
	$table->addUniqueIndex('ix_b_biconnector_superset_dashboard_info_gallery_info_image', ['DASHBOARD_INFO_ID', 'IMAGE_ID']);
});

$migration->table('b_biconnector_superset_dashboard_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('DASHBOARD_ID')->notNull();
	$table->addColumn()->int('CHAT_ID')->notNull();
	$table->addColumn()->int('CREATED_BY_ID')->notNull();
	$table->addColumn()->datetime('DATE_CREATE')->notNull();
	$table->addUniqueIndex('ix_b_biconnector_superset_dashboard_chat_dashboard_id', ['DASHBOARD_ID']);
	$table->addUniqueIndex('ix_b_biconnector_superset_dashboard_chat_chat_id', ['CHAT_ID']);
});
