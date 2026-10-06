<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_rpa_type')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->varchar('NAME', 255)->notNull();
		$columns->varchar('TITLE', 255)->notNull();
		$columns->varchar('TABLE_NAME', 64)->notNull();
		$columns->varchar('IMAGE', 255);
		$columns->int('CREATED_BY')->unsigned()->notNull();
		$columns->text('SETTINGS');
		$table->addPrimaryKey('ID');
		$table->addUniqueIndex('ux_rpa_type_table', ['TABLE_NAME']);
	}
);

$migration->table('b_rpa_stage')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->varchar('NAME', 255)->notNull();
		$columns->varchar('CODE', 50);
		$columns->char('COLOR', 6);
		$columns->int('SORT')->notNull()->default('500');
		$columns->varchar('SEMANTIC', 50);
		$columns->int('TYPE_ID')->notNull();
		$table->addPrimaryKey('ID');
		$table->addIndex('ux_rpa_stage_type', ['TYPE_ID']);
	}
);

$migration->table('b_rpa_field')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->int('TYPE_ID')->notNull();
		$columns->int('STAGE_ID')->notNull();
		$columns->varchar('FIELD', 255)->notNull();
		$columns->varchar('VISIBILITY', 255)->notNull();
		$table->addPrimaryKey('ID');
		$table->addIndex('ix_rpa_field_type_stage', ['TYPE_ID', 'STAGE_ID']);
	}
);

$migration->table('b_rpa_permission')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->varchar('ENTITY', 50)->notNull();
		$columns->int('ENTITY_ID')->notNull();
		$columns->varchar('ACCESS_CODE', 100)->notNull();
		$columns->varchar('ACTION', 50)->notNull();
		$columns->char('PERMISSION', 1)->notNull();
		$table->addPrimaryKey('ID');
		$table->addIndex('ix_rpa_permission_entities', ['ENTITY', 'ENTITY_ID']);
	}
);

$migration->table('b_rpa_stage_to_stage')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->int('STAGE_ID')->notNull();
		$columns->int('STAGE_TO_ID')->notNull();
		$table->addPrimaryKey('ID');
		$table->addIndex('ix_rpa_stage_to_stage_stage_id', ['STAGE_ID']);
	}
);

$migration->table('b_rpa_item_history')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->int('ITEM_ID')->notNull();
		$columns->int('TYPE_ID')->notNull();
		$columns->datetime('CREATED_TIME')->notNull();
		$columns->int('STAGE_ID')->notNull();
		$columns->int('NEW_STAGE_ID');
		$columns->int('USER_ID')->notNull();
		$columns->varchar('ACTION', 255);
		$columns->varchar('SCOPE', 255)->notNull()->default('manual');
		$columns->int('TASK_ID');
		$table->addPrimaryKey('ID');
		$table->addIndex('ix_rpa_history_type_item', ['TYPE_ID', 'ITEM_ID']);
	}
);

$migration->table('b_rpa_item_history_fields')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->int('ITEM_HISTORY_ID')->notNull();
		$columns->varchar('FIELD_NAME', 255)->notNull();
		$table->addPrimaryKey('ID');
		$table->addIndex('ix_rpa_history_fields_item', ['ITEM_HISTORY_ID']);
	}
);

$migration->table('b_rpa_item_sort')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->int('USER_ID')->unsigned()->notNull();
		$columns->int('TYPE_ID')->unsigned()->notNull();
		$columns->int('ITEM_ID')->unsigned()->notNull();
		$columns->int('SORT')->notNull();
		$table->addPrimaryKey('ID');
		$table->addIndex('ix_rpa_item_sort_ids', ['USER_ID', 'TYPE_ID', 'ITEM_ID']);
	}
);

$migration->table('b_rpa_timeline')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table)
	{
		$columns = $table->addColumn();
		$columns->int('ID')->unsigned()->notNull()->autoincrement();
		$columns->int('TYPE_ID')->unsigned()->notNull();
		$columns->int('ITEM_ID')->unsigned()->notNull();
		$columns->datetime('CREATED_TIME')->notNull();
		$columns->int('USER_ID')->unsigned();
		$columns->varchar('TITLE', 255);
		$columns->text('DESCRIPTION');
		$columns->varchar('ACTION', 255);
		$columns->char('IS_FIXED', 1)->notNull()->default('N');
		$columns->text('DATA');
		$table->addPrimaryKey('ID');
		$table->addIndex('ix_rpa_timeline_type_item', ['TYPE_ID', 'ITEM_ID']);
	}
);

