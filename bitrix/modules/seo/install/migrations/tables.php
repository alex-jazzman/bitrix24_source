<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

// Seed rows below belong to the initial schema: reinstall over preserved data must skip them.
$isFirstInstall = !$migration->context()->tableExists('b_seo_search_engine');

$migration->table('b_seo_keywords')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->varchar('URL', 255);
	$columns->text('KEYWORDS');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_seo_keywords_url', ['URL', 'SITE_ID']);
});

$migration->table('b_seo_search_engine')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 50)->notNull();
	$columns->char('ACTIVE', 1)->default('Y');
	$columns->int('SORT')->default('100');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CLIENT_ID', 255);
	$columns->varchar('CLIENT_SECRET', 255);
	$columns->varchar('REDIRECT_URI', 255);
	$columns->longText('SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_seo_search_engine_code', ['CODE']);
});

$migration->table('b_seo_sitemap')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('TIMESTAMP_X');
	$columns->char('SITE_ID', 2)->notNull();
	$columns->char('ACTIVE', 1)->default('Y');
	$columns->varchar('NAME', 255)->default('');
	$columns->datetime('DATE_RUN');
	$columns->longText('SETTINGS');
	$table->addPrimaryKey('ID');
});

$migration->table('b_seo_sitemap_job')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('SITEMAP_ID')->notNull()->default('0');
	$columns->char('RUNNING', 1)->notNull()->default('N');
	$columns->char('STATUS', 1)->notNull()->default('R');
	$columns->varchar('STATUS_MESSAGE', 255);
	$columns->int('STEP')->notNull()->default('0');
	$columns->longText('STATE');
	$columns->datetime('DATE_MODIFY');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_seo_sitemap_job_sid', ['SITEMAP_ID']);
	$table->addIndex('ix_seo_sitemap_job_sid_status', ['SITEMAP_ID', 'STATUS']);
});

$migration->table('b_seo_sitemap_runtime')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PID')->notNull();
	$columns->char('PROCESSED', 1)->notNull()->default('N');
	$columns->varchar('ITEM_PATH', 700);
	$columns->int('ITEM_ID');
	$columns->char('ITEM_TYPE', 1)->notNull()->default('D');
	$columns->char('ACTIVE', 1)->default('Y');
	$columns->char('ACTIVE_ELEMENT', 1)->default('Y');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_seo_sitemap_runtime1', ['PID', 'PROCESSED', 'ITEM_TYPE', 'ITEM_ID']);
});

$migration->table('b_seo_sitemap_iblock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->int('SITEMAP_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_seo_sitemap_iblock_1', ['IBLOCK_ID']);
	$table->addIndex('ix_b_seo_sitemap_iblock_2', ['SITEMAP_ID']);
});

$migration->table('b_seo_sitemap_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('SITEMAP_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_seo_sitemap_entity_1', ['ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('ix_b_seo_sitemap_entity_2', ['SITEMAP_ID']);
});

$migration->table('b_seo_adv_campaign')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENGINE_ID')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('OWNER_ID', 255)->notNull();
	$columns->varchar('OWNER_NAME', 255)->notNull();
	$columns->varchar('XML_ID', 255)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->datetime('LAST_UPDATE');
	$columns->mediumText('SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_seo_adv_campaign', ['ENGINE_ID', 'XML_ID']);
});

$migration->table('b_seo_adv_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENGINE_ID')->notNull();
	$columns->varchar('OWNER_ID', 255)->notNull();
	$columns->varchar('OWNER_NAME', 255)->notNull();
	$columns->char('ACTIVE', 1)->default('Y');
	$columns->varchar('XML_ID', 255)->notNull();
	$columns->datetime('LAST_UPDATE');
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('SETTINGS');
	$columns->int('CAMPAIGN_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_seo_adv_group', ['ENGINE_ID', 'XML_ID']);
	$table->addIndex('ix_b_seo_adv_group1', ['CAMPAIGN_ID']);
});

$migration->table('b_seo_adv_banner')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENGINE_ID')->notNull();
	$columns->varchar('OWNER_ID', 255)->notNull();
	$columns->varchar('OWNER_NAME', 255)->notNull();
	$columns->char('ACTIVE', 1)->default('Y');
	$columns->varchar('XML_ID', 255)->notNull();
	$columns->datetime('LAST_UPDATE');
	$columns->varchar('NAME', 255)->notNull();
	$columns->mediumText('SETTINGS');
	$columns->int('CAMPAIGN_ID')->notNull();
	$columns->int('GROUP_ID');
	$columns->char('AUTO_QUANTITY_OFF', 1)->default('N');
	$columns->char('AUTO_QUANTITY_ON', 1)->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_seo_adv_banner', ['ENGINE_ID', 'XML_ID']);
	$table->addIndex('ix_b_seo_adv_banner1', ['CAMPAIGN_ID']);
	$table->addIndex('ix_b_seo_adv_banner2', ['AUTO_QUANTITY_OFF', 'AUTO_QUANTITY_ON']);
});

$migration->table('b_seo_adv_region')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENGINE_ID')->notNull();
	$columns->varchar('OWNER_ID', 255)->notNull();
	$columns->varchar('OWNER_NAME', 255)->notNull();
	$columns->char('ACTIVE', 1)->default('Y');
	$columns->varchar('XML_ID', 255)->notNull();
	$columns->datetime('LAST_UPDATE');
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('SETTINGS');
	$columns->int('PARENT_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_seo_adv_region', ['ENGINE_ID', 'XML_ID']);
	$table->addIndex('ix_b_seo_adv_region1', ['PARENT_ID']);
});

$migration->table('b_seo_adv_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->char('LINK_TYPE', 1)->notNull();
	$columns->int('LINK_ID')->notNull();
	$columns->int('BANNER_ID')->notNull();
	$table->addPrimaryKeys(['LINK_TYPE', 'LINK_ID', 'BANNER_ID']);
});

$migration->table('b_seo_adv_order')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENGINE_ID')->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->int('CAMPAIGN_ID')->notNull();
	$columns->int('BANNER_ID')->notNull();
	$columns->int('ORDER_ID')->notNull();
	$columns->float('SUM')->default('0');
	$columns->char('PROCESSED', 1)->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_b_seo_adv_order', ['ENGINE_ID', 'CAMPAIGN_ID', 'BANNER_ID', 'ORDER_ID']);
	$table->addIndex('ix_b_seo_adv_order1', ['ORDER_ID', 'PROCESSED']);
});

$migration->table('b_seo_adv_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENGINE_ID')->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->varchar('REQUEST_URI', 100)->notNull();
	$columns->text('REQUEST_DATA');
	$columns->float('RESPONSE_TIME')->notNull();
	$columns->int('RESPONSE_STATUS');
	$columns->text('RESPONSE_DATA');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_seo_adv_log1', ['ENGINE_ID']);
	$table->addIndex('ix_b_seo_adv_log2', ['TIMESTAMP_X']);
});

$migration->table('b_seo_adv_autolog')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENGINE_ID')->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->int('CAMPAIGN_ID')->notNull();
	$columns->varchar('CAMPAIGN_XML_ID', 255)->notNull();
	$columns->int('BANNER_ID')->notNull();
	$columns->varchar('BANNER_XML_ID', 255)->notNull();
	$columns->int('CAUSE_CODE')->default('0');
	$columns->char('SUCCESS', 1)->default('Y');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_seo_adv_autolog1', ['ENGINE_ID']);
	$table->addIndex('ix_b_seo_adv_autolog2', ['TIMESTAMP_X']);
});

$migration->table('b_seo_yandex_direct_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CAMPAIGN_ID')->notNull();
	$columns->int('BANNER_ID')->notNull();
	$columns->date('DATE_DAY')->notNull();
	$columns->char('CURRENCY', 3);
	$columns->float('SUM')->default('0');
	$columns->float('SUM_SEARCH')->default('0');
	$columns->float('SUM_CONTEXT')->default('0');
	$columns->int('CLICKS')->default('0');
	$columns->int('CLICKS_SEARCH')->default('0');
	$columns->int('CLICKS_CONTEXT')->default('0');
	$columns->int('SHOWS')->default('0');
	$columns->int('SHOWS_SEARCH')->default('0');
	$columns->int('SHOWS_CONTEXT')->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_seo_yandex_direct_stat', ['BANNER_ID', 'DATE_DAY']);
	$table->addIndex('ix_seo_yandex_direct_stat1', ['CAMPAIGN_ID']);
});

$migration->table('b_seo_service_rtg_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT');
	$columns->varchar('TYPE', 20)->notNull();
	$columns->varchar('CLIENT_ID', 50);
	$columns->varchar('ACCOUNT_ID', 50);
	$columns->varchar('AUDIENCE_ID', 50)->notNull();
	$columns->varchar('PARENT_ID', 100);
	$columns->varchar('CONTACT_TYPE', 15)->notNull();
	$columns->varchar('VALUE', 255)->notNull();
	$columns->char('ACTION', 3)->notNull();
	$columns->datetime('DATE_AUTO_REMOVE');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SEO_SRV_RTG_QUEUE_1', ['ACTION', 'DATE_AUTO_REMOVE']);
	$table->addIndex('IX_B_SEO_SRV_RTG_QUEUE_2', ['TYPE', 'ACTION']);
});

$migration->table('b_seo_service_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->varchar('TYPE', 20)->notNull();
	$columns->varchar('CODE', 20);
	$columns->varchar('MESSAGE', 1000)->notNull();
	$columns->varchar('GROUP_ID', 20)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_seo_service_webhook')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT');
	$columns->varchar('TYPE', 20)->notNull();
	$columns->varchar('EXTERNAL_ID', 50)->notNull();
	$columns->varchar('SECURITY_CODE', 32)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SEO_SERVICE_WEBHOOK_1', ['TYPE', 'EXTERNAL_ID']);
});

$migration->table('b_seo_service_subscription')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT');
	$columns->varchar('TYPE', 20)->notNull();
	$columns->varchar('GROUP_ID', 50)->notNull();
	$columns->varchar('CALLBACK_SERVER_ID', 50);
	$columns->char('HAS_AUTH', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SEO_SERVICE_SUB_1', ['TYPE', 'GROUP_ID']);
});

$migration->table('b_seo_service_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TYPE', 20)->notNull();
	$columns->varchar('SERVICE_TYPE', 20)->notNull();
	$columns->int('CLIENT_ID')->notNull();
	$columns->int('SORT')->notNull()->default('100');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SEO_SERVICE_QUEUE_TYPE', ['TYPE']);
	$table->addIndex('IX_B_SEO_SERVICE_SERVICE_TYPE_CLIENT_ID', ['SERVICE_TYPE', 'CLIENT_ID']);
});

$migration->table('b_seo_search_engine')->insertRow([
	'CODE' => 'google',
	'ACTIVE' => 'Y',
	'SORT' => 200,
	'NAME' => 'Google',
	'CLIENT_ID' => '868942902147-qrrd6ce1ajfkpse8ieq4gkpdeanvtnno.apps.googleusercontent.com',
	'CLIENT_SECRET' => 'EItMlJpZLC2WRPKB6QsA5bV9',
	'REDIRECT_URI' => 'urn:ietf:wg:oauth:2.0:oob',
], static fn(): bool => $isFirstInstall);
$migration->table('b_seo_search_engine')->insertRow([
	'CODE' => 'yandex',
	'ACTIVE' => 'Y',
	'SORT' => 300,
	'NAME' => 'Yandex',
	'CLIENT_ID' => 'f848c7bfc1d34a94ba6d05439f81bbd7',
	'CLIENT_SECRET' => 'da0e73b2d9cc4e809f3170e49cb9df01',
	'REDIRECT_URI' => 'https://oauth.yandex.ru/verification_code',
], static fn(): bool => $isFirstInstall);
$migration->table('b_seo_search_engine')->insertRow([
	'CODE' => 'yandex_direct',
	'ACTIVE' => 'Y',
	'SORT' => 400,
	'NAME' => 'Yandex.Direct',
	'CLIENT_ID' => '',
	'CLIENT_SECRET' => '',
	'REDIRECT_URI' => 'https://oauth.yandex.ru/verification_code',
], static fn(): bool => $isFirstInstall);
