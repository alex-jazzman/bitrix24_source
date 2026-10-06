<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_landing')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 255);
	$columns->varchar('INITIATOR_APP_CODE', 255);
	$columns->varchar('RULE', 255);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('DELETED', 1)->notNull()->default('N');
	$columns->char('PUBLIC', 1)->notNull()->default('Y');
	$columns->char('SYS', 1)->notNull()->default('N');
	$columns->int('VIEWS')->notNull()->default('0');
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('XML_ID', 255);
	$columns->varchar('DESCRIPTION', 255);
	$columns->int('TPL_ID');
	$columns->varchar('TPL_CODE', 255);
	$columns->int('SITE_ID')->notNull();
	$columns->char('SITEMAP', 1)->notNull()->default('N');
	$columns->char('FOLDER', 1)->notNull()->default('N');
	$columns->int('FOLDER_ID');
	$columns->mediumText('SEARCH_CONTENT');
	$columns->int('VERSION')->notNull()->default('1');
	$columns->int('HISTORY_STEP')->notNull()->default('0');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$columns->timestamp('DATE_PUBLIC');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_LAND_CODE', ['CODE']);
	$table->addIndex('IX_B_LAND_ACTIVE', ['ACTIVE']);
	$table->addIndex('IX_B_LAND_DELETED', ['DELETED']);
	$table->addIndex('IX_B_LAND_SYS', ['SYS']);
	$table->addIndex('IX_B_LAND_XML_ID', ['XML_ID']);
	$table->addIndex('IX_B_LAND_SITE_ID', ['SITE_ID']);
	$table->addIndex('IX_B_LAND_SITEMAP', ['SITEMAP']);
	$table->addIndex('IX_B_LAND_FOLDER', ['FOLDER']);
	$table->addIndex('IX_B_LAND_FOLDER_ID', ['FOLDER_ID']);
	$table->addFulltextIndex('IX_B_LANDING_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_landing_block')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PARENT_ID');
	$columns->int('LID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('TPL_CODE', 255);
	$columns->varchar('XML_ID', 255);
	$columns->varchar('INITIATOR_APP_CODE', 255)->notNull();
	$columns->varchar('ANCHOR', 255);
	$columns->int('SORT')->default('500');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('PUBLIC', 1)->notNull()->default('Y');
	$columns->char('DELETED', 1)->notNull()->default('N');
	$columns->char('DESIGNED', 1)->notNull()->default('N');
	$columns->char('ACCESS', 1)->notNull()->default('X');
	$columns->mediumText('SOURCE_PARAMS');
	$columns->mediumText('CONTENT')->notNull();
	$columns->mediumText('SEARCH_CONTENT');
	$columns->text('ASSETS');
	$columns->text('FAVORITE_META');
	$columns->int('HISTORY_STEP_DESIGNER')->notNull()->default('0');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_BLOCK_LID', ['LID']);
	$table->addIndex('IX_B_BLOCK_LID_PUBLIC', ['LID', 'PUBLIC']);
	$table->addIndex('IX_B_BLOCK_CODE', ['CODE']);
	$table->addIndex('IX_B_BLOCK_ACTIVE', ['ACTIVE']);
	$table->addIndex('IX_B_BLOCK_PUBLIC', ['PUBLIC', 'DATE_CREATE']);
	$table->addIndex('IX_B_BLOCK_DELETED', ['DELETED']);
	$table->addFulltextIndex('IX_B_BLOCK_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_landing_site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('DELETED', 1)->notNull()->default('N');
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('XML_ID', 255);
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('TYPE', 50)->notNull()->default('PAGE');
	$columns->int('TPL_ID');
	$columns->varchar('TPL_CODE', 255);
	$columns->int('DOMAIN_ID')->notNull();
	$columns->char('SMN_SITE_ID', 2);
	$columns->int('LANDING_ID_INDEX');
	$columns->int('LANDING_ID_404');
	$columns->int('LANDING_ID_503');
	$columns->char('LANG', 2);
	$columns->char('SPECIAL', 1)->notNull()->default('N');
	$columns->int('VERSION');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SITE_CODE', ['CODE']);
	$table->addIndex('IX_B_SITE_ACTIVE', ['ACTIVE']);
	$table->addIndex('IX_B_SITE_DELETED', ['DELETED']);
	$table->addIndex('IX_B_SITE_XML_ID', ['XML_ID']);
	$table->addIndex('IX_B_SITE_SPECIAL', ['SPECIAL']);
});

$migration->table('b_landing_domain')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('DOMAIN', 255)->notNull();
	$columns->varchar('PREV_DOMAIN', 255);
	$columns->varchar('XML_ID', 255);
	$columns->varchar('PROTOCOL', 10)->notNull();
	$columns->varchar('PROVIDER', 50);
	$columns->int('FAIL_COUNT');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_DOMAIN_ACTIVE', ['ACTIVE']);
	$table->addIndex('IX_B_DOMAIN_DOMAIN', ['DOMAIN']);
	$table->addIndex('IX_B_DOMAIN_PROVIDER', ['PROVIDER']);
	$table->addIndex('IX_B_DOMAIN_XML_ID', ['XML_ID']);
});

$migration->table('b_landing_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('SORT')->default('100');
	$columns->varchar('XML_ID', 255);
	$columns->text('CONTENT')->notNull();
	$columns->int('AREA_COUNT')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_landing_template_ref')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->int('AREA')->notNull();
	$columns->int('LANDING_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('K_LANDING_ID', ['LANDING_ID']);
	$table->addIndex('K_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_landing_repo')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('XML_ID', 255)->notNull();
	$columns->varchar('APP_CODE', 255);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('SECTIONS', 255);
	$columns->varchar('SITE_TEMPLATE_ID', 255);
	$columns->varchar('PREVIEW', 255);
	$columns->text('MANIFEST');
	$columns->text('CONTENT')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_REPO_ACTIVE', ['ACTIVE']);
	$table->addIndex('IX_B_REPO_XML_ID', ['XML_ID']);
	$table->addIndex('IX_B_REPO_APP_CODE', ['APP_CODE']);
	$table->addIndex('IX_B_REPO_TEMPLATE_ID', ['SITE_TEMPLATE_ID']);
});

$migration->table('b_landing_hook_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->varchar('HOOK', 50)->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->text('VALUE');
	$columns->char('PUBLIC', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('K_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('K_HOOK_CODE', ['HOOK', 'CODE']);
});

$migration->table('b_landing_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->int('FILE_ID')->notNull();
	$columns->char('TEMP', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_FILE', ['FILE_ID']);
	$table->addIndex('IX_TEMP', ['TEMP']);
});

$migration->table('b_landing_syspage')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('SITE_ID')->notNull();
	$columns->varchar('TYPE', 50)->notNull();
	$columns->int('LANDING_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SITE_ID', ['SITE_ID']);
	$table->addIndex('IX_LANDING_ID', ['LANDING_ID']);
});

$migration->table('b_landing_demo')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('XML_ID', 255)->notNull();
	$columns->varchar('APP_CODE', 255);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('TYPE', 10)->notNull();
	$columns->char('TPL_TYPE', 1)->notNull();
	$columns->char('SHOW_IN_LIST', 1)->notNull()->default('N');
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('PREVIEW_URL', 255);
	$columns->varchar('PREVIEW', 255);
	$columns->varchar('PREVIEW2X', 255);
	$columns->varchar('PREVIEW3X', 255);
	$columns->mediumText('MANIFEST');
	$columns->text('LANG');
	$columns->varchar('SITE_TEMPLATE_ID', 255);
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_DEMO_ACTIVE', ['ACTIVE']);
	$table->addIndex('IX_B_DEMO_SHOW_IN_LIST', ['SHOW_IN_LIST']);
	$table->addIndex('IX_B_DEMO_XML_ID', ['XML_ID']);
	$table->addIndex('IX_B_DEMO_APP_CODE', ['APP_CODE']);
	$table->addIndex('IX_B_DEMO_TEMPLATE_ID', ['SITE_TEMPLATE_ID']);
});

$migration->table('b_landing_placement')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID');
	$columns->varchar('PLACEMENT', 255)->notNull();
	$columns->varchar('PLACEMENT_HANDLER', 255)->notNull();
	$columns->varchar('TITLE', 255)->default('');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_landing_update_block')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$columns->int('LAST_BLOCK_ID')->default('0');
	$columns->text('PARAMS');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CODE', ['CODE']);
});

$migration->table('b_landing_urlrewrite')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('SITE_ID')->notNull();
	$columns->varchar('RULE', 255)->notNull();
	$columns->int('LANDING_ID')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SITE_RULE', ['SITE_ID', 'RULE']);
	$table->addIndex('IX_LANDING_ID', ['LANDING_ID']);
});

$migration->table('b_landing_entity_rights')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->int('TASK_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 50)->notNull();
	$columns->int('ROLE_ID')->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_ROLE', ['ROLE_ID']);
});

$migration->table('b_landing_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TITLE', 255);
	$columns->varchar('XML_ID', 255);
	$columns->varchar('TYPE', 255);
	$columns->text('ACCESS_CODES');
	$columns->text('ADDITIONAL_RIGHTS');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_ROLE_TYPE', ['TYPE']);
});

$migration->table('b_landing_filter_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('SOURCE_ID', 255)->notNull();
	$columns->char('FILTER_HASH', 32)->notNull();
	$columns->text('FILTER');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_FILTER_HASH', ['FILTER_HASH']);
});

$migration->table('b_landing_filter_block')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('FILTER_ID')->notNull();
	$columns->int('BLOCK_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_FILTER_BLOCK', ['FILTER_ID', 'BLOCK_ID']);
});

$migration->table('b_landing_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('LID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('VIEWS')->notNull();
	$columns->datetime('FIRST_VIEW')->notNull();
	$columns->datetime('LAST_VIEW')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_VIEW_LIDUID', ['LID', 'USER_ID']);
});

$migration->table('b_landing_binding')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->varchar('BINDING_ID', 50)->notNull();
	$columns->char('BINDING_TYPE', 1)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_BINDING', ['BINDING_ID', 'BINDING_TYPE']);
	$table->addIndex('IX_B_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_B_BINDING_TYPE', ['BINDING_TYPE']);
});

$migration->table('b_landing_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID')->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('AVATAR');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CHAT', ['CHAT_ID']);
});

$migration->table('b_landing_chat_binding')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('INTERNAL_CHAT_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CHAT', ['INTERNAL_CHAT_ID']);
	$table->addIndex('IX_B_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_landing_cookies_agreement')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SITE_ID')->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->varchar('TITLE', 255);
	$columns->mediumText('CONTENT')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SITE', ['SITE_ID', 'CODE']);
});

$migration->table('b_landing_designer_repo')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('XML_ID', 255)->notNull();
	$columns->varchar('TITLE', 255);
	$columns->int('SORT')->default('100');
	$columns->text('HTML')->notNull();
	$columns->text('MANIFEST')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_XML_ID', ['XML_ID']);
});

$migration->table('b_landing_entity_lock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->char('LOCK_TYPE', 1)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_TYPE', ['LOCK_TYPE']);
});

$migration->table('b_landing_folder')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PARENT_ID');
	$columns->int('SITE_ID')->notNull();
	$columns->int('INDEX_ID');
	$columns->char('ACTIVE', 1)->notNull()->default('N');
	$columns->char('DELETED', 1)->notNull()->default('N');
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('CODE', 255);
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('MODIFIED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_FOLDER_SITE_ID', ['SITE_ID']);
	$table->addIndex('IX_B_FOLDER_ACTIVE', ['ACTIVE']);
	$table->addIndex('IX_B_FOLDER_DELETED', ['DELETED']);
	$table->addIndex('IX_B_FOLDER_PARENT_ID', ['PARENT_ID']);
});

$migration->table('b_landing_urlchecker_whitelist')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('DOMAIN', 255)->notNull();
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CHECKER_DOMAIN', ['DOMAIN']);
});

$migration->table('b_landing_urlchecker_status')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('URL', 255)->notNull();
	$columns->char('HASH', 32)->notNull();
	$columns->varchar('STATUS', 255);
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CHECKER_HASH', ['HASH']);
});

$migration->table('b_landing_urlchecker_host')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('STATUS_ID')->notNull();
	$columns->varchar('HOST', 255)->notNull();
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CHECKER_STATUS_HOST', ['STATUS_ID', 'HOST']);
});

$migration->table('b_landing_block_last_used')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_BLOCK_LU_USER', ['USER_ID']);
	$table->addIndex('IX_B_BLOCK_LU_CODE', ['CODE']);
	$table->addIndex('IX_B_BLOCK_LU_USER_CODE', ['USER_ID', 'CODE']);
});

$migration->table('b_landing_block_favourite')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_BLOCK_LU_USER', ['USER_ID']);
});

$migration->table('b_landing_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('ENTITY_TYPE', 1)->notNull()->default('L');
	$columns->int('ENTITY_ID')->notNull();
	$columns->text('ACTION')->notNull();
	$columns->text('ACTION_PARAMS')->notNull();
	$columns->int('MULTIPLY_ID');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->timestamp('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_LAND_HISTORY_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_landing_history_step')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('ENTITY_TYPE', 1)->notNull()->default('L');
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('STEP')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_HISTORY_STEP', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_landing_copilot_generations')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('SCENARIO', 255)->notNull();
	$columns->int('STEP');
	$columns->int('CHAT_ID');
	$columns->int('SITE_ID');
	$columns->mediumText('SITE_DATA');
	$columns->mediumText('DATA');
	$columns->mediumText('HTML_BLOCKS');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_FINISHED');
	$table->addIndex('IX_LANDING_COPILOT_GENERATION_SITE', ['SITE_ID']);
});

$migration->table('b_landing_copilot_requests')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('GENERATION_ID')->notNull();
	$columns->varchar('HASH', 255);
	$columns->mediumText('RESULT');
	$columns->text('ERROR');
	$columns->char('DELETED', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_RECEIVE');
	$table->addIndex('IX_LANDING_COPILOT_REQUEST_STEP', ['GENERATION_ID']);
	$table->addIndex('IX_LANDING_COPILOT_REQUEST_HASH', ['HASH']);
});

$migration->table('b_landing_copilot_steps')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('GENERATION_ID')->notNull();
	$columns->int('STEP_ID')->notNull();
	$columns->varchar('CLASS', 255)->notNull();
	$columns->int('STATUS')->notNull();
	$table->addIndex('IX_LANDING_COPILOT_STEPS_GENERATION_ID', ['GENERATION_ID']);
});

$migration->table('b_landing_copilot_request_to_entities')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('REQUEST_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->int('LANDING_ID');
	$columns->int('BLOCK_ID');
	$columns->varchar('NODE_CODE', 255);
	$columns->int('POSITION');
	$table->addIndex('IX_LANDING_COPILOT_REQUEST_TO_ENTITIES', ['REQUEST_ID']);
});

$migration->table('b_landing_copilot_request_to_step')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('REQUEST_ID')->notNull();
	$columns->int('GENERATION_ID')->notNull();
	$columns->int('STEP')->notNull();
	$columns->boolean('APPLIED')->default(0);
	$table->addIndex('IX_IX_LANDING_COPILOT_REQUEST_TO_STEPS_REQUEST_GENERATION_STEPS', ['REQUEST_ID', 'GENERATION_ID', 'STEP']);
});

$migration->table('b_landing_copilot_site_to_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('SITE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$table->addPrimaryKeys(['SITE_ID', 'CHAT_ID', 'USER_ID']);
	$table->addIndex('IX_IX_LANDING_COPILOT_SITE_TO_CHAT_SITE_ID', ['SITE_ID']);
});

$migration->table('b_landing_ai_site_binding')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('SITE_ID');
	$columns->int('GENERATION_ID');
	$columns->int('MODERATION_BLOCK_COUNT')->notNull()->default('0');
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY');
	$table->addUniqueIndex('UX_LANDING_AI_SITE_BINDING_USER_SITE', ['USER_ID', 'SITE_ID']);
	$table->addIndex('IX_LANDING_AI_SITE_BINDING_USER_DRAFT', ['USER_ID', 'SITE_ID', 'GENERATION_ID']);
	$table->addUniqueIndex('UX_LANDING_AI_SITE_BINDING_GENERATION', ['GENERATION_ID']);
});

$migration->table('b_landing_vibe')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 255)->notNull();
	$columns->varchar('EMBED_ID', 255)->notNull();
	$columns->varchar('PROVIDER_CLASS', 255)->notNull();
	$columns->int('SITE_ID')->notNull();
	$columns->char('STATUS', 1)->notNull();
	$table->addIndex('IX_LANDING_VIBE_MODULE_ID_EMBED_ID', ['MODULE_ID', 'EMBED_ID']);
	$table->addIndex('IX_LANDING_VIBE_SITE_ID', ['SITE_ID']);
});

