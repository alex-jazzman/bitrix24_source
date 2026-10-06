<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_hr_structure_node_backward_access_code')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('NODE_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_HR_STRUCTURE_NODE_BACKWARD_ACCESS_CODE_ACCESS_CODE', ['ACCESS_CODE']);
	$table->addIndex('IX_B_HR_STRUCTURE_NODE_BACKWARD_ACCESS_CODE_NODE_ID', ['NODE_ID']);
});

$migration->table('b_hr_structure_node_member_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->bigInt('MEMBER_ID')->notNull();
	$columns->bigInt('ROLE_ID')->notNull();
	$columns->bigInt('CREATED_BY')->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_STRUCTURE_NODE_MEMBER_ROLE_ROLE_ID', ['ROLE_ID']);
	$table->addIndex('IX_B_HR_STRUCTURE_NODE_MEMBER_ROLE_MEMBER_ID', ['MEMBER_ID']);
});

$migration->table('b_hr_structure_node_member')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->varchar('ENTITY_TYPE', 50)->notNull()->default('USER');
	$columns->bigInt('ENTITY_ID')->notNull();
	$columns->varchar('ACTIVE', 1)->default('Y');
	$columns->bigInt('NODE_ID')->notNull();
	$columns->bigInt('ADDED_BY')->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_HR_NODE_MEMBER_NODE_ID_ENTITY_TYPE_ENTITY_ID', ['NODE_ID', 'ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('IX_B_HR_NODE_MEMBER_ENTITY_TYPE_ENTITY_ID', ['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_hr_structure_node_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->bigInt('NODE_ID')->notNull();
	$columns->bigInt('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$columns->varchar('ENTITY_SUBTYPE', 50);
	$columns->varchar('WITH_CHILD_NODES', 1)->default('N');
	$columns->bigInt('CREATED_BY')->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('ID');
	$table->addIndex('B_HR_STRUCTURE_NODE_RELATION_IX', ['NODE_ID', 'ENTITY_TYPE', 'ENTITY_ID', 'WITH_CHILD_NODES']);
	$table->addIndex('B_HR_STRUCTURE_NODE_RELATION_ENTITY_TYPE_ENTITY_ID_IX', ['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_hr_structure_node_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->bigInt('NODE_ID')->notNull();
	$columns->bigInt('ROLE_ID')->notNull();
	$columns->bigInt('CREATED_BY')->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('ID');
});

$migration->table('b_hr_structure')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('TYPE', 50)->notNull()->default('DEFAULT');
	$columns->bigInt('CREATED_BY')->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$columns->varchar('XML_ID', 255);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('XML_ID', ['XML_ID']);
});

$migration->table('b_hr_structure_node')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('TYPE', 50)->notNull();
	$columns->bigInt('STRUCTURE_ID')->notNull();
	$columns->bigInt('PARENT_ID');
	$columns->bigInt('CREATED_BY')->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$columns->varchar('XML_ID', 255);
	$columns->varchar('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('GLOBAL_ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('0');
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('COLOR_NAME', 50);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_STRUCTURE_NODE_SORT', ['SORT']);
	$table->addIndex('B_HR_STRUCTURE_NODE_XML_ID_IX', ['XML_ID']);
	$table->addIndex('IX_B_HR_STRUCTURE_NODE_STRUCTURE_ID_PARENT_ID', ['STRUCTURE_ID', 'PARENT_ID']);
	$table->addFulltextIndex('IXF_B_HR_STRUCTURE_NODE_NAME', ['NAME']);
});

$migration->table('b_hr_structure_node_settings')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->bigInt('NODE_ID')->notNull();
	$columns->varchar('SETTINGS_TYPE', 50)->notNull();
	$columns->text('SETTINGS_VALUE');
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_STRUCTURE_NODE_SETTINGS', ['NODE_ID', 'SETTINGS_TYPE']);
});

$migration->table('b_hr_structure_user_settings')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->bigInt('USER_ID')->notNull();
	$columns->varchar('SETTINGS_TYPE', 50)->notNull();
	$columns->text('SETTINGS_VALUE');
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_STRUCTURE_USER_SETTINGS', ['USER_ID', 'SETTINGS_TYPE']);
});

$migration->table('b_hr_structure_node_path')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->bigInt('PARENT_ID')->notNull();
	$columns->bigInt('CHILD_ID')->notNull();
	$columns->bigInt('DEPTH')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_STRUCTURE_NODE_PATH_CHILD_PARENT', ['CHILD_ID', 'PARENT_ID']);
	$table->addUniqueIndex('UX_B_HR_NODE_PATH_PARENT_ID_CHILD_ID', ['PARENT_ID', 'CHILD_ID']);
});

$migration->table('b_hr_structure_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->autoincrement();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->bigInt('PRIORITY')->notNull();
	$columns->int('CHILD_AFFECTION_TYPE')->notNull();
	$columns->varchar('XML_ID', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('XML_ID', ['XML_ID']);
});

$migration->table('b_hr_access_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('NAME', 250)->notNull();
	$columns->varchar('CATEGORY', 50)->default('DEPARTMENT');
	$table->addPrimaryKey('ID');
});

$migration->table('b_hr_access_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('RELATION', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_ACCESS_ROLE_RELATION_ROLE_ID', ['ROLE_ID']);
	$table->addIndex('IX_B_HR_ACCESS_ROLE_RELATION_RELATION', ['RELATION']);
});

$migration->table('b_hr_access_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('PERMISSION_ID', 32)->notNull();
	$columns->tinyInt('VALUE')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_ACCESS_PERMISSION_ROLE_ID', ['ROLE_ID']);
	$table->addIndex('IX_B_HR_ACCESS_PERMISSION_PERMISSION_ID', ['PERMISSION_ID']);
	$table->addUniqueIndex('ROLE_ID', ['ROLE_ID', 'PERMISSION_ID']);
});

$migration->table('b_hr_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->varchar('MESSAGE', 255);
	$columns->varchar('ENTITY_TYPE', 50);
	$columns->bigInt('ENTITY_ID');
	$columns->int('USER_ID');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_LOG_ENTITY_ID', ['ENTITY_ID']);
	$table->addIndex('IX_B_HR_LOG_USER_ID', ['USER_ID']);
});

$migration->table('b_hr_hcmlink_company')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('MY_COMPANY_ID')->unsigned()->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->text('DATA')->notNull();
	$columns->datetime('CREATED_AT');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_HR_INTEGRATION_COMPANY', ['CODE']);
});

$migration->table('b_hr_hcmlink_employee')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PERSON_ID')->unsigned()->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->text('DATA')->notNull();
	$columns->datetime('CREATED_AT');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_INTEGRATION_PERSON', ['PERSON_ID']);
	$table->addUniqueIndex('IX_B_HR_INTEGRATION_PERSON_EMPLOYEE', ['PERSON_ID', 'CODE']);
});

$migration->table('b_hr_hcmlink_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('COMPANY_ID')->unsigned()->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->smallInt('TYPE')->notNull()->default('0');
	$columns->smallInt('ENTITY_TYPE')->notNull()->default('0');
	$columns->int('TTL')->notNull()->default('86400');
	$columns->varchar('TITLE', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_HR_INTEGRATION_COMPANY_FIELD', ['COMPANY_ID', 'CODE']);
});

$migration->table('b_hr_hcmlink_field_value')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('EMPLOYEE_ID')->unsigned()->notNull();
	$columns->int('FIELD_ID')->unsigned()->notNull();
	$columns->text('VALUE')->notNull();
	$columns->datetime('EXPIRED_AT');
	$columns->datetime('CREATED_AT');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_HCMLINK_FIELD_VALUE_EXPIRED_AT', ['EXPIRED_AT']);
	$table->addUniqueIndex('UX_B_HR_INTEGRATION_EMPLOYEE_FIELD', ['EMPLOYEE_ID', 'FIELD_ID']);
});

$migration->table('b_hr_hcmlink_job')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('COMPANY_ID')->unsigned()->notNull();
	$columns->smallInt('TYPE')->notNull()->default('0');
	$columns->smallInt('STATUS')->notNull()->default('0');
	$columns->int('PROGRESS_RECEIVED')->unsigned()->notNull()->default('0');
	$columns->int('PROGRESS_TOTAL')->unsigned()->notNull()->default('0');
	$columns->text('INPUT_DATA')->notNull();
	$columns->text('OUTPUT_DATA')->notNull();
	$columns->text('SETTINGS_DATA')->notNull();
	$columns->int('EVENT_COUNT')->notNull()->default('0');
	$columns->datetime('CREATED_AT');
	$columns->datetime('UPDATED_AT');
	$columns->datetime('FINISHED_AT');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_HR_HCMLINK_JOB_COMPANY_ID', ['COMPANY_ID']);
	$table->addIndex('IX_B_HR_HCMLINK_JOB_STATUS', ['STATUS']);
	$table->addIndex('IX_B_HR_HCMLINK_JOB_UPDATED_AT', ['UPDATED_AT']);
	$table->addIndex('IX_B_HR_HCMLINK_JOB_CREATED_AT', ['CREATED_AT']);
});

$migration->table('b_hr_hcmlink_person')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('COMPANY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->datetime('CREATED_AT');
	$columns->datetime('UPDATED_AT');
	$columns->int('MATCH_COUNTER')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_HR_INTEGRATION_COMPANY_PERSON', ['COMPANY_ID', 'CODE']);
	$table->addIndex('IX_B_HR_INTEGRATION_COMPANY_USER', ['COMPANY_ID', 'USER_ID']);
	$table->addIndex('IX_B_HR_INTEGRATION_PERSON_USER_COMPANY', ['USER_ID', 'COMPANY_ID']);
});

$migration->table('b_hr_hcmlink_person_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PERSON_ID')->notNull();
	$columns->text('SEARCH_CONTENT');
	$table->addPrimaryKey('PERSON_ID');
	$table->addFulltextIndex('IXF_B_HR_HCMLINK_PERSON_INDEX_SEARCH_CONTENT', ['SEARCH_CONTENT']);
});

