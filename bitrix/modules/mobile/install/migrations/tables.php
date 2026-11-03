<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_mobile_tab_preset')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->text('CONFIG_JSON')->notNull();
	$columns->char('IS_DELETED', 1)->notNull()->default('N');
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addIndex('IX_B_MOBILE_TAB_PRESET_OWNER', ['OWNER_ID', 'IS_DELETED']);
});

$migration->table('b_mobile_tab_preset_assignment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRESET_ID')->notNull();
	$columns->int('ASSIGNER_ID')->notNull();
	$columns->varchar('TARGET_TYPE', 16)->notNull();
	$columns->int('TARGET_ID')->notNull();
	$columns->int('VERSION')->notNull();
	$columns->char('IS_ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addIndex(
		'IX_B_MOBILE_TAB_PRESET_A_TARGET',
		['TARGET_TYPE', 'TARGET_ID', 'IS_ACTIVE', 'VERSION'],
	);
	$table->addIndex('IX_B_MOBILE_TAB_PRESET_A_PRESET', ['PRESET_ID', 'IS_ACTIVE']);
});

$migration->table('b_mobile_tab_preset_assignment_v2')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ASSIGNER_ID')->notNull();
	$columns->varchar('PRESET_SOURCE', 16)->notNull();
	$columns->varchar('PRESET_KEY', 64)->notNull();
	$columns->text('PRESET_CONFIG_JSON');
	$columns->varchar('TARGET_TYPE', 16)->notNull();
	$columns->int('TARGET_ID')->notNull();
	$columns->int('VERSION')->notNull();
	$columns->char('IS_ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addIndex(
		'IX_B_MOBILE_TAB_PRESET_A2_TARGET',
		['TARGET_TYPE', 'TARGET_ID', 'IS_ACTIVE', 'VERSION'],
	);
	$table->addIndex(
		'IX_B_MOBILE_TAB_PRESET_A2_PRESET_ASSIGNER',
		['PRESET_SOURCE', 'PRESET_KEY', 'IS_ACTIVE', 'ASSIGNER_ID'],
	);
});

$migration->table('b_mobile_tab_preset_user_state')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('SITE_ID', 2)->notNull();
	$columns->varchar('CURRENT_SOURCE', 16)->notNull();
	$columns->int('CURRENT_PRESET_ID');
	$columns->varchar('CURRENT_BUILTIN_ID', 64);
	$columns->text('APPLIED_CONFIG_JSON');
	$columns->int('LAST_ASSIGNMENT_VERSION')->notNull()->default(0);
	$columns->datetime('MANUALLY_SET_AT');
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addPrimaryKeys(['USER_ID', 'SITE_ID']);
	$table->addIndex('IX_B_MOBILE_TAB_PRESET_US_PRESET', ['CURRENT_PRESET_ID']);
});

$migration->table('b_mobile_tab_preset_portal_default')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('SITE_ID', 2)->notNull();
	$columns->varchar('BUILTIN_PRESET_ID', 64)->notNull();
	$columns->int('UPDATED_BY')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addPrimaryKey('SITE_ID');
});
