<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_disk_storage')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 100);
	$columns->varchar('CODE', 32);
	$columns->varchar('XML_ID', 50);
	$columns->varchar('MODULE_ID', 32)->notNull();
	$columns->varchar('ENTITY_TYPE', 100)->notNull();
	$columns->varchar('ENTITY_ID', 32)->notNull();
	$columns->text('ENTITY_MISC_DATA');
	$columns->int('ROOT_OBJECT_ID');
	$columns->tinyInt('USE_INTERNAL_RIGHTS');
	$columns->char('SITE_ID', 2);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_DISK_PH_1', ['MODULE_ID', 'ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('IX_DISK_PH_2', ['XML_ID']);
});

$migration->table('b_disk_object')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull()->default('');
	$columns->int('TYPE')->notNull();
	$columns->varchar('CODE', 50);
	$columns->varchar('XML_ID', 50);
	$columns->int('STORAGE_ID')->notNull();
	$columns->int('REAL_OBJECT_ID');
	$columns->int('PARENT_ID');
	$columns->varchar('CONTENT_PROVIDER', 10);
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('UPDATE_TIME');
	$columns->datetime('SYNC_UPDATE_TIME');
	$columns->datetime('DELETE_TIME');
	$columns->int('CREATED_BY');
	$columns->int('UPDATED_BY');
	$columns->int('DELETED_BY')->default('0');
	$columns->int('GLOBAL_CONTENT_VERSION');
	$columns->int('FILE_ID');
	$columns->int('TYPE_FILE');
	$columns->bigInt('SIZE');
	$columns->varchar('EXTERNAL_HASH', 255);
	$columns->varchar('ETAG', 255);
	$columns->int('DELETED_TYPE')->default('0');
	$columns->int('PREVIEW_ID');
	$columns->int('VIEW_ID');
	$columns->varchar('UNIQUE_CODE', 64);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_O_1', ['REAL_OBJECT_ID']);
	$table->addIndex('IX_DISK_O_2', ['PARENT_ID', 'DELETED_TYPE', 'TYPE']);
	$table->addIndex('IX_DISK_O_3', ['STORAGE_ID', 'CODE']);
	$table->addIndex('IX_DISK_O_4', ['STORAGE_ID', 'DELETED_TYPE', 'TYPE']);
	$table->addUniqueIndex('IX_DISK_O_5', ['NAME', 'PARENT_ID']);
	$table->addIndex('IX_DISK_O_6', ['STORAGE_ID', 'XML_ID']);
	$table->addIndex('IX_DISK_O_7', ['UPDATE_TIME']);
	$table->addIndex('IX_DISK_O_8', ['SYNC_UPDATE_TIME']);
	$table->addIndex('IX_DISK_O_10', ['STORAGE_ID', 'GLOBAL_CONTENT_VERSION']);
	$table->addIndex('IX_DISK_O_11', ['FILE_ID']);
	$table->addIndex('IX_DISK_O_12', ['PARENT_ID', 'STORAGE_ID', 'UPDATE_TIME']);
	$table->addIndex('IX_DISK_O_13', ['STORAGE_ID', 'SYNC_UPDATE_TIME']);
	$table->addUniqueIndex('IX_DISK_0_14', ['UNIQUE_CODE']);
});

$migration->table('b_disk_object_head_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OBJECT_ID')->notNull();
	$columns->datetime('UPDATE_TIME');
	$columns->mediumText('SEARCH_INDEX');
	$table->addPrimaryKey('OBJECT_ID');
	$table->addFulltextIndex('IX_DISK_HI_1', ['SEARCH_INDEX']);
	$table->addIndex('IX_DISK_HI_2', ['UPDATE_TIME']);
});

$migration->table('b_disk_object_extended_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OBJECT_ID')->notNull();
	$columns->datetime('UPDATE_TIME');
	$columns->mediumText('SEARCH_INDEX');
	$columns->tinyInt('STATUS')->notNull()->default('2');
	$table->addPrimaryKey('OBJECT_ID');
	$table->addFulltextIndex('IX_DISK_EI_1', ['SEARCH_INDEX']);
	$table->addIndex('IX_DISK_EI_2', ['STATUS', 'UPDATE_TIME']);
});

$migration->table('b_disk_object_lock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TOKEN', 255)->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('EXPIRY_TIME');
	$columns->int('TYPE')->notNull();
	$columns->tinyInt('IS_EXCLUSIVE');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_DISK_OL_1', ['OBJECT_ID', 'IS_EXCLUSIVE']);
	$table->addUniqueIndex('IX_DISK_OL_2', ['TOKEN']);
});

$migration->table('b_disk_object_ttl')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('DEATH_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_OTTL_1', ['DEATH_TIME', 'OBJECT_ID']);
});

$migration->table('b_disk_object_path')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PARENT_ID')->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('DEPTH_LEVEL');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_DISK_OP_1', ['PARENT_ID', 'DEPTH_LEVEL', 'OBJECT_ID']);
	$table->addUniqueIndex('IX_DISK_OP_2', ['OBJECT_ID', 'PARENT_ID', 'DEPTH_LEVEL']);
});

$migration->table('b_disk_version')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$columns->bigInt('SIZE');
	$columns->varchar('NAME', 255);
	$columns->int('VIEW_ID');
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->int('CREATED_BY');
	$columns->datetime('OBJECT_CREATE_TIME');
	$columns->int('OBJECT_CREATED_BY');
	$columns->datetime('OBJECT_UPDATE_TIME');
	$columns->int('OBJECT_UPDATED_BY');
	$columns->int('GLOBAL_CONTENT_VERSION');
	$columns->text('MISC_DATA');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_V_1', ['OBJECT_ID']);
	$table->addIndex('IX_DISK_V_2', ['CREATE_TIME', 'OBJECT_ID', 'FILE_ID']);
});

$migration->table('b_disk_right')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('TASK_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 50)->notNull();
	$columns->varchar('DOMAIN', 50);
	$columns->tinyInt('NEGATIVE')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_R_1', ['OBJECT_ID', 'NEGATIVE']);
	$table->addIndex('IX_DISK_R_2', ['ACCESS_CODE', 'TASK_ID']);
	$table->addIndex('IX_DISK_R_3', ['OBJECT_ID', 'TASK_ID']);
});

$migration->table('b_disk_simple_right')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('OBJECT_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_SR_1', ['OBJECT_ID', 'ACCESS_CODE']);
	$table->addIndex('IX_DISK_SR_2', ['ACCESS_CODE']);
});

$migration->table('b_disk_right_setup_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PARENT_ID');
	$columns->int('OBJECT_ID')->notNull();
	$columns->tinyInt('STATUS')->notNull()->default('2');
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->int('CREATED_BY');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_R_SESSION_1', ['OBJECT_ID']);
	$table->addIndex('IX_DISK_R_SESSION_2', ['STATUS', 'CREATE_TIME']);
});

$migration->table('b_disk_tmp_simple_right')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OBJECT_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 50)->notNull();
	$columns->int('SESSION_ID')->notNull();
	$table->addPrimaryKeys(['SESSION_ID', 'ACCESS_CODE', 'OBJECT_ID']);
	$table->addIndex('IX_DISK_TSR_1', ['SESSION_ID', 'OBJECT_ID']);
});

$migration->table('b_disk_attached_object')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('VERSION_ID');
	$columns->tinyInt('IS_EDITABLE')->notNull()->default('0');
	$columns->tinyInt('ALLOW_EDIT')->notNull()->default('0');
	$columns->tinyInt('ALLOW_AUTO_COMMENT')->default('1');
	$columns->varchar('MODULE_ID', 32)->notNull();
	$columns->varchar('ENTITY_TYPE', 100)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->int('CREATED_BY');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_AO_1', ['OBJECT_ID', 'VERSION_ID']);
	$table->addIndex('IX_DISK_AO_2', ['MODULE_ID', 'ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('IX_DISK_AO_3', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_disk_external_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('VERSION_ID');
	$columns->varchar('HASH', 32)->notNull();
	$columns->varchar('PASSWORD', 32);
	$columns->varchar('SALT', 32);
	$columns->datetime('DEATH_TIME');
	$columns->text('DESCRIPTION');
	$columns->int('DOWNLOAD_COUNT');
	$columns->int('TYPE');
	$columns->tinyInt('ACCESS_RIGHT')->default('0');
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->int('CREATED_BY');
	$columns->tinyInt('CAN_DOWNLOAD_WITH_READ_ACCESS')->notNull()->default('1');
	$columns->tinyInt('CAN_EDIT_SETTINGS')->notNull()->default('1');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_EL_1', ['OBJECT_ID']);
	$table->addIndex('IX_DISK_EL_2', ['HASH']);
	$table->addIndex('IX_DISK_EL_3', ['CREATED_BY']);
});

$migration->table('b_disk_sharing')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PARENT_ID');
	$columns->int('CREATED_BY');
	$columns->varchar('FROM_ENTITY', 50)->notNull();
	$columns->varchar('TO_ENTITY', 50)->notNull();
	$columns->int('LINK_STORAGE_ID');
	$columns->int('LINK_OBJECT_ID');
	$columns->int('REAL_OBJECT_ID')->notNull();
	$columns->int('REAL_STORAGE_ID')->notNull();
	$columns->text('DESCRIPTION');
	$columns->tinyInt('CAN_FORWARD');
	$columns->int('STATUS')->notNull();
	$columns->int('TYPE')->notNull();
	$columns->varchar('TASK_NAME', 50);
	$columns->tinyInt('IS_EDITABLE')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_S_1', ['REAL_STORAGE_ID', 'REAL_OBJECT_ID']);
	$table->addIndex('IX_DISK_S_2', ['FROM_ENTITY']);
	$table->addIndex('IX_DISK_S_3', ['TO_ENTITY']);
	$table->addIndex('IX_DISK_S_4', ['LINK_STORAGE_ID', 'LINK_OBJECT_ID']);
	$table->addIndex('IX_DISK_S_5', ['TYPE', 'PARENT_ID']);
	$table->addIndex('IX_DISK_S_6', ['REAL_OBJECT_ID', 'LINK_OBJECT_ID']);
});

$migration->table('b_disk_onlyoffice_document_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('OBJECT_ID');
	$columns->int('VERSION_ID');
	$columns->int('USER_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->tinyInt('IS_EXCLUSIVE')->default('0');
	$columns->varchar('EXTERNAL_HASH', 128)->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->tinyInt('TYPE')->notNull()->default('0');
	$columns->int('STATUS')->default('0');
	$columns->text('CONTEXT');
	$table->addIndex('IX_DISK_OODS_1', ['EXTERNAL_HASH']);
	$table->addIndex('IX_DISK_OODS_2', ['OBJECT_ID', 'USER_ID']);
});

$migration->table('b_disk_onlyoffice_document_info')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('EXTERNAL_HASH', 128)->notNull();
	$columns->int('OBJECT_ID');
	$columns->int('VERSION_ID');
	$columns->int('OWNER_ID')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('UPDATE_TIME')->notNull();
	$columns->int('USERS')->notNull()->default('0');
	$columns->int('CONTENT_STATUS')->default('0');
	$table->addPrimaryKey('EXTERNAL_HASH');
});

$migration->table('b_disk_onlyoffice_restriction_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('EXTERNAL_HASH', 128)->notNull();
	$columns->tinyInt('STATUS')->default('0');
	$columns->datetime('CREATE_TIME');
	$columns->datetime('UPDATE_TIME');
	$table->addIndex('IX_DISK_O_RL_UPDATE', ['UPDATE_TIME']);
	$table->addIndex('IX_DISK_O_RL_USAGE', ['EXTERNAL_HASH', 'USER_ID']);
});

$migration->table('b_disk_document_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('SERVICE', 50);
	$columns->int('OBJECT_ID');
	$columns->int('VERSION_ID');
	$columns->int('USER_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->tinyInt('IS_EXCLUSIVE')->default('0');
	$columns->varchar('EXTERNAL_HASH', 128)->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->tinyInt('TYPE')->notNull()->default('0');
	$columns->int('STATUS')->default('0');
	$columns->int('EXTERNAL_LINK_ID');
	$columns->text('CONTEXT');
	$table->addIndex('IX_DISK_OODS_1', ['EXTERNAL_HASH']);
	$table->addIndex('IX_DISK_OODS_2', ['OBJECT_ID', 'USER_ID']);
	$table->addIndex('IX_DISK_DS_EXTERNAL_LINK_ID', ['EXTERNAL_LINK_ID', 'ID']);
});

$migration->table('b_disk_document_info')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('EXTERNAL_HASH', 128)->notNull();
	$columns->varchar('SERVICE', 50);
	$columns->int('OBJECT_ID');
	$columns->int('VERSION_ID');
	$columns->int('OWNER_ID')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('UPDATE_TIME')->notNull();
	$columns->int('USERS')->notNull()->default('0');
	$columns->int('CONTENT_STATUS')->default('0');
	$table->addPrimaryKey('EXTERNAL_HASH');
});

$migration->table('b_disk_document_restriction_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('SERVICE', 50);
	$columns->int('USER_ID')->notNull();
	$columns->varchar('EXTERNAL_HASH', 128)->notNull();
	$columns->tinyInt('STATUS')->default('0');
	$columns->datetime('CREATE_TIME');
	$columns->datetime('UPDATE_TIME');
	$table->addIndex('IX_DISK_O_RL_UPDATE', ['UPDATE_TIME']);
	$table->addIndex('IX_DISK_O_RL_USAGE', ['EXTERNAL_HASH', 'USER_ID']);
});

$migration->table('b_disk_vibeoffice_delivery')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('DELIVERY_ID')->notNull();
	$columns->varchar('EXTERNAL_HASH', 128);
	$columns->varchar('EVENT', 64)->notNull();
	$columns->datetime('PROCESSED_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_DISK_VO_DELIVERY', ['DELIVERY_ID']);
	$table->addIndex('IX_DISK_VO_DELIVERY_PROCESSED_TIME', ['PROCESSED_TIME']);
});

$migration->table('b_disk_edit_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID');
	$columns->int('VERSION_ID');
	$columns->int('USER_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->tinyInt('IS_EXCLUSIVE');
	$columns->varchar('SERVICE', 10)->notNull();
	$columns->varchar('SERVICE_FILE_ID', 255)->notNull();
	$columns->text('SERVICE_FILE_LINK')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_ES_1', ['OBJECT_ID', 'VERSION_ID']);
	$table->addIndex('IX_DISK_ES_2', ['USER_ID']);
});

$migration->table('b_disk_show_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID');
	$columns->int('VERSION_ID');
	$columns->int('USER_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->varchar('SERVICE', 10)->notNull();
	$columns->varchar('SERVICE_FILE_ID', 255)->notNull();
	$columns->text('SERVICE_FILE_LINK')->notNull();
	$columns->varchar('ETAG', 255);
	$columns->datetime('CREATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_SS_1', ['OBJECT_ID', 'VERSION_ID', 'USER_ID']);
	$table->addIndex('IX_DISK_SS_2', ['CREATE_TIME']);
});

$migration->table('b_disk_tmp_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TOKEN', 32)->notNull();
	$columns->varchar('FILENAME', 255);
	$columns->varchar('CONTENT_TYPE', 255);
	$columns->varchar('PATH', 255);
	$columns->int('BUCKET_ID');
	$columns->bigInt('SIZE');
	$columns->bigInt('RECEIVED_SIZE');
	$columns->int('WIDTH');
	$columns->int('HEIGHT');
	$columns->tinyInt('IS_CLOUD');
	$columns->int('CREATED_BY');
	$columns->datetime('CREATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_TF_1', ['TOKEN']);
	$table->addIndex('IX_DISK_TF_2', ['CREATE_TIME']);
});

$migration->table('b_disk_deleted_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('STORAGE_ID')->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('TYPE')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_DL_1', ['STORAGE_ID', 'CREATE_TIME']);
	$table->addIndex('IX_DISK_DL_2', ['OBJECT_ID']);
	$table->addIndex('IX_DISK_DL_3', ['CREATE_TIME']);
});

$migration->table('b_disk_deleted_log_v2')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('STORAGE_ID')->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('TYPE')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('OBJECT_ID', ['OBJECT_ID', 'STORAGE_ID']);
	$table->addIndex('IX_DISK_DL_V2_1', ['STORAGE_ID', 'CREATE_TIME']);
	$table->addIndex('IX_DISK_DL_V2_2', ['CREATE_TIME']);
});

$migration->table('b_disk_cloud_import')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID');
	$columns->int('VERSION_ID');
	$columns->int('TMP_FILE_ID');
	$columns->bigInt('DOWNLOADED_CONTENT_SIZE')->default('0');
	$columns->bigInt('CONTENT_SIZE')->default('0');
	$columns->text('CONTENT_URL');
	$columns->varchar('MIME_TYPE', 255);
	$columns->int('USER_ID')->notNull();
	$columns->varchar('SERVICE', 10)->notNull();
	$columns->text('SERVICE_OBJECT_ID')->notNull();
	$columns->varchar('ETAG', 255);
	$columns->datetime('CREATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_CI_1', ['OBJECT_ID', 'VERSION_ID']);
	$table->addIndex('IX_DISK_CI_2', ['TMP_FILE_ID']);
});

$migration->table('b_disk_recently_used')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->datetime('CREATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_RU_1', ['USER_ID', 'OBJECT_ID', 'CREATE_TIME']);
	$table->addIndex('IX_DISK_RU_2', ['USER_ID', 'ID']);
});

$migration->table('b_disk_tracked_object')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('REAL_OBJECT_ID')->notNull();
	$columns->int('ATTACHED_OBJECT_ID');
	$columns->int('TYPE_FILE');
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('UPDATE_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_DISK_TO_1', ['USER_ID', 'OBJECT_ID']);
	$table->addIndex('IX_DISK_TO_2', ['USER_ID', 'OBJECT_ID', 'UPDATE_TIME']);
	$table->addIndex('IX_DISK_TO_3', ['ATTACHED_OBJECT_ID', 'USER_ID']);
	$table->addIndex('IX_DISK_TO_4', ['REAL_OBJECT_ID']);
	$table->addIndex('IX_DISK_TO_5', ['OBJECT_ID']);
});

$migration->table('b_disk_volume')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('INDICATOR_TYPE', 255)->notNull();
	$columns->int('OWNER_ID')->notNull()->default('0');
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->varchar('TITLE', 255);
	$columns->bigInt('FILE_SIZE')->notNull()->default('0');
	$columns->bigInt('FILE_COUNT')->notNull()->default('0');
	$columns->bigInt('DISK_SIZE')->notNull()->default('0');
	$columns->bigInt('DISK_COUNT')->notNull()->default('0');
	$columns->bigInt('VERSION_COUNT')->notNull()->default('0');
	$columns->bigInt('PREVIEW_SIZE')->notNull()->default('0');
	$columns->bigInt('PREVIEW_COUNT')->notNull()->default('0');
	$columns->bigInt('ATTACHED_COUNT')->notNull()->default('0');
	$columns->bigInt('LINK_COUNT')->notNull()->default('0');
	$columns->bigInt('SHARING_COUNT')->notNull()->default('0');
	$columns->bigInt('UNNECESSARY_VERSION_SIZE')->notNull()->default('0');
	$columns->bigInt('UNNECESSARY_VERSION_COUNT')->notNull()->default('0');
	$columns->decimal('PERCENT', 18, 4)->notNull()->default('0');
	$columns->int('STORAGE_ID');
	$columns->varchar('MODULE_ID', 255);
	$columns->int('FOLDER_ID');
	$columns->int('PARENT_ID');
	$columns->int('USER_ID');
	$columns->int('GROUP_ID');
	$columns->varchar('ENTITY_TYPE', 255);
	$columns->varchar('ENTITY_ID', 255);
	$columns->int('IBLOCK_ID');
	$columns->int('TYPE_FILE');
	$columns->tinyInt('COLLECTED')->notNull()->default('0');
	$columns->tinyInt('AGENT_LOCK')->notNull()->default('0');
	$columns->tinyInt('DROP_UNNECESSARY_VERSION')->notNull()->default('0');
	$columns->tinyInt('DROP_TRASHCAN')->notNull()->default('0');
	$columns->tinyInt('DROP_FOLDER')->notNull()->default('0');
	$columns->tinyInt('EMPTY_FOLDER')->notNull()->default('0');
	$columns->bigInt('DROPPED_FILE_COUNT')->notNull()->default('0');
	$columns->bigInt('DROPPED_VERSION_COUNT')->notNull()->default('0');
	$columns->bigInt('DROPPED_FOLDER_COUNT')->notNull()->default('0');
	$columns->text('DATA');
	$columns->int('LAST_FILE_ID');
	$columns->int('FAIL_COUNT')->notNull()->default('0');
	$columns->varchar('LAST_ERROR', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_VL_1', ['OWNER_ID', 'STORAGE_ID', 'INDICATOR_TYPE']);
	$table->addIndex('IX_DISK_VL_2', ['OWNER_ID', 'INDICATOR_TYPE']);
	$table->addIndex('IX_DISK_VL_3', ['OWNER_ID', 'AGENT_LOCK']);
	$table->addIndex('IX_DISK_VL_4', ['STORAGE_ID']);
});

$migration->table('b_disk_volume_deleted_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('STORAGE_ID')->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->int('OBJECT_PARENT_ID');
	$columns->int('OBJECT_TYPE')->notNull();
	$columns->varchar('OBJECT_NAME', 255)->notNull()->default('');
	$columns->varchar('OBJECT_PATH', 255)->notNull()->default('');
	$columns->bigInt('OBJECT_SIZE');
	$columns->int('OBJECT_CREATED_BY');
	$columns->int('OBJECT_UPDATED_BY');
	$columns->int('VERSION_ID');
	$columns->varchar('VERSION_NAME', 255);
	$columns->int('FILE_ID');
	$columns->datetime('DELETED_TIME')->notNull();
	$columns->int('DELETED_BY')->default('0');
	$columns->varchar('OPERATION', 50)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DISK_VL_CL_1', ['STORAGE_ID']);
});

$migration->table('b_disk_attached_view_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 100)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('VALUE', 20);
	$table->addPrimaryKeys(['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_disk_unified_link_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('OBJECT_ID')->notNull();
	$columns->varchar('ACCESS_LEVEL', 4)->notNull();
	$table->addUniqueIndex('IX_DISK_ULA_1', ['OBJECT_ID']);
});

$migration->table('b_disk_object_options')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('OBJECT_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('VALUE');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_DISK_OO_OBJECT_ID_NAME', ['OBJECT_ID', 'NAME']);
});
