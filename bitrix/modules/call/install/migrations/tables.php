<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_call_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TYPE');
	$columns->int('SCHEME');
	$columns->int('INITIATOR_ID');
	$columns->char('IS_PUBLIC', 1)->notNull()->default('N');
	$columns->varchar('PUBLIC_ID', 32);
	$columns->varchar('PROVIDER', 32);
	$columns->varchar('ENTITY_TYPE', 32);
	$columns->varchar('ENTITY_ID', 32);
	$columns->int('PARENT_ID');
	$columns->varchar('PARENT_UUID', 36);
	$columns->varchar('STATE', 50);
	$columns->datetime('START_DATE');
	$columns->datetime('END_DATE');
	$columns->int('CHAT_ID');
	$columns->varchar('LOG_URL', 2000);
	$columns->varchar('UUID', 36);
	$columns->varchar('SECRET_KEY', 10);
	$columns->varchar('ENDPOINT', 255);
	$columns->char('RECORD_AUDIO', 1)->notNull()->default('N');
	$columns->char('AI_ANALYZE', 1)->notNull()->default('N');
	$table->addUniqueIndex('IX_CALL_PID', ['PUBLIC_ID']);
	$table->addIndex('IX_CALL_ENT_TYPE', ['ENTITY_TYPE', 'ENTITY_ID', 'TYPE', 'PROVIDER', 'END_DATE']);
	$table->addIndex('IX_CALL_CHAT_ID', ['CHAT_ID']);
	$table->addIndex('IX_CALL_UUID', ['UUID']);
	$table->addIndex('IX_CALL_STATE_START', ['STATE', 'START_DATE']);
});

$migration->table('b_call_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CALL_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('STATE', 50);
	$columns->datetime('FIRST_JOINED');
	$columns->datetime('LAST_SEEN');
	$columns->char('IS_MOBILE', 1);
	$columns->char('SHARED_SCREEN', 1);
	$columns->char('RECORDED', 1);
	$table->addPrimaryKeys(['CALL_ID', 'USER_ID']);
});

$migration->table('b_call_conference')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ALIAS_ID')->notNull();
	$columns->text('PASSWORD');
	$columns->text('INVITATION');
	$columns->char('IS_BROADCAST', 1)->notNull()->default('N');
	$columns->datetime('CONFERENCE_START');
	$columns->datetime('CONFERENCE_END');
	$table->addPrimaryKey('ID');
});

$migration->table('b_call_conference_user_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CONFERENCE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ROLE', 64);
	$table->addPrimaryKeys(['CONFERENCE_ID', 'USER_ID']);
});

$migration->table('b_call_chat_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('CALL_TOKEN_VERSION')->notNull();
	$table->addIndex('IX_CALL_CHAT_ID', ['CHAT_ID']);
});

$migration->table('b_call_track')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CALL_ID')->notNull();
	$columns->int('EXTERNAL_TRACK_ID');
	$columns->int('FILE_ID');
	$columns->int('DISK_FILE_ID');
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->varchar('TYPE', 50);
	$columns->int('DURATION');
	$columns->text('DOWNLOAD_URL');
	$columns->varchar('FILE_NAME', 100);
	$columns->bigInt('FILE_SIZE');
	$columns->varchar('FILE_MIME_TYPE', 50);
	$columns->char('DOWNLOADED', 1)->notNull()->default('N');
	$columns->varchar('TEMP_PATH', 255);
	$table->addIndex('IX_CALL_TRACK_CALL', ['CALL_ID', 'TYPE']);
	$table->addIndex('IX_CALL_TRACK_ADDED', ['DATE_CREATE']);
	$table->addIndex('IX_CALL_TRACK_EXT', ['EXTERNAL_TRACK_ID']);
});

$migration->table('b_call_ai_task')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CALL_ID')->notNull();
	$columns->int('TRACK_ID');
	$columns->int('OUTCOME_ID');
	$columns->varchar('TYPE', 50);
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('DATE_FINISHED');
	$columns->varchar('STATUS', 32)->notNull();
	$columns->varchar('HASH', 50);
	$columns->varchar('LANGUAGE_ID', 10);
	$columns->varchar('ERROR_CODE', 100);
	$columns->text('ERROR_MESSAGE');
	$table->addIndex('IX_CALL_AI_QUEUE_HASH', ['HASH']);
	$table->addIndex('IX_CALL_AI_QUEUE_CALL', ['CALL_ID']);
	$table->addIndex('IX_CALL_AI_QUEUE_TRACK', ['TRACK_ID']);
	$table->addIndex('IX_CALL_AI_QUEUE_OUTCOME', ['OUTCOME_ID']);
	$table->addIndex('IX_CALL_AI_QUEUE_ADDED', ['DATE_CREATE']);
});

$migration->table('b_call_outcome')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CALL_ID')->notNull();
	$columns->int('TRACK_ID');
	$columns->varchar('TYPE', 50);
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->varchar('LANGUAGE_ID', 10);
	$columns->longText('CONTENT');
	$table->addIndex('IX_CALL_OUTCOME_CALL', ['CALL_ID', 'TYPE']);
	$table->addIndex('IX_CALL_OUTCOME_TRACK', ['TRACK_ID']);
	$table->addIndex('IX_CALL_OUTCOME_ADDED', ['DATE_CREATE']);
});

$migration->table('b_call_outcome_property')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('OUTCOME_ID')->notNull();
	$columns->varchar('CODE', 100)->notNull();
	$columns->longText('CONTENT');
	$table->addIndex('IX_CALL_OUTCOME_PROP_OUTCOME', ['OUTCOME_ID']);
	$table->addIndex('IX_CALL_OUTCOME_PROP_TYPE', ['OUTCOME_ID', 'CODE']);
});

$migration->table('b_call_userlog')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('SOURCE_TYPE', 64)->notNull();
	$columns->int('SOURCE_CALL_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('STATUS', 64)->notNull();
	$columns->datetime('STATUS_TIME')->notNull();
	$table->addUniqueIndex('UX_SOURCE_USER', ['SOURCE_TYPE', 'SOURCE_CALL_ID', 'USER_ID']);
	$table->addIndex('IX_USER_STATUS_TIME', ['USER_ID', 'STATUS_TIME', 'ID']);
	$table->addIndex('IX_USER_STATUS', ['USER_ID', 'STATUS']);
	$table->addIndex('IX_STATUS_TIME', ['STATUS_TIME']);
});

$migration->table('b_call_userlog_counters')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USERLOG_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$table->addUniqueIndex('UX_USERLOG_USER', ['USERLOG_ID', 'USER_ID']);
	$table->addIndex('IX_USER_ID', ['USER_ID']);
});

$migration->table('b_call_userlog_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USERLOG_ID')->notNull();
	$columns->mediumText('SEARCH_CONTENT');
	$columns->varchar('SEARCH_TITLE', 511);
	$table->addPrimaryKey('USERLOG_ID');
	// Both fulltext indexes below are created on a fresh install. On MySQL, create() over an
	// already-existing table renders no DDL at all - not only for indexes that already exist,
	// but for the whole statement, because the column list itself comes back empty once the
	// table exists (CreateTableBuilder) and the renderer returns before ever reaching the index
	// list (MysqlRenderer::renderCreateTable()). PostgreSQL still renders indexes independently
	// of columns, so there the actual risk is the platform's column-composition dedup not
	// distinguishing fulltext from a regular index on the same column.
	// Reconciling an existing portal is not the installer's job either way - Table::alter() is a
	// deliberate no-op under ModuleInstall. The site checker (which reads this same declaration)
	// and the versioned updater are the intended surfaces for that; see
	// call/dev/updates/25/25.1400.0/updater.php, which already backfills IXF_CALL_USERLOG_INDEX_1
	// for portals that installed before it shipped. SEARCH_CONTENT is read by
	// CallLogService::searchCallLogs(); SEARCH_TITLE's fulltext twin has no query of its own here.
	$table->addIndex('IX_CALL_USERLOG_INDEX_1', ['SEARCH_TITLE(128)']);
	$table->addFulltextIndex('IXF_CALL_USERLOG_INDEX_1', ['SEARCH_CONTENT']);
	$table->addFulltextIndex('IXF_CALL_USERLOG_INDEX_2', ['SEARCH_TITLE']);
});

