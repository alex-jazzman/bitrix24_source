<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_iblock_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 50)->notNull();
	$columns->char('SECTIONS', 1)->notNull()->default('Y');
	$columns->varchar('EDIT_FILE_BEFORE', 255);
	$columns->varchar('EDIT_FILE_AFTER', 255);
	$columns->char('IN_RSS', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull()->default('500');
	$table->addPrimaryKey('ID');
});

$migration->table('b_iblock_type_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('IBLOCK_TYPE_ID', 50)->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('SECTION_NAME', 100);
	$columns->varchar('ELEMENT_NAME', 100);
});

$migration->table('b_iblock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('TIMESTAMP_X')->notNull()->defaultCurrentTimestamp();
	$columns->varchar('IBLOCK_TYPE_ID', 50)->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('CODE', 50);
	$columns->varchar('API_CODE', 50);
	$columns->char('REST_ON', 1)->notNull()->default('N');
	$columns->varchar('NAME', 255)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('LIST_PAGE_URL', 255);
	$columns->varchar('DETAIL_PAGE_URL', 255);
	$columns->varchar('SECTION_PAGE_URL', 255);
	$columns->varchar('CANONICAL_PAGE_URL', 255);
	$columns->int('PICTURE');
	$columns->text('DESCRIPTION');
	$columns->char('DESCRIPTION_TYPE', 4)->notNull()->default('text');
	$columns->int('RSS_TTL')->notNull()->default('24');
	$columns->char('RSS_ACTIVE', 1)->notNull()->default('Y');
	$columns->char('RSS_FILE_ACTIVE', 1)->notNull()->default('N');
	$columns->int('RSS_FILE_LIMIT');
	$columns->int('RSS_FILE_DAYS');
	$columns->char('RSS_YANDEX_ACTIVE', 1)->notNull()->default('N');
	$columns->varchar('XML_ID', 255);
	$columns->varchar('TMP_ID', 40);
	$columns->char('INDEX_ELEMENT', 1)->notNull()->default('Y');
	$columns->char('INDEX_SECTION', 1)->notNull()->default('N');
	$columns->char('WORKFLOW', 1)->notNull()->default('Y');
	$columns->char('BIZPROC', 1)->notNull()->default('N');
	$columns->char('SECTION_CHOOSER', 1);
	$columns->char('LIST_MODE', 1);
	$columns->char('RIGHTS_MODE', 1);
	$columns->char('SECTION_PROPERTY', 1);
	$columns->char('PROPERTY_INDEX', 1);
	$columns->int('VERSION')->notNull()->default('1');
	$columns->int('LAST_CONV_ELEMENT')->notNull()->default('0');
	$columns->int('SOCNET_GROUP_ID');
	$columns->varchar('EDIT_FILE_BEFORE', 255);
	$columns->varchar('EDIT_FILE_AFTER', 255);
	$columns->varchar('SECTIONS_NAME', 100);
	$columns->varchar('SECTION_NAME', 100);
	$columns->varchar('ELEMENTS_NAME', 100);
	$columns->varchar('ELEMENT_NAME', 100);
	$columns->varchar('FULLTEXT_INDEX', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_iblock', ['IBLOCK_TYPE_ID', 'LID', 'ACTIVE']);
	$table->addUniqueIndex('ix_iblock_api_code', ['API_CODE']);
	$table->addIndex('ix_iblock_code', ['CODE']);
});

$migration->table('b_iblock_site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$table->addPrimaryKeys(['IBLOCK_ID', 'SITE_ID']);
});

$migration->table('b_iblock_messages')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('MESSAGE_ID', 50)->notNull();
	$columns->varchar('MESSAGE_TEXT', 255);
	$table->addPrimaryKeys(['IBLOCK_ID', 'MESSAGE_ID']);
});

$migration->table('b_iblock_fields')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('FIELD_ID', 50)->notNull();
	$columns->char('IS_REQUIRED', 1);
	$columns->longText('DEFAULT_VALUE');
	$table->addPrimaryKeys(['IBLOCK_ID', 'FIELD_ID']);
});

$migration->table('b_iblock_property')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('TIMESTAMP_X')->notNull()->defaultCurrentTimestamp();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('CODE', 50);
	$columns->text('DEFAULT_VALUE');
	$columns->char('PROPERTY_TYPE', 1)->notNull()->default('S');
	$columns->int('ROW_COUNT')->notNull()->default('1');
	$columns->int('COL_COUNT')->notNull()->default('30');
	$columns->char('LIST_TYPE', 1)->notNull()->default('L');
	$columns->char('MULTIPLE', 1)->notNull()->default('N');
	$columns->varchar('XML_ID', 100);
	$columns->varchar('FILE_TYPE', 200);
	$columns->int('MULTIPLE_CNT');
	$columns->varchar('TMP_ID', 40);
	$columns->int('LINK_IBLOCK_ID');
	$columns->char('WITH_DESCRIPTION', 1);
	$columns->char('SEARCHABLE', 1)->notNull()->default('N');
	$columns->char('FILTRABLE', 1)->notNull()->default('N');
	$columns->char('IS_REQUIRED', 1);
	$columns->int('VERSION')->notNull()->default('1');
	$columns->varchar('USER_TYPE', 255);
	$columns->text('USER_TYPE_SETTINGS');
	$columns->varchar('HINT', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_iblock_property_1', ['IBLOCK_ID']);
	$table->addIndex('ix_iblock_property_3', ['LINK_IBLOCK_ID']);
	$table->addIndex('ix_iblock_property_2', ['CODE']);
});

// CIBlockProperty::GetList matches the code of a property case-insensitively, and only PostgreSQL
// carries an index for that comparison. The builder cannot spell an index over an expression, and
// the schema is carried over as-is, not redesigned - so the one index the API does not express
// stays as raw SQL next to its table. MySQL gets an empty string, which query() skips.
// IF NOT EXISTS carries the re-entrancy here: the filter that drops an index already in place
// covers the declared ones, while query() checks nothing but that the table is there - and an
// install over data kept from a previous uninstall meets this index already built.
$migration->table('b_iblock_property')->query(
	static fn(): string => $migration->context()->isPostgreSql()
		? 'CREATE INDEX IF NOT EXISTS ix_b_iblock_property_upper_code ON b_iblock_property (upper(code))'
		: ''
);

$migration->table('b_iblock_property_feature')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PROPERTY_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->varchar('FEATURE_ID', 100)->notNull();
	$columns->char('IS_ENABLED', 1)->notNull()->default('N');
	$table->addUniqueIndex('ix_iblock_property_feature', ['PROPERTY_ID', 'MODULE_ID', 'FEATURE_ID']);
});

$migration->table('b_iblock_section')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('TIMESTAMP_X')->notNull()->defaultCurrentTimestamp();
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('IBLOCK_SECTION_ID');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('GLOBAL_ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('PICTURE');
	$columns->int('LEFT_MARGIN');
	$columns->int('RIGHT_MARGIN');
	$columns->int('DEPTH_LEVEL');
	$columns->text('DESCRIPTION');
	$columns->char('DESCRIPTION_TYPE', 4)->notNull()->default('text');
	$columns->text('SEARCHABLE_CONTENT');
	$columns->varchar('CODE', 255);
	$columns->varchar('XML_ID', 255);
	$columns->varchar('TMP_ID', 40);
	$columns->int('DETAIL_PICTURE');
	$columns->int('SOCNET_GROUP_ID');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_iblock_section_1', ['IBLOCK_ID', 'IBLOCK_SECTION_ID']);
	$table->addIndex('ix_iblock_section_depth_level', ['IBLOCK_ID', 'DEPTH_LEVEL']);
	$table->addIndex('ix_iblock_section_code', ['IBLOCK_ID', 'CODE']);
	$table->addIndex('ix_iblock_section_left_margin2', ['IBLOCK_ID', 'LEFT_MARGIN']);
	$table->addIndex('ix_iblock_section_right_margin2', ['IBLOCK_ID', 'RIGHT_MARGIN']);
});

$migration->table('b_iblock_section_property')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('SECTION_ID')->notNull();
	$columns->int('PROPERTY_ID')->notNull();
	$columns->char('SMART_FILTER', 1);
	$columns->char('DISPLAY_TYPE', 1);
	$columns->char('DISPLAY_EXPANDED', 1);
	$columns->varchar('FILTER_HINT', 255);
	$table->addPrimaryKeys(['IBLOCK_ID', 'SECTION_ID', 'PROPERTY_ID']);
	$table->addIndex('ix_b_iblock_section_property_1', ['PROPERTY_ID']);
	$table->addIndex('ix_b_iblock_section_property_2', ['SECTION_ID']);
});

$migration->table('b_iblock_element')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('TIMESTAMP_X');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->int('IBLOCK_ID')->notNull()->default('0');
	$columns->int('IBLOCK_SECTION_ID');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('ACTIVE_FROM');
	$columns->datetime('ACTIVE_TO');
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('PREVIEW_PICTURE');
	$columns->text('PREVIEW_TEXT');
	$columns->varchar('PREVIEW_TEXT_TYPE', 4)->notNull()->default('text');
	$columns->int('DETAIL_PICTURE');
	$columns->longText('DETAIL_TEXT');
	$columns->varchar('DETAIL_TEXT_TYPE', 4)->notNull()->default('text');
	$columns->text('SEARCHABLE_CONTENT');
	$columns->int('WF_STATUS_ID')->default('1');
	$columns->int('WF_PARENT_ELEMENT_ID');
	$columns->char('WF_NEW', 1);
	$columns->int('WF_LOCKED_BY');
	$columns->datetime('WF_DATE_LOCK');
	$columns->text('WF_COMMENTS');
	$columns->char('IN_SECTIONS', 1)->notNull()->default('N');
	$columns->varchar('XML_ID', 255);
	$columns->varchar('CODE', 255);
	$columns->varchar('TAGS', 255);
	$columns->varchar('TMP_ID', 40);
	$columns->int('WF_LAST_HISTORY_ID');
	$columns->int('SHOW_COUNTER');
	$columns->datetime('SHOW_COUNTER_START');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_iblock_element_1', ['IBLOCK_ID', 'IBLOCK_SECTION_ID']);
	$table->addIndex('ix_iblock_element_4', ['IBLOCK_ID', 'XML_ID', 'WF_PARENT_ELEMENT_ID']);
	$table->addIndex('ix_iblock_element_3', ['WF_PARENT_ELEMENT_ID']);
	$table->addIndex('ix_iblock_element_code', ['IBLOCK_ID', 'CODE']);
	$table->addIndex('ix_iblock_element_name', ['IBLOCK_ID', 'NAME']);
});

$migration->table('b_iblock_element_property')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('IBLOCK_PROPERTY_ID')->notNull();
	$columns->int('IBLOCK_ELEMENT_ID')->notNull();
	$columns->text('VALUE')->notNull();
	$columns->char('VALUE_TYPE', 4)->notNull()->default('text');
	$columns->int('VALUE_ENUM');
	$columns->numeric('VALUE_NUM', 18, 4);
	$columns->varchar('DESCRIPTION', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_iblock_element_property_1', ['IBLOCK_ELEMENT_ID', 'IBLOCK_PROPERTY_ID']);
	$table->addIndex('ix_iblock_element_property_2', ['IBLOCK_PROPERTY_ID']);
	$table->addIndex('ix_iblock_element_prop_enum', ['VALUE_ENUM', 'IBLOCK_PROPERTY_ID']);
	$table->addIndex('ix_iblock_element_prop_num', ['VALUE_NUM', 'IBLOCK_PROPERTY_ID']);
	$table->addIndex('ix_iblock_element_prop_val', ['VALUE(50)', 'IBLOCK_PROPERTY_ID', 'IBLOCK_ELEMENT_ID']);
});

$migration->table('b_iblock_property_enum')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PROPERTY_ID')->notNull();
	$columns->varchar('VALUE', 255)->notNull();
	$columns->char('DEF', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('XML_ID', 200)->notNull();
	$columns->varchar('TMP_ID', 40);
	$table->addUniqueIndex('ux_iblock_property_enum', ['PROPERTY_ID', 'XML_ID']);
});

$migration->table('b_iblock_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->char('PERMISSION', 1)->notNull();
	$table->addUniqueIndex('ux_iblock_group_1', ['IBLOCK_ID', 'GROUP_ID']);
});

$migration->table('b_iblock_right')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('GROUP_CODE', 50)->notNull();
	$columns->varchar('ENTITY_TYPE', 32)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('DO_INHERIT', 1)->notNull();
	$columns->int('TASK_ID')->notNull();
	$columns->char('OP_SREAD', 1)->notNull();
	$columns->char('OP_EREAD', 1)->notNull();
	$columns->varchar('XML_ID', 32);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_iblock_right_iblock_id', ['IBLOCK_ID', 'ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('ix_b_iblock_right_group_code', ['GROUP_CODE', 'IBLOCK_ID']);
	$table->addIndex('ix_b_iblock_right_entity', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('ix_b_iblock_right_op_eread', ['ID', 'OP_EREAD', 'GROUP_CODE']);
	$table->addIndex('ix_b_iblock_right_op_sread', ['ID', 'OP_SREAD', 'GROUP_CODE']);
	$table->addIndex('ix_b_iblock_right_task_id', ['TASK_ID']);
});

$migration->table('b_iblock_section_right')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('SECTION_ID')->notNull();
	$columns->int('RIGHT_ID')->notNull();
	$columns->char('IS_INHERITED', 1)->notNull();
	$table->addPrimaryKeys(['RIGHT_ID', 'SECTION_ID']);
	$table->addIndex('ix_b_iblock_section_right_1', ['SECTION_ID', 'IBLOCK_ID']);
	$table->addIndex('ix_b_iblock_section_right_2', ['IBLOCK_ID', 'RIGHT_ID']);
});

$migration->table('b_iblock_element_right')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('SECTION_ID')->notNull();
	$columns->int('ELEMENT_ID')->notNull();
	$columns->int('RIGHT_ID')->notNull();
	$columns->char('IS_INHERITED', 1)->notNull();
	$table->addPrimaryKeys(['RIGHT_ID', 'ELEMENT_ID', 'SECTION_ID']);
	$table->addIndex('ix_b_iblock_element_right_1', ['ELEMENT_ID', 'IBLOCK_ID']);
	$table->addIndex('ix_b_iblock_element_right_2', ['IBLOCK_ID', 'RIGHT_ID']);
});

$migration->table('b_iblock_section_element')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_SECTION_ID')->notNull();
	$columns->int('IBLOCK_ELEMENT_ID')->notNull();
	$columns->int('ADDITIONAL_PROPERTY_ID');
	$table->addUniqueIndex('ux_iblock_section_element', ['IBLOCK_SECTION_ID', 'IBLOCK_ELEMENT_ID', 'ADDITIONAL_PROPERTY_ID']);
	$table->addIndex('UX_IBLOCK_SECTION_ELEMENT2', ['IBLOCK_ELEMENT_ID']);
});

$migration->table('b_iblock_rss')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('NODE', 50)->notNull();
	$columns->varchar('NODE_VALUE', 250);
});

$migration->table('b_iblock_cache')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('CACHE_KEY', 35)->notNull();
	$columns->longText('CACHE')->notNull();
	$columns->datetime('CACHE_DATE')->notNull();
	$table->addPrimaryKey('CACHE_KEY');
});

$migration->table('b_iblock_element_lock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ELEMENT_ID')->notNull();
	$columns->datetime('DATE_LOCK');
	$columns->varchar('LOCKED_BY', 32);
	$table->addPrimaryKey('IBLOCK_ELEMENT_ID');
});

$migration->table('b_iblock_sequence')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->int('SEQ_VALUE');
	$table->addPrimaryKeys(['IBLOCK_ID', 'CODE']);
});

$migration->table('b_iblock_offers_tmp')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PRODUCT_IBLOCK_ID')->unsigned()->notNull();
	$columns->int('OFFERS_IBLOCK_ID')->unsigned()->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
});

$migration->table('b_iblock_iproperty')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->text('TEMPLATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_iblock_iprop_0', ['IBLOCK_ID', 'ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_iblock_iblock_iprop')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('IPROP_ID')->notNull();
	$columns->text('VALUE')->notNull();
	$table->addPrimaryKeys(['IBLOCK_ID', 'IPROP_ID']);
	$table->addIndex('ix_b_iblock_iblock_iprop_0', ['IPROP_ID']);
});

$migration->table('b_iblock_section_iprop')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('SECTION_ID')->notNull();
	$columns->int('IPROP_ID')->notNull();
	$columns->text('VALUE')->notNull();
	$table->addPrimaryKeys(['SECTION_ID', 'IPROP_ID']);
	$table->addIndex('ix_b_iblock_section_iprop_0', ['IPROP_ID']);
	$table->addIndex('ix_b_iblock_section_iprop_1', ['IBLOCK_ID']);
});

$migration->table('b_iblock_element_iprop')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('SECTION_ID')->notNull();
	$columns->int('ELEMENT_ID')->notNull();
	$columns->int('IPROP_ID')->notNull();
	$columns->text('VALUE')->notNull();
	$table->addPrimaryKeys(['ELEMENT_ID', 'IPROP_ID']);
	$table->addIndex('ix_b_iblock_element_iprop_0', ['IPROP_ID']);
	$table->addIndex('ix_b_iblock_element_iprop_1', ['IBLOCK_ID']);
});
