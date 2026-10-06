<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_catalog_iblock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('IBLOCK_ID')->notNull();
	$columns->char('YANDEX_EXPORT', 1)->notNull()->default('N');
	$columns->char('SUBSCRIPTION', 1)->notNull()->default('N');
	$columns->int('VAT_ID')->default('0');
	$columns->int('PRODUCT_IBLOCK_ID')->notNull()->default('0');
	$columns->int('SKU_PROPERTY_ID')->notNull()->default('0');
	$table->addPrimaryKey('IBLOCK_ID');
	$table->addIndex('IXS_CAT_IB_PRODUCT', ['PRODUCT_IBLOCK_ID']);
	$table->addIndex('IXS_CAT_IB_SKU_PROP', ['SKU_PROPERTY_ID']);
});

$migration->table('b_catalog_price')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('EXTRA_ID');
	$columns->int('CATALOG_GROUP_ID')->notNull();
	$columns->decimal('PRICE', 26, 8)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->int('QUANTITY_FROM');
	$columns->int('QUANTITY_TO');
	$columns->varchar('TMP_ID', 40);
	$columns->decimal('PRICE_SCALE', 26, 12);
	$table->addIndex('IXS_CAT_PRICE_PID', ['PRODUCT_ID', 'CATALOG_GROUP_ID']);
	$table->addIndex('IXS_CAT_PRICE_GID', ['CATALOG_GROUP_ID']);
	$table->addIndex('IXS_CAT_PRICE_SCALE', ['PRICE_SCALE']);
});

$migration->table('b_catalog_product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull();
	$columns->double('QUANTITY')->notNull();
	$columns->char('QUANTITY_TRACE', 1)->notNull()->default('N');
	$columns->double('WEIGHT')->notNull()->default('0');
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->char('PRICE_TYPE', 1)->notNull()->default('S');
	$columns->int('RECUR_SCHEME_LENGTH');
	$columns->char('RECUR_SCHEME_TYPE', 1)->notNull()->default('D');
	$columns->int('TRIAL_PRICE_ID');
	$columns->char('WITHOUT_ORDER', 1)->notNull()->default('N');
	$columns->char('SELECT_BEST_PRICE', 1)->notNull()->default('Y');
	$columns->int('VAT_ID')->default('0');
	$columns->char('VAT_INCLUDED', 1)->default('Y');
	$columns->char('CAN_BUY_ZERO', 1)->notNull()->default('N');
	$columns->char('NEGATIVE_AMOUNT_TRACE', 1)->notNull()->default('D');
	$columns->varchar('TMP_ID', 40);
	$columns->decimal('PURCHASING_PRICE', 26, 8);
	$columns->char('PURCHASING_CURRENCY', 3);
	$columns->char('BARCODE_MULTI', 1)->notNull()->default('N');
	$columns->double('QUANTITY_RESERVED')->default('0');
	$columns->char('SUBSCRIBE', 1);
	$columns->double('WIDTH');
	$columns->double('LENGTH');
	$columns->double('HEIGHT');
	$columns->int('MEASURE');
	$columns->int('TYPE');
	$columns->char('AVAILABLE', 1);
	$columns->char('BUNDLE', 1);
	$table->addPrimaryKey('ID');
});

$migration->table('b_catalog_product2group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->int('ACCESS_LENGTH')->notNull();
	$columns->char('ACCESS_LENGTH_TYPE', 1)->notNull()->default('D');
	$table->addUniqueIndex('IX_C_P2G_PROD_GROUP', ['PRODUCT_ID', 'GROUP_ID']);
});

$migration->table('b_catalog_extra')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 50)->notNull();
	$columns->decimal('PERCENTAGE', 18, 2)->notNull();
});

$migration->table('b_catalog_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 100)->notNull();
	$columns->char('BASE', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull()->default('100');
	$columns->varchar('XML_ID', 255);
	$columns->datetime('TIMESTAMP_X');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
});

$migration->table('b_catalog_group_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CATALOG_GROUP_ID')->notNull();
	$columns->char('LANG', 2)->notNull();
	$columns->varchar('NAME', 100);
	$table->addUniqueIndex('IX_CATALOG_GROUP_ID', ['CATALOG_GROUP_ID', 'LANG']);
});

$migration->table('b_catalog_group2group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CATALOG_GROUP_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->char('BUY', 1)->notNull()->default('Y');
	$table->addUniqueIndex('IX_CATG2G_UNI', ['CATALOG_GROUP_ID', 'GROUP_ID', 'BUY']);
});

$migration->table('b_catalog_load')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('NAME', 250)->notNull();
	$columns->text('VALUE')->notNull();
	$columns->char('TYPE', 1)->notNull()->default('I');
	$columns->char('LAST_USED', 1)->notNull()->default('N');
	$table->addPrimaryKeys(['NAME', 'TYPE']);
});

$migration->table('b_catalog_export')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('FILE_NAME', 100)->notNull();
	$columns->varchar('NAME', 250)->notNull();
	$columns->char('DEFAULT_PROFILE', 1)->notNull()->default('N');
	$columns->char('IN_MENU', 1)->notNull()->default('N');
	$columns->char('IN_AGENT', 1)->notNull()->default('N');
	$columns->char('IN_CRON', 1)->notNull()->default('N');
	$columns->mediumText('SETUP_VARS');
	$columns->datetime('LAST_USE');
	$columns->char('IS_EXPORT', 1)->notNull()->default('Y');
	$columns->char('NEED_EDIT', 1)->notNull()->default('N');
	$columns->datetime('TIMESTAMP_X');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$table->addIndex('BCAT_EX_FILE_NAME', ['FILE_NAME']);
	$table->addIndex('IX_CAT_IS_EXPORT', ['IS_EXPORT']);
});

$migration->table('b_catalog_discount')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('XML_ID', 255);
	$columns->char('SITE_ID', 2)->notNull();
	$columns->int('TYPE')->notNull()->default('0');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('ACTIVE_FROM');
	$columns->datetime('ACTIVE_TO');
	$columns->char('RENEWAL', 1)->notNull()->default('N');
	$columns->varchar('NAME', 255);
	$columns->int('MAX_USES')->notNull()->default('0');
	$columns->int('COUNT_USES')->notNull()->default('0');
	$columns->varchar('COUPON', 20);
	$columns->int('SORT')->notNull()->default('100');
	$columns->decimal('MAX_DISCOUNT', 26, 8);
	$columns->char('VALUE_TYPE', 1)->notNull()->default('P');
	$columns->decimal('VALUE', 26, 8)->notNull()->default('0.0');
	$columns->char('CURRENCY', 3)->notNull();
	$columns->decimal('MIN_ORDER_SUM', 26, 8)->default('0.0');
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->char('COUNT_PERIOD', 1)->notNull()->default('U');
	$columns->int('COUNT_SIZE')->notNull()->default('0');
	$columns->char('COUNT_TYPE', 1)->notNull()->default('Y');
	$columns->datetime('COUNT_FROM');
	$columns->datetime('COUNT_TO');
	$columns->int('ACTION_SIZE')->notNull()->default('0');
	$columns->char('ACTION_TYPE', 1)->notNull()->default('Y');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->int('PRIORITY')->notNull()->default('1');
	$columns->char('LAST_DISCOUNT', 1)->notNull()->default('Y');
	$columns->int('VERSION')->notNull()->default('1');
	$columns->varchar('NOTES', 255);
	$columns->text('CONDITIONS');
	$columns->text('UNPACK');
	$columns->char('USE_COUPONS', 1)->notNull()->default('N');
	$columns->int('SALE_ID');
	$table->addIndex('IX_C_D_ACT', ['ACTIVE', 'ACTIVE_FROM', 'ACTIVE_TO']);
	$table->addIndex('IX_C_D_ACT_B', ['SITE_ID', 'RENEWAL', 'ACTIVE', 'ACTIVE_FROM', 'ACTIVE_TO']);
	$table->addIndex('IX_B_CAT_DISCOUNT_COUPON', ['USE_COUPONS']);
});

$migration->table('b_catalog_discount_cond')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->char('ACTIVE', 1);
	$columns->int('USER_GROUP_ID')->notNull()->default('-1');
	$columns->int('PRICE_TYPE_ID')->notNull()->default('-1');
});

$migration->table('b_catalog_discount_module')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$table->addIndex('IX_CAT_DSC_MOD', ['DISCOUNT_ID']);
});

$migration->table('b_catalog_discount_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->varchar('ENTITY', 255)->notNull();
	$columns->int('ENTITY_ID');
	$columns->varchar('ENTITY_VALUE', 255);
	$columns->varchar('FIELD_ENTITY', 255)->notNull();
	$columns->varchar('FIELD_TABLE', 255)->notNull();
	$table->addIndex('IX_CAT_DSC_ENT_SEARCH', ['DISCOUNT_ID', 'MODULE_ID', 'ENTITY']);
});

$migration->table('b_catalog_discount2product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('PRODUCT_ID')->notNull();
	$table->addUniqueIndex('IX_C_D2P_PRODIS', ['PRODUCT_ID', 'DISCOUNT_ID']);
	$table->addUniqueIndex('IX_C_D2P_PRODIS_B', ['DISCOUNT_ID', 'PRODUCT_ID']);
});

$migration->table('b_catalog_discount2group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$table->addUniqueIndex('IX_C_D2G_GRDIS', ['GROUP_ID', 'DISCOUNT_ID']);
	$table->addUniqueIndex('IX_C_D2G_GRDIS_B', ['DISCOUNT_ID', 'GROUP_ID']);
});

$migration->table('b_catalog_discount2cat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('CATALOG_GROUP_ID')->notNull();
	$table->addUniqueIndex('IX_C_D2C_CATDIS', ['CATALOG_GROUP_ID', 'DISCOUNT_ID']);
	$table->addUniqueIndex('IX_C_D2C_CATDIS_B', ['DISCOUNT_ID', 'CATALOG_GROUP_ID']);
});

$migration->table('b_catalog_discount2section')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('SECTION_ID')->notNull();
	$table->addUniqueIndex('IX_C_D2S_SECDIS', ['SECTION_ID', 'DISCOUNT_ID']);
	$table->addUniqueIndex('IX_C_D2S_SECDIS_B', ['DISCOUNT_ID', 'SECTION_ID']);
});

$migration->table('b_catalog_discount2iblock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('IBLOCK_ID')->notNull();
	$table->addUniqueIndex('IX_C_D2I_IBDIS', ['IBLOCK_ID', 'DISCOUNT_ID']);
	$table->addUniqueIndex('IX_C_D2I_IBDIS_B', ['DISCOUNT_ID', 'IBLOCK_ID']);
});

$migration->table('b_catalog_discount_coupon')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('COUPON', 32)->notNull();
	$columns->datetime('DATE_APPLY');
	$columns->char('ONE_TIME', 1)->notNull()->default('Y');
	$columns->datetime('TIMESTAMP_X');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->text('DESCRIPTION');
	$table->addUniqueIndex('ix_cat_dc_index1', ['DISCOUNT_ID', 'COUPON']);
	$table->addIndex('ix_cat_dc_index2', ['COUPON', 'ACTIVE']);
});

$migration->table('b_catalog_vat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('C_SORT')->notNull()->default('100');
	$columns->varchar('NAME', 50)->notNull()->default('');
	$columns->decimal('RATE', 18, 2)->default('0.00');
	$columns->char('EXCLUDE_VAT', 1)->notNull()->default('N');
	$columns->varchar('XML_ID', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CAT_VAT_ACTIVE', ['ACTIVE']);
});

$migration->table('b_catalog_disc_save_range')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->decimal('RANGE_FROM', 26, 8)->notNull();
	$columns->char('TYPE', 1)->notNull()->default('P');
	$columns->decimal('VALUE', 26, 8)->notNull();
	$table->addIndex('IX_CAT_DSR_DISCOUNT2', ['DISCOUNT_ID', 'RANGE_FROM']);
});

$migration->table('b_catalog_disc_save_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$table->addIndex('IX_CAT_DSG_DISCOUNT', ['DISCOUNT_ID']);
	$table->addIndex('IX_CAT_DSG_GROUP', ['GROUP_ID']);
});

$migration->table('b_catalog_disc_save_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('ACTIVE_FROM')->notNull();
	$columns->datetime('ACTIVE_TO')->notNull();
	$columns->double('RANGE_FROM')->notNull();
	$table->addIndex('IX_CAT_DSU_USER', ['DISCOUNT_ID', 'USER_ID']);
});

$migration->table('b_catalog_store')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TITLE', 75);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('ADDRESS', 245)->notNull();
	$columns->text('DESCRIPTION');
	$columns->varchar('GPS_N', 15)->default('0');
	$columns->varchar('GPS_S', 15)->default('0');
	$columns->varchar('IMAGE_ID', 45);
	$columns->int('LOCATION_ID');
	$columns->datetime('DATE_MODIFY')->defaultCurrentTimestamp();
	$columns->datetime('DATE_CREATE');
	$columns->int('USER_ID');
	$columns->int('MODIFIED_BY');
	$columns->varchar('PHONE', 45);
	$columns->varchar('SCHEDULE', 255);
	$columns->varchar('XML_ID', 255);
	$columns->int('SORT')->notNull()->default('100');
	$columns->varchar('EMAIL', 255);
	$columns->char('ISSUING_CENTER', 1)->notNull()->default('Y');
	$columns->char('SHIPPING_CENTER', 1)->notNull()->default('Y');
	$columns->char('SITE_ID', 2);
	$columns->varchar('CODE', 255);
	$columns->char('IS_DEFAULT', 1)->notNull()->default('N');
});

$migration->table('b_catalog_store_product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->double('AMOUNT')->notNull()->default('0');
	$columns->int('STORE_ID')->notNull();
	$columns->double('QUANTITY_RESERVED')->notNull()->default('0');
	$table->addIndex('IX_CATALOG_STORE_PRODUCT1', ['STORE_ID ASC']);
	$table->addUniqueIndex('IX_CATALOG_STORE_PRODUCT2', ['PRODUCT_ID ASC', 'STORE_ID ASC']);
});

$migration->table('b_catalog_store_barcode')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->varchar('BARCODE', 100);
	$columns->int('STORE_ID');
	$columns->int('ORDER_ID');
	$columns->datetime('DATE_MODIFY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->int('MODIFIED_BY');
	$table->addUniqueIndex('IX_B_CATALOG_STORE_BARCODE1', ['BARCODE']);
	$table->addIndex('IX_B_CATALOG_STORE_BARCODE2', ['PRODUCT_ID']);
});

$migration->table('b_catalog_contractor')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('PERSON_TYPE', 1)->notNull();
	$columns->varchar('PERSON_NAME', 100);
	$columns->varchar('PERSON_LASTNAME', 100);
	$columns->varchar('PERSON_MIDDLENAME', 100);
	$columns->varchar('EMAIL', 100);
	$columns->varchar('PHONE', 45);
	$columns->varchar('POST_INDEX', 45);
	$columns->varchar('COUNTRY', 45);
	$columns->varchar('CITY', 45);
	$columns->varchar('COMPANY', 145);
	$columns->varchar('INN', 145);
	$columns->varchar('KPP', 145);
	$columns->varchar('ADDRESS', 255);
	$columns->datetime('DATE_MODIFY')->defaultCurrentTimestamp();
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->int('MODIFIED_BY');
});

$migration->table('b_catalog_store_docs')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('DOC_TYPE', 1)->notNull();
	$columns->char('SITE_ID', 2);
	$columns->int('CONTRACTOR_ID');
	$columns->datetime('DATE_MODIFY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->int('MODIFIED_BY');
	$columns->char('CURRENCY', 3);
	$columns->char('STATUS', 1)->notNull()->default('N');
	$columns->datetime('DATE_STATUS');
	$columns->datetime('DATE_DOCUMENT');
	$columns->int('STATUS_BY');
	$columns->double('TOTAL');
	$columns->varchar('COMMENTARY', 1000);
	$columns->varchar('TITLE', 255);
	$columns->int('RESPONSIBLE_ID');
	$columns->datetime('ITEMS_ORDER_DATE');
	$columns->datetime('ITEMS_RECEIVED_DATE');
	$columns->varchar('DOC_NUMBER', 64);
	$columns->char('WAS_CANCELLED', 1)->default('N');
	$table->addIndex('IX_B_CATALOG_STORE_DOCS_MOBILE', ['DOC_TYPE', 'DATE_MODIFY']);
});

$migration->table('b_catalog_store_document_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$table->addIndex('IX_B_CATALOG_STORE_DOCUMENT_FILE_DOC_ID', ['DOCUMENT_ID']);
});

$migration->table('b_catalog_docs_element')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOC_ID')->notNull();
	$columns->int('STORE_FROM');
	$columns->int('STORE_TO');
	$columns->int('ELEMENT_ID');
	$columns->double('AMOUNT');
	$columns->decimal('PURCHASING_PRICE', 26, 8);
	$columns->decimal('BASE_PRICE', 26, 8);
	$columns->decimal('BASE_PRICE_EXTRA', 26, 8);
	$columns->int('BASE_PRICE_EXTRA_RATE');
	$columns->text('COMMENT');
	$table->addIndex('IX_B_CATALOG_DOCS_ELEMENT1', ['DOC_ID ASC']);
	$table->addIndex('IX_B_CATALOG_DOCS_ELEMENT2', ['ELEMENT_ID']);
	$table->addIndex('IX_B_CATALOG_DOCS_ELEMENT3', ['STORE_FROM']);
	$table->addIndex('IX_B_CATALOG_DOCS_ELEMENT4', ['STORE_TO']);
});

$migration->table('b_catalog_docs_barcode')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOC_ID')->notNull();
	$columns->int('DOC_ELEMENT_ID')->notNull();
	$columns->varchar('BARCODE', 100)->notNull();
	$table->addIndex('IX_B_CATALOG_DOCS_BARCODE1', ['DOC_ELEMENT_ID ASC']);
	$table->addIndex('IX_B_CATALOG_DOCS_BARCODE_OWNER', ['DOC_ID']);
});

$migration->table('b_catalog_measure')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CODE')->notNull();
	$columns->varchar('MEASURE_TITLE', 500);
	$columns->varchar('SYMBOL_RUS', 20);
	$columns->varchar('SYMBOL_INTL', 20);
	$columns->varchar('SYMBOL_LETTER_INTL', 20);
	$columns->char('IS_DEFAULT', 1)->notNull()->default('N');
	$table->addUniqueIndex('IX_B_CATALOG_MEASURE1', ['CODE']);
});

$migration->table('b_catalog_measure_ratio')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->double('RATIO')->notNull()->default('1');
	$columns->char('IS_DEFAULT', 1)->notNull()->default('N');
	$table->addUniqueIndex('IX_B_CATALOG_MEASURE_RATIO', ['PRODUCT_ID', 'RATIO']);
});

$migration->table('b_catalog_product_sets')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TYPE')->notNull();
	$columns->int('SET_ID')->notNull();
	$columns->char('ACTIVE', 1)->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('ITEM_ID')->notNull();
	$columns->double('QUANTITY');
	$columns->int('MEASURE');
	$columns->double('DISCOUNT_PERCENT');
	$columns->int('SORT')->notNull()->default('100');
	$columns->int('CREATED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('MODIFIED_BY');
	$columns->datetime('TIMESTAMP_X');
	$columns->varchar('XML_ID', 255);
	$table->addIndex('IX_CAT_PR_SET_TYPE', ['TYPE']);
	$table->addIndex('IX_CAT_PR_SET_OWNER_ID', ['OWNER_ID']);
	$table->addIndex('IX_CAT_PR_SET_SET_ID', ['SET_ID']);
	$table->addIndex('IX_CAT_PR_SET_ITEM_ID', ['ITEM_ID']);
});

$migration->table('b_catalog_viewed_product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FUSER_ID')->notNull();
	$columns->datetime('DATE_VISIT')->notNull();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('ELEMENT_ID')->notNull()->default('0');
	$columns->char('SITE_ID', 2)->notNull();
	$columns->int('VIEW_COUNT')->notNull()->default('1');
	$columns->varchar('RECOMMENDATION', 40);
	$table->addIndex('IX_CAT_V_PR_VISIT', ['FUSER_ID', 'SITE_ID', 'DATE_VISIT DESC']);
	$table->addIndex('IX_CAT_V_PR_PRODUCT', ['FUSER_ID', 'SITE_ID', 'ELEMENT_ID']);
	$table->addIndex('IX_CAT_V_PR_PRODUCT_VISIT', ['ELEMENT_ID', 'DATE_VISIT']);
});

$migration->table('b_catalog_subscribe')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_FROM')->notNull();
	$columns->datetime('DATE_TO');
	$columns->varchar('USER_CONTACT', 255)->notNull();
	$columns->smallInt('CONTACT_TYPE')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned();
	$columns->int('ITEM_ID')->unsigned()->notNull();
	$columns->char('NEED_SENDING', 1)->notNull()->default('N');
	$columns->char('SITE_ID', 2)->notNull();
	$columns->int('LANDING_SITE_ID');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CAT_SUB_USER_CONTACT', ['USER_CONTACT']);
	$table->addIndex('IX_CAT_SUB_USER_ID', ['USER_ID']);
	$table->addIndex('IX_CAT_SUB_ITEM_ID', ['ITEM_ID']);
});

$migration->table('b_catalog_subscribe_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_FROM')->notNull();
	$columns->varchar('USER_CONTACT', 255)->notNull();
	$columns->char('TOKEN', 6)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CAT_SUB_ACS_USER_CONTACT', ['USER_CONTACT']);
});

$migration->table('b_catalog_rounding')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CATALOG_GROUP_ID')->notNull();
	$columns->decimal('PRICE', 26, 8)->notNull();
	$columns->int('ROUND_TYPE')->notNull();
	$columns->decimal('ROUND_PRECISION', 26, 8)->notNull();
	$columns->int('CREATED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_MODIFY');
	$table->addIndex('IX_CAT_RND_CATALOG_GROUP', ['CATALOG_GROUP_ID']);
});

$migration->table('b_catalog_product_compilation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DEAL_ID')->notNull();
	$columns->text('PRODUCT_IDS')->notNull();
	$columns->datetime('CREATION_DATE')->notNull();
	$columns->int('CHAT_ID');
	$columns->int('QUEUE_ID');
	$table->addIndex('IX_CAT_COMPILATION_DEAL_ID', ['DEAL_ID']);
});

$migration->table('b_catalog_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('NAME', 250)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_catalog_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('RELATION', 8)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('ROLE_ID', ['ROLE_ID']);
	$table->addIndex('RELATION', ['RELATION']);
});

$migration->table('b_catalog_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('PERMISSION_ID', 32)->notNull()->default('0');
	$columns->int('VALUE')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('ROLE_ID', ['ROLE_ID']);
	$table->addIndex('PERMISSION_ID', ['PERMISSION_ID']);
});

$migration->table('b_catalog_store_batch')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ELEMENT_ID')->notNull();
	$columns->int('STORE_ID')->notNull();
	$columns->double('AVAILABLE_AMOUNT');
	$columns->decimal('PURCHASING_PRICE', 26, 8);
	$columns->char('PURCHASING_CURRENCY', 3);
	$table->addIndex('IX_B_ELEMENT_ID', ['ELEMENT_ID']);
	$table->addIndex('IX_B_STORE_ID', ['STORE_ID']);
});

$migration->table('b_catalog_store_batch_docs_element')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ELEMENT_ID');
	$columns->int('SHIPMENT_ITEM_STORE_ID');
	$columns->double('AMOUNT')->notNull();
	$columns->int('PRODUCT_BATCH_ID')->notNull();
	$columns->decimal('BATCH_PRICE', 26, 8);
	$columns->char('BATCH_CURRENCY', 3);
	$table->addIndex('IX_B_SHIPMENT_ITEM_STORE_ID', ['SHIPMENT_ITEM_STORE_ID']);
	$table->addIndex('IX_B_DOCUMENT_ELEMENT_ID', ['DOCUMENT_ELEMENT_ID']);
	$table->addIndex('IX_B_PRODUCT_BATCH_ID', ['PRODUCT_BATCH_ID']);
});

$migration->table('b_catalog_agent_contract')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('CONTRACTOR_ID')->unsigned();
	$columns->datetime('DATE_MODIFY');
	$columns->datetime('DATE_CREATE');
	$columns->int('MODIFIED_BY');
	$columns->int('CREATED_BY');
	$table->addPrimaryKey('ID');
	$table->addIndex('CONTRACTOR_ID', ['CONTRACTOR_ID']);
});

$migration->table('b_catalog_agent_product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('CONTRACT_ID')->unsigned()->notNull();
	$columns->int('PRODUCT_ID')->unsigned()->notNull();
	$columns->varchar('PRODUCT_TYPE', 8)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('CONTRACT_ID', ['CONTRACT_ID']);
	$table->addIndex('PRODUCT_ID', ['PRODUCT_ID']);
});

$migration->table('b_catalog_agent_contract_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CONTRACT_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$table->addIndex('CONTRACT_ID', ['CONTRACT_ID']);
});

