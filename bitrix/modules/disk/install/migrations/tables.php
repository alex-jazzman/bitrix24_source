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
	$table->addIndex('IX_b_disk_object_view', ['VIEW_ID']);
	$table->addIndex('IX_b_disk_object_preview', ['PREVIEW_ID']);
	$table->addIndex('IX_DISK_O_15', ['REAL_OBJECT_ID', 'STORAGE_ID']);
	$table->addIndex('IX_DISK_O_16', ['STORAGE_ID', 'UPDATE_TIME']);
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
	$table->addIndex('IX_b_disk_version_file', ['FILE_ID']);
	$table->addIndex('IX_b_disk_version_view', ['VIEW_ID']);
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
	$columns->varchar('SCENARIO', 50);
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
	$table->addIndex('IX_DISK_DOCUMENT_INFO_STATUS_TIME', ['CONTENT_STATUS', 'UPDATE_TIME']);
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

$migration->table('b_disk_vo_document')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
		$table->addId();
		$columns = $table->addColumn();
		$columns->varchar('HOST_DOC_KEY', 128)->notNull();
		$columns->varchar('KEY_MODE', 8)->notNull()->default('legacy');
		$columns->int('OBJECT_ID')->notNull();
		$columns->int('VERSION_ID')->notNull()->default('0');
		$columns->int('SESSION_TYPE')->notNull();
		$columns->int('EXTERNAL_LINK_ID')->notNull()->default('0');
		$columns->varchar('CONTENT_GENERATION', 64)->notNull();
		$columns->int('EXPECTED_FILE_ID')->notNull();
		$columns->int('EXPECTED_CONTENT_VERSION')->notNull();
		$columns->varchar('EXPECTED_ETAG', 255)->notNull()->default('');
		$columns->bigInt('LAST_SNAPSHOT_SEQ')->notNull()->default('0');
		$columns->int('CONFLICT_OBJECT_ID');
		$columns->tinyInt('CONFLICTED')->notNull()->default('0');
		$columns->datetime('UPDATED_TIME')->notNull();
		$table->addUniqueIndex('UX_b_disk_vo_document_key', ['HOST_DOC_KEY']);
		$table->addIndex(
			'IX_b_disk_vo_document_scope',
			['OBJECT_ID', 'VERSION_ID', 'SESSION_TYPE', 'EXTERNAL_LINK_ID', 'KEY_MODE', 'ID'],
		);
		$table->addIndex('IX_b_disk_vo_document_expected_file', ['EXPECTED_FILE_ID']);
	},
);

$migration->table('b_disk_vo_session')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
		$table->addId();
		$columns = $table->addColumn();
		$columns->varchar('HOST_DOC_KEY', 128)->notNull();
		$columns->varchar('API_SESSION_ID', 36);
		$columns->int('DOCUMENT_SESSION_ID');
		$columns->varchar('OPEN_TOKEN', 36);
		$columns->varchar('EDITOR_KEY', 255);
		$columns->int('REV');
		$columns->varchar('STATUS', 16)->notNull();
		$columns->datetime('CREATE_TIME')->notNull();
		$columns->datetime('UPDATE_TIME')->notNull();
		$table->addUniqueIndex('UX_b_disk_vo_session_uuid', ['API_SESSION_ID']);
		$table->addUniqueIndex('UX_b_disk_vo_session_open', ['OPEN_TOKEN']);
		$table->addIndex('IX_b_disk_vo_session_document', ['HOST_DOC_KEY', 'STATUS']);
		$table->addIndex('IX_b_disk_vo_session_local', ['DOCUMENT_SESSION_ID', 'STATUS']);
		$table->addIndex('IX_b_disk_vo_session_history', ['HOST_DOC_KEY', 'ID']);
		$table->addIndex(
			'IX_b_disk_vo_session_generation',
			['HOST_DOC_KEY', 'EDITOR_KEY', 'STATUS', 'REV', 'API_SESSION_ID', 'OPEN_TOKEN', 'DOCUMENT_SESSION_ID'],
		);
	},
);

$migration->table('b_disk_vo_saved_snapshot')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
		$columns = $table->addColumn();
		$columns->varchar('HOST_DOC_KEY', 128)->notNull();
		$columns->bigInt('SNAPSHOT_SEQ')->notNull();
		$columns->int('RESULT_OBJECT_ID')->notNull();
		$columns->int('RESULT_VERSION_ID');
		$columns->bigInt('DELIVERY_ID');
		$columns->varchar('SOURCE', 16)->notNull();
		$table->addPrimaryKeys(['HOST_DOC_KEY', 'SNAPSHOT_SEQ']);
		$table->addIndex('IX_b_disk_vo_saved_snapshot_delivery', ['HOST_DOC_KEY', 'DELIVERY_ID']);
	},
);

$migration->table('b_disk_vibeoffice_delivery')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('DELIVERY_ID')->notNull();
	$columns->varchar('EXTERNAL_HASH', 128);
	$columns->varchar('EVENT', 64)->notNull();
	$columns->datetime('PROCESSED_TIME')->notNull();
	$columns->varchar('HOST_DOC_KEY', 128);
	$columns->varchar('STATUS', 24)->notNull()->default('done');
	$columns->varchar('OUTCOME', 16);
	$columns->varchar('REASON', 64);
	$columns->bigInt('SNAPSHOT_SEQ');
	$columns->int('RESULT_OBJECT_ID');
	$columns->int('RESULT_VERSION_ID');
	$columns->int('STAGED_FILE_ID');
	$columns->text('CLEANUP_FILE_IDS');
	$columns->tinyInt('NOTIFIED')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_DISK_VO_DELIVERY', ['DELIVERY_ID']);
	$table->addIndex('IX_DISK_VO_DELIVERY_PROCESSED_TIME', ['PROCESSED_TIME']);
	$table->addIndex('IX_b_disk_vibeoffice_delivery_document', ['HOST_DOC_KEY', 'SNAPSHOT_SEQ']);
	$table->addIndex('IX_b_disk_vibeoffice_delivery_cleanup', ['HOST_DOC_KEY', 'STATUS', 'PROCESSED_TIME']);
	$table->addIndex('IX_b_disk_vibeoffice_delivery_result', ['HOST_DOC_KEY', 'RESULT_OBJECT_ID', 'RESULT_VERSION_ID', 'ID']);
	$table->addIndex('IX_b_disk_vibeoffice_delivery_stage', ['STAGED_FILE_ID']);
});

$migration->table('b_disk_flipchart_annotation')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->varbinary('DOCUMENT_ID', 255)->notNull();
		$columns->int('OBJECT_ID')->notNull();
		$columns->int('VERSION_ID');
		$columns->varbinary('ANNOTATION_ID', 36)->notNull();
		$columns->varbinary('PARENT_ID', 26)->notNull();
		$columns->varbinary('EDGE', 6)->notNull();
		$columns->double('POSITION_T')->notNull();
		$columns->text('CONTENT')->notNull();
		$columns->blob('AUTHOR_ID')->notNull();
		$columns->datetime('CREATED_AT')->notNull();
		$columns->datetime('UPDATED_AT');
		$columns->datetime('DELETED_AT');
		$columns->varbinary('DELETE_REASON', 14);
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex(
			'UX_DISK_FLIPCHART_ANNOTATION_DOCUMENT_ANNOTATION',
			['DOCUMENT_ID', 'ANNOTATION_ID'],
		);
		$table->addIndex(
			'IX_DISK_FLIPCHART_ANNOTATION_LIST_CURSOR',
			['DOCUMENT_ID', 'DELETED_AT', 'CREATED_AT', 'ANNOTATION_ID'],
		);
		$table->addIndex(
			'IX_DISK_FLIPCHART_ANNOTATION_PARENT',
			['DOCUMENT_ID', 'PARENT_ID', 'DELETED_AT'],
		);
		$table->addIndex('IX_DISK_FLIPCHART_ANNOTATION_OBJECT', ['OBJECT_ID', 'DELETED_AT']);
	},
);


$migration->table('b_disk_flipchart_thread_state')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->char('thread_id', 36)->notNull();
		$columns->int('user_id')->notNull();
		$columns->tinyInt('important')->notNull()->default('0');
		$columns->tinyInt('pinned')->notNull()->default('0');
		$columns->datetime('pinned_at');
		$columns->datetime('created_at')->notNull();
		$columns->datetime('updated_at')->notNull();
		$table->addPrimaryKeys(['thread_id', 'user_id']);
		$table->addIndex('IX_DISK_FLIPCHART_THREAD_STATE_USER_THREAD', ['user_id', 'thread_id']);
		$table->addIndex('IX_DISK_FLIPCHART_THREAD_STATE_THREAD', ['thread_id']);
	},
);

$migration->table('b_disk_flipchart_comment_thread')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->int('OBJECT_ID')->notNull();
		$columns->blob('DOCUMENT_ID')->notNull();
		$columns->varbinary('THREAD_ID', 36)->notNull();
		$columns->blob('AUTHOR_ID')->notNull();
		$columns->double('COORD_X')->notNull();
		$columns->double('COORD_Y')->notNull();
		$columns->varbinary('PARENT_ID', 26);
		$columns->double('WIDTH');
		$columns->double('HEIGHT');
		$columns->datetime('CREATED_AT')->notNull();
		$columns->datetime('RESOLVED_AT');
		$columns->blob('RESOLVED_BY');
		$columns->datetime('DELETED_AT');
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex('UX_DISK_FLIPCHART_COMMENT_THREAD_UUID', ['THREAD_ID']);
		$table->addIndex('IX_DISK_FLIPCHART_COMMENT_THREAD_LIST', ['OBJECT_ID', 'DELETED_AT', 'CREATED_AT']);
	},
);

$migration->table('b_disk_flipchart_comment')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->varbinary('THREAD_ID', 36)->notNull();
		$columns->int('COMMENT_ID')->notNull();
		$columns->blob('AUTHOR_ID')->notNull();
		$columns->longText('CONTENT')->notNull();
		$columns->longText('ATTACHED');
		$columns->datetime('CREATED_AT')->notNull();
		$columns->datetime('EDITED_AT');
		$columns->datetime('DELETED_AT');
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex('UX_DISK_FLIPCHART_COMMENT_NUMBER', ['THREAD_ID', 'COMMENT_ID']);
		$table->addIndex('IX_DISK_FLIPCHART_COMMENT_ORDER', ['THREAD_ID', 'DELETED_AT', 'COMMENT_ID']);
	},
);

$migration->table('b_disk_flipchart_comment_mention')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->bigInt('COMMENT_ROW_ID')->notNull();
		$columns->blob('USER_ID')->notNull();
		$table->addPrimaryKey('ID');
		$table->addIndex('IX_DISK_FLIPCHART_COMMENT_MENTION_COMMENT', ['COMMENT_ROW_ID']);
	},
);

$migration->table('b_disk_flipchart_comment_reaction')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->bigInt('COMMENT_ROW_ID')->notNull();
		$columns->varbinary('USER_ID', 32)->notNull();
		$columns->varbinary('EMOJI', 320)->notNull();
		$columns->datetime('CREATED_AT')->notNull();
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex(
			'UX_DISK_FLIPCHART_COMMENT_REACTION_USER_EMOJI',
			['COMMENT_ROW_ID', 'USER_ID', 'EMOJI'],
		);
	},
);

$migration->table('b_disk_flipchart_comment_read')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->varbinary('THREAD_ID', 36)->notNull();
		$columns->varbinary('USER_ID', 32)->notNull();
		$columns->int('LAST_READ_COMMENT_ID')->notNull();
		$columns->datetime('UPDATED_AT')->notNull();
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex(
			'UX_DISK_FLIPCHART_COMMENT_READ_THREAD_USER',
			['THREAD_ID', 'USER_ID'],
		);
	},
);

$migration->table('b_disk_flipchart_comment_read_all')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->int('OBJECT_ID')->notNull();
		$columns->varbinary('USER_ID', 32)->notNull();
		$columns->bigInt('MAX_COMMENT_ROW_ID')->notNull();
		$columns->datetime('UPDATED_AT')->notNull();
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex(
			'UX_DISK_FLIPCHART_COMMENT_READ_ALL_BOARD_USER',
			['OBJECT_ID', 'USER_ID'],
		);
	},
);

$migration->table('b_disk_flipchart_comment_attachment')->create(
	static function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$columns = $table->addColumn();
		$columns->bigInt('ID')->notNull()->autoincrement();
		$columns->int('OBJECT_ID')->notNull();
		$columns->int('FILE_ID')->notNull();
		$columns->varbinary('PATH', 255)->notNull();
		$columns->varbinary('OWNER_ID', 32)->notNull();
		$columns->bigInt('COMMENT_ROW_ID');
		$columns->datetime('CREATED_AT')->notNull();
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex('UX_DISK_FLIPCHART_COMMENT_ATTACHMENT_PATH', ['PATH']);
		$table->addUniqueIndex('UX_DISK_FLIPCHART_COMMENT_ATTACHMENT_FILE', ['FILE_ID']);
		$table->addIndex('IX_DISK_FLIPCHART_COMMENT_ATTACHMENT_BOARD', ['OBJECT_ID']);
		$table->addIndex(
			'IX_DISK_FLIPCHART_COMMENT_ATTACHMENT_CLEANUP',
			['COMMENT_ROW_ID', 'CREATED_AT'],
		);
	},
);

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
	$table->addIndex('IX_DISK_TO_6', ['USER_ID', 'UPDATE_TIME', 'OBJECT_ID']);
	$table->addIndex('IX_DISK_TO_7', ['UPDATE_TIME']);
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

$migration->table('b_disk_sync_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('APP_ID', 128)->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('SNAPSHOT_TOKEN_EXPIRES_AT')->notNull();
	$columns->datetime('BOUND_MODIFIED_AT')->notNull();
	$columns->datetime('BOUND_INTERACTED_AT')->notNull();
	$columns->int('EFFECTIVE_DEPTH_DAYS')->notNull();
	$columns->int('PLANNED_POLL_INTERVAL')->notNull();
	$columns->text('STORAGE_IDS');
	// The checkpoints of visibility the user holds in storages of other people, grouped by storage. A long
	// text and not a text: the value has no upper bound of its own - it grows with what is shared to one
	// person - while a text stops at 65 535 bytes.
	$columns->longText('CHECKPOINTS_BY_STORAGE');
	$table->addUniqueIndex('IX_DISK_SS_1', ['USER_ID', 'APP_ID']);
	$table->addIndex('IX_DISK_SS_2', ['SNAPSHOT_TOKEN_EXPIRES_AT']);
	$table->addIndex('IX_DISK_SS_3', ['CREATED_AT', 'ID']);
});

$migration->table('b_disk_sync_access_snapshot')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('APP_ID', 128)->notNull();
	$columns->int('REVISION')->notNull()->default('0');
	$columns->varchar('CODES_HASH', 64)->notNull();
	$columns->longText('CODES');
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addUniqueIndex('IX_DISK_SAS_1', ['USER_ID', 'APP_ID']);
	$table->addIndex('IX_DISK_SAS_2', ['UPDATED_AT']);
});

$migration->table('b_disk_sync_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->varchar('CHANGE_TYPE', 32)->notNull();
	$columns->varchar('OPERATION', 16);
	$columns->varchar('RESOURCE_TYPE', 16);
	$columns->int('RESOURCE_ID');
	$columns->int('AUTHOR_ID');
	// The database stamps the time, not php: Disk writes time in php, and the clock skew between the
	// nodes writing it would land in the order the journal is read by.
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->text('CHANGED_FIELDS');
	$columns->varchar('TOMBSTONE_REASON', 32);
	$columns->varchar('ACCESS_SCOPE', 16);
	$columns->int('SCOPE_OBJECT_ID');
	$columns->tinyInt('AFFECTS_DESCENDANTS')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	// History of one object: the reconciliation of a card reads it, and so does a republication
	// checking whether it has already written the same change.
	$table->addIndex('IX_DISK_SL_1', ['RESOURCE_TYPE', 'RESOURCE_ID', 'ID']);
	// Age, for the cleanup. It is laid down together with the column the retention is counted from:
	// a cleanup without an index of its own is switched off in practice, and the bounded storage
	// the journal is designed around dies with it.
	$table->addIndex('IX_DISK_SL_2', ['CREATED_AT']);
});

$migration->table('b_disk_sync_log_code')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('LOG_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_DISK_SLC_1', ['LOG_ID', 'ACCESS_CODE']);
	// Both the filter of a personal page and its order: the identifier of the record lies in the same
	// table the filter by code reads, so no join sorts the page by a foreign table. One monotonic
	// identifier is the whole cursor, so the time needs no second copy here.
	$table->addIndex('IX_DISK_SLC_2', ['ACCESS_CODE', 'LOG_ID']);
});

$migration->table('b_disk_sync_rights_snapshot')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SETUP_SESSION_ID')->notNull();
	$columns->int('OBJECT_ID')->notNull();
	$columns->longText('CODES');
	$columns->datetime('CREATED_AT')->notNull();
	// One snapshot per recalculation: the session both addresses the row and keeps a repeated capture
	// from storing the state after the edit as the state before it.
	$table->addUniqueIndex('IX_DISK_SRS_1', ['SETUP_SESSION_ID']);
	// Age, for the orphans. A recalculation that was interrupted or hung leaves its snapshot behind with
	// nothing else marking it as abandoned, so the portioned cleanup has no other predicate to lean on.
	$table->addIndex('IX_DISK_SRS_2', ['CREATED_AT']);
});
