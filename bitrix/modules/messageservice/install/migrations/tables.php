<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_messageservice_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->varchar('TYPE', 30)->notNull();
	$columns->varchar('SENDER_ID', 50)->notNull();
	$columns->int('AUTHOR_ID')->notNull()->default('0');
	$columns->varchar('MESSAGE_FROM', 260);
	$columns->varchar('MESSAGE_TO', 50)->notNull();
	$columns->longText('MESSAGE_HEADERS');
	$columns->longText('MESSAGE_BODY')->notNull();
	$columns->datetime('DATE_INSERT');
	$columns->datetime('DATE_EXEC');
	$columns->datetime('NEXT_EXEC');
	$columns->char('SUCCESS_EXEC', 1)->notNull()->default('N');
	$columns->varchar('EXEC_ERROR', 255);
	$columns->int('STATUS_ID')->notNull()->default('0');
	$columns->varchar('EXTERNAL_ID', 128);
	$columns->varchar('EXTERNAL_STATUS', 128);
	$columns->int('CLUSTER_GROUP');
	$table->addPrimaryKey('ID');
	$table->addIndex('B_MESSAGESERVICE_MESSAGE_1', ['DATE_EXEC']);
	$table->addIndex('B_MESSAGESERVICE_MESSAGE_2', ['SUCCESS_EXEC', 'CLUSTER_GROUP']);
	$table->addIndex('B_MESSAGESERVICE_MESSAGE_3', ['SENDER_ID', 'EXTERNAL_ID']);
	$table->addIndex('B_MESSAGESERVICE_MESSAGE_4', ['SUCCESS_EXEC', 'NEXT_EXEC']);
	$table->addIndex('B_MESSAGESERVICE_MESSAGE_5', ['DATE_INSERT']);
});

$migration->table('b_messageservice_rest_app')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('APP_ID', 128)->notNull();
	$columns->varchar('CODE', 128)->notNull();
	$columns->varchar('TYPE', 30)->notNull();
	$columns->varchar('HANDLER', 1000)->notNull();
	$columns->datetime('DATE_ADD');
	$columns->int('AUTHOR_ID')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('B_MESSAGESERVICE_REST_APP_1', ['APP_ID', 'CODE']);
});

$migration->table('b_messageservice_rest_app_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID')->notNull();
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->varchar('NAME', 500);
	$columns->varchar('APP_NAME', 500);
	$columns->varchar('DESCRIPTION', 1000);
	$table->addPrimaryKey('ID');
});

$migration->table('b_messageservice_incoming_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->longText('REQUEST_BODY');
	$columns->datetime('DATE_EXEC');
	$columns->varchar('SENDER_ID', 50)->notNull();
	$columns->varchar('EXTERNAL_ID', 128);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_MS_INCOMING_MESSAGE_1', ['SENDER_ID', 'EXTERNAL_ID']);
});

$migration->table('b_messageservice_restriction')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 128)->notNull();
	$columns->int('COUNTER');
	$columns->date('DATE_CREATE')->notNull();
	$columns->text('ADDITIONAL_PARAMS')->notNull();
	$table->addUniqueIndex('UX_MESSAGESERVISE_RESTRICTION_1', ['CODE', 'DATE_CREATE']);
});

$migration->table('b_messageservice_channel')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('SENDER_ID', 50)->notNull();
	$columns->varchar('TYPE', 30)->notNull();
	$columns->varchar('EXTERNAL_ID', 128)->notNull();
	$columns->varchar('NAME', 500)->notNull();
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->text('ADDITIONAL_PARAMS');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_MS_CHANNEL_1', ['SENDER_ID', 'EXTERNAL_ID', 'TYPE']);
});

$migration->table('b_messageservice_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 500)->notNull();
	$columns->varchar('TITLE', 500)->notNull();
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$table->addPrimaryKey('ID');
});

$migration->table('b_messageservice_custom_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('ZONE', 32)->notNull();
	$columns->varchar('SCENE', 32)->notNull();
	$columns->varchar('TARGET_ID', 255)->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->longText('BODY')->notNull();
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->int('AUTHOR_ID')->notNull()->default('0');
	$columns->datetime('DATE_MODIFY');
	$columns->int('MODIFIED_BY');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_messageservice_custom_template_zone_scene_target_id_title', ['ZONE', 'SCENE', 'TARGET_ID', 'TITLE']);
});

