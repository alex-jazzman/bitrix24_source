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
	// The collection's "About the knowledge base" description: one main document per collection,
	// kept out of the document tree (PARENT_ID is always NULL).
	$columns->char('IS_MAIN', 1)->notNull()->default('N');
	$columns->datetime('ARCHIVED_AT');
	$columns->int('ARCHIVED_BY');
	$columns->int('CREATED_BY')->notNull();
	$columns->int('UPDATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	// [SQL-01] Moment the MARKDOWN projection was built. Distinct from UPDATED_AT, which structural
	// operations (archive/move) also bump. Nullable, no backfill: an old row's projection predates
	// this column, so NULL reads as "projection age unknown". No DB default: writers set it explicitly.
	$columns->datetime('CONTENT_UPDATED_AT');
	// [SQL-01] Internal cursor: id of the last patch folded into the projection (meaningful for yjs only).
	// bigint, not int: the value is an id from b_note_document_updates, and the forward-only guard makes
	// a truncated cursor permanent - once a value above every real patch id is stored, no later
	// projection write is ever accepted and MARKDOWN freezes. The journal is still int; when it grows to
	// bigint this column must already be wide enough to hold what it stores.
	$columns->bigInt('MATERIALIZED_UPTO_ID');
	// [SQL-01] Dirty flag "derived projections (search, links) need a rebuild". The freshness agent
	// drains 'Y'. Old rows default to 'N' — prior compactions already indexed them.
	$columns->char('IS_DERIVED_STALE', 1)->notNull()->default('N');
	$table->addIndex('IX_NOTE_DOC_BRANCH', ['COLLECTION_ID', 'PARENT_ID', 'IS_ARCHIVED', 'POSITION', 'ID']);
	$table->addIndex('IX_NOTE_DOC_BRANCH_REORDER', ['COLLECTION_ID', 'PARENT_ID', 'POSITION']);
	$table->addIndex('IX_NOTE_DOC_ARCHIVE', ['IS_ARCHIVED', 'ARCHIVED_AT', 'ID']);
	// Plain btree; pgsql varchar_pattern_ops converged by updater (task 715284).
	$table->addIndex('IX_NOTE_DOC_TITLE', ['IS_ARCHIVED', 'TITLE']);
	$table->addIndex('IX_NOTE_DOC_MAIN', ['COLLECTION_ID', 'IS_MAIN']);
	// Dirty-queue scan for the freshness agent: WHERE IS_DERIVED_STALE='Y' ... ORDER BY ID.
	$table->addIndex('IX_NOTE_DOC_DERIVED_STALE', ['IS_DERIVED_STALE', 'ID']);
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
	// Inheritance source; 0 is the sentinel for an explicit (non-inherited) grant. NOT NULL because
	// NULL counts as distinct in a unique index on both MySQL and PostgreSQL and would break row uniqueness.
	$columns->int('SOURCE_DOCUMENT_ID')->notNull()->default('0');
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	// Source-aware unique (fresh install). Upgraded portals converge to the same name via the
	// updater, which drops the legacy 2-column IX_NOTE_DOCUMENT_ACCESS_UNIQ and adds this one.
	$table->addUniqueIndex('IX_NOTE_DOC_ACCESS_SRC_UNIQ', ['DOCUMENT_ID', 'SUBJECT_CODE', 'SOURCE_DOCUMENT_ID']);
	$table->addIndex('IX_NOTE_DOC_ACCESS_SUBJECT', ['SUBJECT_CODE', 'DOCUMENT_ID', 'LEVEL']);
	$table->addIndex('IX_NOTE_DOC_ACCESS_SOURCE', ['SOURCE_DOCUMENT_ID', 'DOCUMENT_ID']);
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

$migration->table('b_note_event')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->varchar('SCOPE', 10)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('EVENT_TYPE', 32)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('VERSION_ID');
	// CREATED_AT is always supplied by the app on insert, so no DB default (parity with legacy schema).
	$columns->datetime('CREATED_AT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_NOTE_EVENT_FEED', ['SCOPE', 'ENTITY_ID', 'ID']);
	$table->addIndex('IX_NOTE_EVENT_FEED_TS', ['SCOPE', 'ENTITY_ID', 'CREATED_AT', 'ID']);
	// Newest event of one type on one entity: compaction asks for it on every run, and without
	// EVENT_TYPE in the index that walk goes back through the whole feed of the document discarding
	// foreign types. EVENT_TYPE sits before ID, so the equality prefix leaves the scan ordered by ID
	// and the LIMIT 1 needs no sort. The two indexes above stay: with EVENT_TYPE in the middle this
	// one cannot serve the type-agnostic feed reads without a filesort.
	$table->addIndex('IX_NOTE_EVENT_TYPE', ['SCOPE', 'ENTITY_ID', 'EVENT_TYPE', 'ID']);
});

$migration->table('b_note_document_version')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->mediumText('MARKDOWN')->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$table->addIndex('IX_NOTE_DOC_VERSION', ['DOCUMENT_ID', 'ID']);
	$table->addIndex('IX_NOTE_DOC_VERSION_TTL', ['CREATED_AT']);
});

$migration->table('b_note_event_author')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('EVENT_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$table->addPrimaryKeys(['EVENT_ID', 'USER_ID']);
});

$migration->table('b_note_document_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('VIEWED_AT')->notNull();
	$table->addPrimaryKeys(['DOCUMENT_ID', 'USER_ID']);
	$table->addIndex('IX_NOTE_DOC_VIEW_RECENT', ['DOCUMENT_ID', 'VIEWED_AT', 'USER_ID']);
});

$migration->table('b_note_subscription')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('SCOPE', 10)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('MODE', 10)->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$table->addUniqueIndex('IX_NOTE_SUB_UNIQ', ['USER_ID', 'SCOPE', 'ENTITY_ID']);
	$table->addIndex('IX_NOTE_SUB_TARGET', ['SCOPE', 'ENTITY_ID']);
});

$migration->table('b_note_favorite')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 10)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('POSITION')->notNull()->default('0');
	$columns->datetime('CREATED_AT')->notNull();
	$table->addUniqueIndex('IX_NOTE_FAV_UNIQ', ['USER_ID', 'ENTITY_TYPE', 'ENTITY_ID']);
	// Serves the only read pattern: one user's page ordered by (POSITION DESC, ID DESC).
	$table->addIndex('IX_NOTE_FAV_PAGE', ['USER_ID', 'POSITION', 'ID']);
	// Cascade cleanup filters by target only, so neither user-first index above applies to it.
	$table->addIndex('IX_NOTE_FAV_TARGET', ['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_note_document_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('SOURCE_ID')->notNull();
	$columns->int('TARGET_ID')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	// Also the only index needed for the forward direction: reads by source hit its leading column.
	$table->addUniqueIndex('UX_NOTE_DOCLINK_PAIR', ['SOURCE_ID', 'TARGET_ID']);
	// Backlink read: sources of one target, covered so the row lookup is skipped.
	$table->addIndex('IX_NOTE_DOCLINK_TARGET', ['TARGET_ID', 'SOURCE_ID']);
});

