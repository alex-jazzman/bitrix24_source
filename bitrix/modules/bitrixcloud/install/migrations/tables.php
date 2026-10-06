<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_bitrixcloud_option')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
{
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 50)->notNull();
	$columns->int('SORT')->notNull();
	$columns->varchar('PARAM_KEY', 50);
	$columns->varchar('PARAM_VALUE', 200);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_bitrixcloud_option_1', ['NAME']);
});
