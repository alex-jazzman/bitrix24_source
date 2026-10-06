<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_vibecodeconnector_catalog')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ICON_FILE_ID');
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('CHAT_ID');
	$columns->varchar('EXTERNAL_ID', 255);
	$columns->text('DESCRIPTION');
	$columns->varchar('TYPE', 50)->notNull();
	$columns->varchar('EDIT_URL', 512);
	$columns->varchar('VIEW_URL', 512);
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$columns->varchar('ACCESS_TYPE', 50)->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->varchar('COLOR', 7)->notNull();
	$columns->varchar('PAIRING_ISS', 255);
	$columns->datetime('DEACTIVATED_AT');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_vcc_catalog_owner', ['OWNER_ID']);
	$table->addIndex('ix_vcc_catalog_access_type', ['ACCESS_TYPE']);
	$table->addIndex('ix_vcc_catalog_owner_access_type', ['OWNER_ID', 'ACCESS_TYPE']);
	$table->addIndex('ix_vcc_catalog_created_at', ['CREATED_AT']);
	$table->addIndex('ix_vcc_catalog_pairing_iss', ['PAIRING_ISS']);
});

$migration->table('b_vibecodeconnector_catalog_pin')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CATALOG_ITEM_ID')->notNull();
	$columns->datetime('PINNED_AT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_vcc_catalog_pin_user_item', ['USER_ID', 'CATALOG_ITEM_ID']);
	$table->addIndex('ix_vcc_catalog_pin_user_pinned_at', ['USER_ID', 'PINNED_AT']);
});

$migration->table('b_vibecodeconnector_catalog_last_opened')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CATALOG_ITEM_ID')->notNull();
	$columns->datetime('OPENED_AT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_vcc_catalog_lastopen_user_item', ['USER_ID', 'CATALOG_ITEM_ID']);
	$table->addIndex('ix_vcc_catalog_lastopen_user_opened', ['USER_ID', 'OPENED_AT']);
	$table->addIndex('ix_vcc_catalog_lastopen_item', ['CATALOG_ITEM_ID']);
});

$migration->table('b_vibecodeconnector_catalog_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CATALOG_ITEM_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	$columns->datetime('GRANTED_AT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_vcc_catalog_access_item_code', ['CATALOG_ITEM_ID', 'ACCESS_CODE']);
	$table->addIndex('ix_vcc_catalog_access_code', ['ACCESS_CODE']);
	$table->addIndex('ix_vcc_catalog_access_grant', ['ACCESS_CODE', 'GRANTED_AT', 'CATALOG_ITEM_ID']);
});

$migration->table('b_vibecodeconnector_pairing')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('ISS', 255)->notNull();
	$columns->text('PUBLIC_KEY')->notNull();
	$columns->varchar('PORTAL_ID', 255)->notNull();
	$columns->varchar('ENDPOINT_URL', 512)->notNull();
	$columns->datetime('FETCHED_AT')->notNull();
	$columns->datetime('EXPIRES_AT')->notNull();
	$columns->int('PUBLIC_KEY_TTL')->notNull()->default('0');
	$columns->varchar('KEY_SOURCE', 20)->notNull()->default('static');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_vcc_pairing_iss', ['ISS']);
	$table->addIndex('ix_vcc_pairing_expires_at', ['EXPIRES_AT']);
});

$migration->table('b_vibecodeconnector_catalog_hidden')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CATALOG_ITEM_ID')->notNull();
	$columns->datetime('HIDDEN_AT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_vcc_catalog_hidden_user_item', ['USER_ID', 'CATALOG_ITEM_ID']);
	$table->addIndex('ix_vcc_catalog_hidden_item', ['CATALOG_ITEM_ID']);
});

$migration->table('b_vibecodeconnector_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) use ($migration) {
	$columns = $table->addColumn();
	$idColumn = $columns->int('ID')->notNull()->autoincrement();
	$bitrixUserIdColumn = $columns->int('BITRIX_USER_ID')->notNull();
	if ($migration->context()->isMySql())
	{
		$idColumn->unsigned();
		$bitrixUserIdColumn->unsigned();
	}
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_VIBECODECONNECTOR_USER', ['BITRIX_USER_ID']);
});

$migration->table('b_vibecodeconnector_messenger_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('QUEUE_ID', 255)->notNull();
	$columns->varchar('ITEM_ID', 255);
	$columns->varchar('CLASS', 255)->notNull();
	$columns->text('PAYLOAD')->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$columns->int('TTL')->notNull();
	$columns->datetime('AVAILABLE_AT')->notNull();
	$columns->varchar('STATUS', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_VCC_MSG_QSA', ['QUEUE_ID', 'STATUS', 'AVAILABLE_AT']);
	$table->addIndex('IX_VCC_MSG_SU', ['STATUS', 'UPDATED_AT']);
});

$migration->table('b_vibecodeconnector_catalog_viewed')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CATALOG_ITEM_ID')->notNull();
	$columns->datetime('VIEWED_AT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_vcc_catalog_viewed_user_item', ['USER_ID', 'CATALOG_ITEM_ID']);
	$table->addIndex('ix_vcc_catalog_viewed_item', ['CATALOG_ITEM_ID']);
});

$migration->table('b_vibecodeconnector_user_attributes')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('CATALOG_FIRST_OPENED_AT');
	$columns->int('GROUP_EVENT_SEQUENCE')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_vcc_user_attributes_user_id', ['USER_ID']);
});

$databaseUpdateMode = $migration->context()->getDatabaseUpdateMode();
if (
	$databaseUpdateMode->usesRealDatabase()
	&& $databaseUpdateMode !== \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall
)
{
	$connection = \Bitrix\Main\Application::getConnection();
	$accessTable = 'b_vibecodeconnector_catalog_access';
	$grantIndexColumns = ['ACCESS_CODE', 'GRANTED_AT', 'CATALOG_ITEM_ID'];
	if ($connection->isTableExists($accessTable) && !$connection->isIndexExists($accessTable, $grantIndexColumns))
	{
		$connection->createIndex($accessTable, 'ix_vcc_catalog_access_grant', $grantIndexColumns);
	}
}
