<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_catalog_currency')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->int('AMOUNT_CNT')->notNull()->default('1');
	$columns->decimal('AMOUNT', 18, 4);
	$columns->int('SORT')->notNull()->default('100');
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->char('NUMCODE', 3);
	$columns->char('BASE', 1)->notNull()->default('N');
	$columns->int('CREATED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('MODIFIED_BY');
	$columns->decimal('CURRENT_BASE_RATE', 26, 12);
	$table->addPrimaryKey('CURRENCY');
});

$migration->table('b_catalog_currency_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('FORMAT_STRING', 50)->notNull();
	$columns->varchar('FULL_NAME', 50);
	$columns->varchar('DEC_POINT', 16)->default('.');
	$columns->varchar('THOUSANDS_SEP', 16)->default(' ');
	$columns->tinyInt('DECIMALS')->notNull()->default('2');
	$columns->char('THOUSANDS_VARIANT', 1);
	$columns->char('HIDE_ZERO', 1)->notNull()->default('N');
	$columns->int('CREATED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('MODIFIED_BY');
	$columns->datetime('TIMESTAMP_X');
	$table->addPrimaryKeys(['CURRENCY', 'LID']);
});

$migration->table('b_catalog_currency_rate')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->char('BASE_CURRENCY', 3);
	$columns->date('DATE_RATE')->notNull();
	$columns->int('RATE_CNT')->notNull()->default('1');
	$columns->decimal('RATE', 18, 4)->notNull()->default('0');
	$columns->int('CREATED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('MODIFIED_BY');
	$columns->datetime('TIMESTAMP_X');
	$table->addUniqueIndex('IX_CURRENCY_RATE', ['CURRENCY', 'DATE_RATE']);
});

