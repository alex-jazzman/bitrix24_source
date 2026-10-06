<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_market_tag')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
		$table->addId();
		$table->addColumn()->varchar('MODULE_ID', 32)->notNull();
		$table->addColumn()->char('TYPE', 1)->notNull();
		$table->addColumn()->varchar('CODE', 32)->notNull();
		$table->addColumn()->date('DATE_VALUE')->notNull();
		$table->addColumn()->varchar('VALUE', 32)->notNull();
		$table->addUniqueIndex('ux_b_market_tag', ['TYPE', 'MODULE_ID', 'CODE', 'DATE_VALUE']);
		$table->addIndex('ix_b_market_tag', ['TYPE', 'MODULE_ID', 'CODE']);
	},
);

$migration->table('b_market_app_favorites')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
		$table->addId();
		$table->addColumn()->varchar('APP_CODE', 128)->notNull();
		$table->addColumn()->int('USER_ID')->notNull();
		$table->addIndex('ix_market_app_fav', ['USER_ID']);
	},
);
