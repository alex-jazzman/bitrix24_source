<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_lists_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('IBLOCK_TYPE_ID', 50)->notNull();
	$columns->int('GROUP_ID')->notNull();
	$table->addPrimaryKeys(['IBLOCK_TYPE_ID', 'GROUP_ID']);
});

$migration->table('b_lists_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('FIELD_ID', 100)->notNull();
	$columns->int('SORT')->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKeys(['IBLOCK_ID', 'FIELD_ID']);
});

$migration->table('b_lists_socnet_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->char('SOCNET_ROLE', 1);
	$columns->char('PERMISSION', 1)->notNull();
	$table->addUniqueIndex('ux_b_lists_socnet_group_1', ['IBLOCK_ID', 'SOCNET_ROLE']);
});

$migration->table('b_lists_url')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->varchar('URL', 500);
	$columns->tinyInt('LIVE_FEED')->default('0');
	$table->addPrimaryKey('IBLOCK_ID');
});

