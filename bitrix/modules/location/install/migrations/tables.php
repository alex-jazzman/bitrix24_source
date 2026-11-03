<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_location')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 100)->notNull();
	$columns->varchar('EXTERNAL_ID', 255);
	$columns->varchar('SOURCE_CODE', 15);
	$columns->decimal('LATITUDE', 8, 6);
	$columns->decimal('LONGITUDE', 9, 6);
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->int('TYPE')->notNull();
	$table->addUniqueIndex('CODE', ['CODE']);
	$table->addUniqueIndex('IX_LOC_SE', ['EXTERNAL_ID', 'SOURCE_CODE']);
	$table->addIndex('IX_LOC_LAT', ['LATITUDE']);
	$table->addIndex('IX_LOC_LON', ['LONGITUDE']);
	$table->addIndex('IX_LOC_T', ['TYPE']);
});

$migration->table('b_location_name')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOCATION_ID')->notNull();
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->varchar('NAME', 1000)->notNull();
	$columns->varchar('NAME_NORMALIZED', 1000)->notNull();
	$table->addPrimaryKeys(['LOCATION_ID', 'LANGUAGE_ID']);
	$table->addIndex('IX_LOC_LNN', ['NAME_NORMALIZED(200)', 'LANGUAGE_ID']);
});

$migration->table('b_location_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOCATION_ID')->notNull();
	$columns->int('TYPE')->notNull();
	$columns->varchar('VALUE', 255);
	$table->addPrimaryKeys(['LOCATION_ID', 'TYPE']);
	$table->addIndex('IDX_BLLFL_VAL', ['VALUE']);
});

$migration->table('b_location_address')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('LOCATION_ID')->default('0');
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->decimal('LATITUDE', 8, 6);
	$columns->decimal('LONGITUDE', 9, 6);
	$table->addIndex('IX_LOC_BLA_LOC', ['LOCATION_ID']);
});

$migration->table('b_location_addr_fld')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ADDRESS_ID')->notNull();
	$columns->int('TYPE')->notNull();
	$columns->varchar('VALUE', 1024);
	$columns->varchar('VALUE_NORMALIZED', 1024);
	$table->addPrimaryKeys(['ADDRESS_ID', 'TYPE']);
});

$migration->table('b_location_addr_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ADDRESS_ID')->notNull();
	$columns->varchar('ENTITY_ID', 100)->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$table->addPrimaryKeys(['ADDRESS_ID', 'ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IDX_BLAL_EI_ET', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_location_source')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('CODE', 15)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->longText('CONFIG');
	$table->addPrimaryKey('CODE');
});

$migration->table('b_location_area')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TYPE', 100)->notNull();
	$columns->varchar('CODE', 100);
	$columns->int('SORT')->notNull();
	$columns->longText('GEOMETRY');
	$table->addUniqueIndex('TYPE', ['TYPE', 'CODE']);
});

$migration->table('b_location_recent_address')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->text('ADDRESS');
	$columns->datetime('USED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IDX_BLRA_USER_ID_USED_AT', ['USER_ID', 'USED_AT']);
	$table->addIndex('IDX_BLRA_USED_AT', ['USED_AT']);
});

$migration->table('b_location_static_map_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->char('HASH', 40)->notNull();
	$columns->int('FILE_ID')->notNull();
	$table->addPrimaryKey('HASH');
});

