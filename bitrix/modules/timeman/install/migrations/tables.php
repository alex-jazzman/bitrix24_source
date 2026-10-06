<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_timeman_entries_intent_state')->create(
	function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table): void {
		$table->addId();
		$table->addColumn()->int('USER_ID')->notNull();
		$table->addColumn()->int('FIRST_USE_AT')->notNull()->default(0);
		$table->addColumn()->varchar('PERIOD_KEY', 32)->notNull()->default('');
		$table->addColumn()->int('TARGET_START_AT')->notNull()->default(0);
		$table->addColumn()->int('PERIOD_END_AT')->notNull()->default(0);
		$table->addColumn()->int('SHOW_COUNT')->notNull()->default(0);
		$table->addColumn()->int('DISMISS_COUNT')->notNull()->default(0);
		$table->addColumn()->int('SUPPRESSED_UNTIL')->notNull()->default(0);
		$table->addColumn()->char('HAS_TARGET_ACTION', 1)->notNull()->default('N');
		$table->addColumn()->int('LAST_REGISTERED_AT')->notNull()->default(0);
		$table->addColumn()->int('LAST_SHOWN_AT')->notNull()->default(0);
		$table->addColumn()->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
		$table->addColumn()->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
		$table->addUniqueIndex('UX_B_TIMEMAN_ENTRIES_INTENT_STATE_USER', ['USER_ID']);
	},
);
