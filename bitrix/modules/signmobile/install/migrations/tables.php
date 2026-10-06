<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_signmobile_notifications')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->bigInt('SIGN_MEMBER_ID')->notNull();
	$columns->smallInt('TYPE')->unsigned()->notNull();
	$columns->datetime('DATE_UPDATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_signmobile_notifications_unique_key', ['USER_ID', 'TYPE']);
});

$migration->table('b_signmobile_notification_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->bigInt('SIGN_MEMBER_ID')->notNull();
	$columns->smallInt('TYPE')->unsigned()->notNull();
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_signmobile_notifications_queue_unique_key', ['USER_ID', 'TYPE', 'SIGN_MEMBER_ID']);
	$table->addIndex('ix_signmobile_notifications_queue_notification_lifetime', ['USER_ID', 'TYPE', 'DATE_CREATE']);
});

