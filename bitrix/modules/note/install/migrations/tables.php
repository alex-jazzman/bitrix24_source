<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_note_collection')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->int('POSITION')->notNull()->default('0');
	$columns->int('POLICY_LEVEL')->notNull()->default('0');
	$columns->char('IS_ARCHIVED', 1)->notNull()->default('N');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->int('UPDATED_BY')->notNull();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_NOTE_COLL_SORT', ['IS_ARCHIVED', 'POSITION', 'ID']);
});

$migration->table('b_note_document')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('COLLECTION_ID')->notNull();
	$columns->int('PARENT_ID');
	$columns->varchar('TITLE', 255)->notNull();
	$columns->mediumText('MARKDOWN')->notNull();
	$columns->mediumText('YJS_STATE');
	$columns->varchar('CONTENT_FORMAT', 5)->notNull()->default('yjs');
	$columns->int('POSITION')->notNull()->default('0');
	$columns->char('IS_ARCHIVED', 1)->notNull()->default('N');
	$columns->datetime('ARCHIVED_AT');
	$columns->int('ARCHIVED_BY');
	$columns->int('CREATED_BY')->notNull();
	$columns->int('UPDATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_NOTE_DOC_BRANCH', ['COLLECTION_ID', 'PARENT_ID', 'IS_ARCHIVED', 'POSITION', 'ID']);
	$table->addIndex('IX_NOTE_DOC_BRANCH_REORDER', ['COLLECTION_ID', 'PARENT_ID', 'POSITION']);
	$table->addIndex('IX_NOTE_DOC_ARCHIVE', ['IS_ARCHIVED', 'ARCHIVED_AT', 'ID']);
	// Plain btree; pgsql varchar_pattern_ops converged by updater (task 715284).
	$table->addIndex('IX_NOTE_DOC_TITLE', ['IS_ARCHIVED', 'TITLE']);
});

$migration->table('b_note_document_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKeys(['DOCUMENT_ID', 'FILE_ID']);
	$table->addUniqueIndex('IX_NOTE_DOC_FILE_UNIQ_FILE', ['FILE_ID']);
});

$migration->table('b_note_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('NAME', 250)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_note_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('RELATION', 8)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_NOTE_ROLE_REL', ['ROLE_ID', 'RELATION']);
});

$migration->table('b_note_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('PERMISSION_ID', 32)->notNull()->default('0');
	$columns->int('VALUE')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_NOTE_PERM', ['ROLE_ID', 'PERMISSION_ID', 'VALUE']);
});

$migration->table('b_note_collection_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('COLLECTION_ID')->notNull();
	$columns->varchar('SUBJECT_CODE', 50)->notNull();
	$columns->int('LEVEL')->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('IX_NOTE_COLLECTION_ACCESS_UNIQ', ['COLLECTION_ID', 'SUBJECT_CODE']);
	$table->addIndex('IX_NOTE_COLL_ACCESS_SUBJECT', ['SUBJECT_CODE', 'COLLECTION_ID', 'LEVEL']);
});

$migration->table('b_note_document_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->varchar('SUBJECT_CODE', 50)->notNull();
	$columns->int('LEVEL')->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('IX_NOTE_DOCUMENT_ACCESS_UNIQ', ['DOCUMENT_ID', 'SUBJECT_CODE']);
	$table->addIndex('IX_NOTE_DOC_ACCESS_SUBJECT', ['SUBJECT_CODE', 'DOCUMENT_ID', 'LEVEL']);
});

$migration->table('b_note_import_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CREATED_BY')->notNull();
	$columns->varchar('STATUS', 32)->notNull()->default('connecting');
});

$migration->table('b_note_import_map')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('SOURCE_TYPE', 32)->notNull();
	$columns->varchar('EXTERNAL_ID', 128)->notNull();
	$columns->varchar('URL_ID', 16);
	$columns->int('DOCUMENT_ID');
	$columns->int('COLLECTION_ID');
	$table->addUniqueIndex('UX_IMPORT_MAP', ['SOURCE_TYPE', 'EXTERNAL_ID']);
	$table->addIndex('IX_IMPORT_MAP_URL_ID', ['SOURCE_TYPE', 'URL_ID']);
});

$migration->table('b_note_unresolved_mention')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->varchar('SOURCE_TYPE', 32)->notNull();
	$columns->varchar('EXTERNAL_ID', 128)->notNull();
	$table->addIndex('IX_UNRESOLVED', ['SOURCE_TYPE', 'EXTERNAL_ID']);
	$table->addIndex('IX_UNRESOLV_DOC', ['DOCUMENT_ID']);
});

$migration->table('b_note_document_updates')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->mediumText('PATCH')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_NOTE_DOC_UPD_DOCID', ['DOCUMENT_ID', 'ID']);
});

$migration->table('b_note_document_search')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->mediumText('BODY')->notNull();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addUniqueIndex('UX_NOTE_DOCUMENT_SEARCH_DOCUMENT', ['DOCUMENT_ID']);
	$table->addFulltextIndex('FT_NOTE_DOCUMENT_SEARCH_BODY', ['BODY']);
});

$migration->table('b_note_recycle_bin')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->datetime('TRASHED_AT')->notNull();
	$columns->int('TRASHED_BY')->notNull();
	$columns->varchar('ORIGIN', 40)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_NOTE_RECYCLEBIN_DOC', ['DOCUMENT_ID']);
	$table->addIndex('IX_NOTE_RECYCLEBIN_AT_ID', ['TRASHED_AT', 'ID']);
	$table->addIndex('IX_NOTE_RECYCLEBIN_BY', ['TRASHED_BY']);
});

