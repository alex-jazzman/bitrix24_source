<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_salescenter_page')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('NAME', 255);
	$columns->varchar('URL', 255);
	$columns->int('LANDING_ID');
	$columns->char('HIDDEN', 1)->notNull()->default('N');
	$columns->char('IS_WEBFORM', 1)->notNull()->default('N');
	$columns->char('IS_FRAME_DENIED', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull()->default('500');
	$table->addPrimaryKey('ID');
});

$migration->table('b_salescenter_meta')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('HASH', 8)->notNull();
	$columns->int('HASH_CRC')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->text('META');
	$columns->int('META_CRC')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_salescenter_meta_hash', ['HASH']);
	$table->addIndex('ix_salescenter_meta_crc', ['META_CRC']);
});

$migration->table('b_salescenter_page_param')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PAGE_ID')->notNull();
	$columns->varchar('FIELD', 255)->notNull();
	$table->addIndex('ix_salescenter_page_page_id', ['PAGE_ID']);
});

