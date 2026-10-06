<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_sale_auxiliary')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->varchar('ITEM', 255)->notNull();
	$columns->varchar('ITEM_MD5', 32)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$table->addUniqueIndex('IX_STT_USER_ITEM', ['USER_ID', 'ITEM_MD5']);
});

$migration->table('b_sale_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->char('LID', 2)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$table->addPrimaryKey('LID');
});

$migration->table('b_sale_fuser')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->int('USER_ID');
	$columns->varchar('CODE', 32);
	$table->addIndex('IX_USER_ID', ['USER_ID']);
	$table->addIndex('IX_CODE', ['CODE(32)']);
});

$migration->table('b_sale_basket')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FUSER_ID')->notNull();
	$columns->int('ORDER_ID');
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('PRODUCT_PRICE_ID');
	$columns->int('PRICE_TYPE_ID');
	$columns->decimal('PRICE', 26, 8)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->decimal('BASE_PRICE', 26, 8);
	$columns->char('VAT_INCLUDED', 1)->notNull()->default('Y');
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->datetime('DATE_REFRESH');
	$columns->double('WEIGHT', 18, 2);
	$columns->double('QUANTITY', 18, 4)->notNull()->default('0');
	$columns->char('LID', 2)->notNull();
	$columns->char('DELAY', 1)->notNull()->default('N');
	$columns->varchar('NAME', 255)->notNull();
	$columns->char('CAN_BUY', 1)->notNull()->default('Y');
	$columns->varchar('MARKING_CODE_GROUP', 100);
	$columns->varchar('MODULE', 100);
	$columns->varchar('CALLBACK_FUNC', 100);
	$columns->varchar('NOTES', 250);
	$columns->varchar('ORDER_CALLBACK_FUNC', 100);
	$columns->varchar('DETAIL_PAGE_URL', 250);
	$columns->decimal('DISCOUNT_PRICE', 26, 8)->notNull();
	$columns->varchar('CANCEL_CALLBACK_FUNC', 100);
	$columns->varchar('PAY_CALLBACK_FUNC', 100);
	$columns->varchar('PRODUCT_PROVIDER_CLASS', 100);
	$columns->varchar('CATALOG_XML_ID', 100);
	$columns->varchar('PRODUCT_XML_ID', 100);
	$columns->varchar('DISCOUNT_NAME', 255);
	$columns->char('DISCOUNT_VALUE', 32);
	$columns->char('DISCOUNT_COUPON', 32);
	$columns->decimal('VAT_RATE', 18, 4)->default('0.00');
	$columns->char('SUBSCRIBE', 1)->notNull()->default('N');
	$columns->char('DEDUCTED', 1)->notNull()->default('N');
	$columns->char('RESERVED', 1)->notNull()->default('N');
	$columns->char('BARCODE_MULTI', 1)->notNull()->default('N');
	$columns->double('RESERVE_QUANTITY');
	$columns->char('CUSTOM_PRICE', 1)->notNull()->default('N');
	$columns->varchar('DIMENSIONS', 255);
	$columns->int('TYPE');
	$columns->int('SET_PARENT_ID');
	$columns->int('MEASURE_CODE');
	$columns->varchar('MEASURE_NAME', 50);
	$columns->varchar('RECOMMENDATION', 40);
	$columns->varchar('XML_ID', 255);
	$columns->int('SORT')->notNull()->default('100');
	$table->addIndex('IXS_BASKET_LID', ['LID']);
	$table->addIndex('IXS_BASKET_USER_ID_LID_ORDER_ID', ['FUSER_ID', 'LID', 'ORDER_ID']);
	$table->addIndex('IXS_BASKET_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IXS_BASKET_PRODUCT_ID', ['PRODUCT_ID']);
	$table->addIndex('IXS_BASKET_PRODUCT_PRICE_ID', ['PRODUCT_PRICE_ID']);
	$table->addIndex('IXS_SBAS_XML_ID', ['PRODUCT_XML_ID', 'CATALOG_XML_ID']);
	$table->addIndex('IXS_BASKET_DATE_INSERT', ['DATE_INSERT']);
	$table->addIndex('IXS_BASKET_SET_PARENT_ID', ['SET_PARENT_ID']);
});

$migration->table('b_sale_basket_props')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('BASKET_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('VALUE', 255);
	$columns->varchar('CODE', 255);
	$columns->int('SORT')->notNull()->default('100');
	$columns->varchar('XML_ID', 255);
	$table->addIndex('IXS_BASKET_PROPS_BASKET', ['BASKET_ID']);
	$table->addIndex('IXS_BASKET_PROPS_CODE', ['CODE']);
});

$migration->table('b_sale_order')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('LID', 2)->notNull();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->char('PAYED', 1)->notNull()->default('N');
	$columns->datetime('DATE_PAYED');
	$columns->int('EMP_PAYED_ID');
	$columns->char('CANCELED', 1)->notNull()->default('N');
	$columns->datetime('DATE_CANCELED');
	$columns->int('EMP_CANCELED_ID');
	$columns->varchar('REASON_CANCELED', 255);
	$columns->varchar('STATUS_ID', 2)->notNull();
	$columns->datetime('DATE_STATUS')->notNull();
	$columns->int('EMP_STATUS_ID');
	$columns->decimal('PRICE_DELIVERY', 26, 8)->notNull();
	$columns->decimal('PRICE_PAYMENT', 26, 8)->notNull();
	$columns->char('ALLOW_DELIVERY', 1)->notNull()->default('N');
	$columns->datetime('DATE_ALLOW_DELIVERY');
	$columns->int('EMP_ALLOW_DELIVERY_ID');
	$columns->char('DEDUCTED', 1)->notNull()->default('N');
	$columns->datetime('DATE_DEDUCTED');
	$columns->int('EMP_DEDUCTED_ID');
	$columns->varchar('REASON_UNDO_DEDUCTED', 255);
	$columns->char('MARKED', 1)->notNull()->default('N');
	$columns->datetime('DATE_MARKED');
	$columns->int('EMP_MARKED_ID');
	$columns->varchar('REASON_MARKED', 255);
	$columns->char('RESERVED', 1)->notNull()->default('N');
	$columns->decimal('PRICE', 26, 8)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->decimal('DISCOUNT_VALUE', 26, 8)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('PAY_SYSTEM_ID');
	$columns->varchar('DELIVERY_ID', 50);
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->varchar('USER_DESCRIPTION', 2000);
	$columns->varchar('ADDITIONAL_INFO', 255);
	$columns->char('PS_STATUS', 1);
	$columns->char('PS_STATUS_CODE', 5);
	$columns->varchar('PS_STATUS_DESCRIPTION', 250);
	$columns->varchar('PS_STATUS_MESSAGE', 250);
	$columns->decimal('PS_SUM', 26, 8);
	$columns->char('PS_CURRENCY', 3);
	$columns->datetime('PS_RESPONSE_DATE');
	$columns->text('COMMENTS');
	$columns->decimal('TAX_VALUE', 26, 8)->notNull();
	$columns->varchar('STAT_GID', 255);
	$columns->decimal('SUM_PAID', 26, 8)->notNull()->default('0');
	$columns->char('IS_RECURRING', 1)->notNull()->default('N');
	$columns->int('RECURRING_ID');
	$columns->varchar('PAY_VOUCHER_NUM', 20);
	$columns->date('PAY_VOUCHER_DATE');
	$columns->int('LOCKED_BY');
	$columns->datetime('DATE_LOCK');
	$columns->char('RECOUNT_FLAG', 1)->notNull()->default('Y');
	$columns->int('AFFILIATE_ID');
	$columns->varchar('DELIVERY_DOC_NUM', 20);
	$columns->date('DELIVERY_DOC_DATE');
	$columns->char('UPDATED_1C', 1)->notNull()->default('N');
	$columns->int('STORE_ID');
	$columns->varchar('ORDER_TOPIC', 255);
	$columns->int('CREATED_BY');
	$columns->int('RESPONSIBLE_ID');
	$columns->int('COMPANY_ID');
	$columns->datetime('DATE_PAY_BEFORE');
	$columns->datetime('DATE_BILL');
	$columns->varchar('ACCOUNT_NUMBER', 100);
	$columns->varchar('TRACKING_NUMBER', 255);
	$columns->varchar('XML_ID', 255);
	$columns->varchar('ID_1C', 36);
	$columns->varchar('VERSION_1C', 15);
	$columns->int('VERSION')->notNull()->default('0');
	$columns->char('EXTERNAL_ORDER', 1)->notNull()->default('N');
	$columns->char('RUNNING', 1)->notNull()->default('N');
	$columns->varchar('BX_USER_ID', 32);
	$columns->mediumText('SEARCH_CONTENT');
	$columns->char('IS_SYNC_B24', 1)->notNull()->default('N');
	$table->addIndex('IXS_ORDER_PERSON_TYPE_ID', ['PERSON_TYPE_ID']);
	$table->addIndex('IXS_ORDER_STATUS_ID', ['STATUS_ID']);
	$table->addIndex('IXS_ORDER_REC_ID', ['RECURRING_ID']);
	$table->addIndex('IX_SOO_AFFILIATE_ID', ['AFFILIATE_ID']);
	$table->addIndex('IXS_ORDER_UPDATED_1C', ['UPDATED_1C']);
	$table->addIndex('IXS_SALE_COUNT', ['USER_ID', 'LID', 'PAYED', 'CANCELED']);
	$table->addIndex('IXS_DATE_UPDATE', ['DATE_UPDATE']);
	$table->addIndex('IXS_XML_ID', ['XML_ID']);
	$table->addIndex('IXS_ID_1C', ['ID_1C']);
	$table->addIndex('IX_BSO_DATE_ALLOW_DELIVERY', ['DATE_ALLOW_DELIVERY']);
	$table->addIndex('IX_BSO_ALLOW_DELIVERY', ['ALLOW_DELIVERY']);
	$table->addIndex('IX_BSO_DATE_CANCELED', ['DATE_CANCELED']);
	$table->addIndex('IX_BSO_CANCELED', ['CANCELED']);
	$table->addIndex('IX_BSO_DATE_PAYED', ['DATE_PAYED']);
	$table->addIndex('IX_BSO_DATE_INSERT', ['DATE_INSERT']);
	$table->addIndex('IX_BSO_DATE_PAY_BEFORE', ['DATE_PAY_BEFORE']);
	$table->addUniqueIndex('IXS_ACCOUNT_NUMBER', ['ACCOUNT_NUMBER']);
	$table->addFulltextIndex('IX_B_SALE_ORDER_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_sale_person_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 255);
	$columns->int('SORT')->notNull()->default('150');
	$columns->varchar('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('ENTITY_REGISTRY_TYPE', 255);
	$columns->varchar('XML_ID', 255);
	$table->addIndex('IXS_PERSON_TYPE_LID', ['LID']);
});

$migration->table('b_sale_order_props_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 50);
	$columns->int('SORT')->notNull()->default('100');
	$table->addIndex('IXS_ORDER_PROPS_GROUP_PERSON_TYPE_ID', ['PERSON_TYPE_ID']);
});

$migration->table('b_sale_order_props')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('TYPE', 20)->notNull();
	$columns->char('REQUIRED', 1)->notNull()->default('N');
	$columns->varchar('DEFAULT_VALUE', 500);
	$columns->int('SORT')->notNull()->default('100');
	$columns->char('USER_PROPS', 1)->notNull()->default('N');
	$columns->char('IS_LOCATION', 1)->notNull()->default('N');
	$columns->int('PROPS_GROUP_ID')->notNull();
	$columns->varchar('DESCRIPTION', 255);
	$columns->char('IS_EMAIL', 1)->notNull()->default('N');
	$columns->char('IS_PROFILE_NAME', 1)->notNull()->default('N');
	$columns->char('IS_PAYER', 1)->notNull()->default('N');
	$columns->char('IS_LOCATION4TAX', 1)->notNull()->default('N');
	$columns->char('IS_FILTERED', 1)->notNull()->default('N');
	$columns->varchar('CODE', 50);
	$columns->char('IS_ZIP', 1)->notNull()->default('N');
	$columns->char('IS_PHONE', 1)->notNull()->default('N');
	$columns->varchar('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('UTIL', 1)->notNull()->default('N');
	$columns->int('INPUT_FIELD_LOCATION')->notNull()->default('0');
	$columns->char('MULTIPLE', 1)->notNull()->default('N');
	$columns->char('IS_ADDRESS', 1)->notNull()->default('N');
	$columns->char('IS_ADDRESS_FROM', 1)->notNull()->default('N');
	$columns->char('IS_ADDRESS_TO', 1)->notNull()->default('N');
	$columns->varchar('SETTINGS', 500);
	$columns->varchar('ENTITY_REGISTRY_TYPE', 255);
	$columns->varchar('XML_ID', 255);
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$table->addIndex('IXS_ORDER_PROPS_PERSON_TYPE_ID', ['PERSON_TYPE_ID']);
	$table->addIndex('IXS_ORDER_PROPS_TYPE', ['TYPE']);
	$table->addIndex('IXS_CODE_OPP', ['CODE']);
});

$migration->table('b_sale_order_props_value')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('ORDER_PROPS_ID');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('VALUE', 500);
	$columns->varchar('CODE', 50);
	$columns->varchar('XML_ID', 255);
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$table->addUniqueIndex('IX_SOPV_ENT_PROP_UNI', ['ENTITY_ID', 'ENTITY_TYPE(200)', 'ORDER_PROPS_ID']);
	$table->addIndex('IX_SOPV_ORD_PROP_UNI', ['ORDER_ID', 'ORDER_PROPS_ID']);
});

$migration->table('b_sale_order_props_variant')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_PROPS_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('VALUE', 255);
	$columns->int('SORT')->notNull()->default('100');
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('XML_ID', 255);
	$table->addIndex('IXS_ORDER_PROPS_VARIANT_ORDER_PROPS_ID', ['ORDER_PROPS_ID']);
});

$migration->table('b_sale_order_props_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PROPERTY_ID')->notNull();
	$columns->varchar('ENTITY_ID', 35)->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$table->addPrimaryKeys(['PROPERTY_ID', 'ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_sale_pay_system_action')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PAY_SYSTEM_ID');
	$columns->int('PERSON_TYPE_ID');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('PSA_NAME', 255)->notNull();
	$columns->varchar('CODE', 50);
	$columns->int('SORT')->notNull()->default('100');
	$columns->varchar('DESCRIPTION', 2000);
	$columns->varchar('ACTION_FILE', 255);
	$columns->varchar('RESULT_FILE', 255);
	$columns->char('NEW_WINDOW', 1)->notNull()->default('Y');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('PS_MODE', 20);
	$columns->varchar('PS_CLIENT_TYPE', 10);
	$columns->text('PARAMS');
	$columns->text('TARIF');
	$columns->char('HAVE_PAYMENT', 1)->notNull()->default('N');
	$columns->char('HAVE_ACTION', 1)->notNull()->default('N');
	$columns->char('AUTO_CHANGE_1C', 1)->notNull()->default('N');
	$columns->char('HAVE_RESULT', 1)->notNull()->default('N');
	$columns->char('HAVE_PRICE', 1)->notNull()->default('N');
	$columns->char('HAVE_PREPAY', 1)->notNull()->default('N');
	$columns->char('HAVE_RESULT_RECEIVE', 1)->notNull()->default('N');
	$columns->char('ALLOW_EDIT_PAYMENT', 1)->notNull()->default('Y');
	$columns->varchar('ENCODING', 45);
	$columns->int('LOGOTIP');
	$columns->char('IS_CASH', 1)->notNull()->default('N');
	$columns->char('CAN_PRINT_CHECK', 1)->notNull()->default('N');
	$columns->varchar('ENTITY_REGISTRY_TYPE', 255);
	$columns->varchar('XML_ID', 255);
	$table->addIndex('B_SALE_PAY_SYSTEM_ACTION_PS_CLIENT_TYPE', ['PS_CLIENT_TYPE']);
});

$migration->table('b_sale_pay_system_rest_handlers')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 50);
	$columns->int('SORT')->notNull()->default('100');
	$columns->text('SETTINGS');
	$columns->varchar('APP_ID', 128);
	$table->addUniqueIndex('IX_SALE_PS_HANDLER_CODE', ['CODE']);
});

$migration->table('b_sale_location_country')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('SHORT_NAME', 100);
	$table->addIndex('IX_NAME', ['NAME']);
});

$migration->table('b_sale_location_country_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('COUNTRY_ID')->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('SHORT_NAME', 100);
	$table->addUniqueIndex('IXS_LOCAT_CNTR_LID', ['COUNTRY_ID', 'LID']);
});

$migration->table('b_sale_location_region')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('SHORT_NAME', 100);
});

$migration->table('b_sale_location_region_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('REGION_ID')->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('SHORT_NAME', 100);
	$table->addUniqueIndex('IXS_LOCAT_REGION_LID', ['REGION_ID', 'LID']);
	$table->addIndex('IXS_NAME', ['NAME']);
});

$migration->table('b_sale_location_city')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('SHORT_NAME', 100);
	$columns->int('REGION_ID');
	$table->addIndex('IXS_LOCAT_REGION_ID', ['REGION_ID']);
});

$migration->table('b_sale_location_city_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CITY_ID')->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('SHORT_NAME', 100);
	$table->addUniqueIndex('IXS_LOCAT_CITY_LID', ['CITY_ID', 'LID']);
	$table->addIndex('IX_NAME', ['NAME']);
});

$migration->table('b_sale_location_zip')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('LOCATION_ID')->notNull()->default('0');
	$columns->varchar('ZIP', 10)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_LOCATION_ID', ['LOCATION_ID']);
	$table->addIndex('IX_ZIP', ['ZIP']);
});

$migration->table('b_sale_location')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SORT')->notNull()->default('100');
	$columns->varchar('CODE', 100)->notNull();
	$columns->int('LEFT_MARGIN');
	$columns->int('RIGHT_MARGIN');
	$columns->int('PARENT_ID')->default('0');
	$columns->int('DEPTH_LEVEL')->default('1');
	$columns->int('TYPE_ID');
	$columns->decimal('LATITUDE', 8, 6);
	$columns->decimal('LONGITUDE', 9, 6);
	$columns->int('COUNTRY_ID');
	$columns->int('REGION_ID');
	$columns->int('CITY_ID');
	$columns->char('LOC_DEFAULT', 1)->notNull()->default('N');
	$table->addUniqueIndex('IX_SALE_LOCATION_CODE', ['CODE']);
	$table->addIndex('IX_SALE_LOCATION_MARGINS', ['LEFT_MARGIN', 'RIGHT_MARGIN']);
	$table->addIndex('IX_SALE_LOCATION_MARGINS_REV', ['RIGHT_MARGIN', 'LEFT_MARGIN']);
	$table->addIndex('IX_SALE_LOCATION_PARENT', ['PARENT_ID']);
	$table->addIndex('IX_SALE_LOCATION_DL', ['DEPTH_LEVEL']);
	$table->addIndex('IX_SALE_LOCATION_TYPE', ['TYPE_ID']);
	$table->addIndex('IXS_LOCATION_COUNTRY_ID', ['COUNTRY_ID']);
	$table->addIndex('IXS_LOCATION_REGION_ID', ['REGION_ID']);
	$table->addIndex('IXS_LOCATION_CITY_ID', ['CITY_ID']);
	$table->addIndex('IXS_LOCATION_SORT', ['SORT']);
	$table->addIndex('IX_SALE_LOCATION_TYPE_MARGIN', ['TYPE_ID', 'LEFT_MARGIN', 'RIGHT_MARGIN']);
});

$migration->table('b_sale_loc_name')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->int('LOCATION_ID')->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('NAME_UPPER', 100)->notNull();
	$columns->varchar('NAME_NORM', 100);
	$columns->varchar('SHORT_NAME', 100);
	$table->addIndex('IX_SALE_L_NAME_NAME_UPPER', ['NAME_UPPER']);
	$table->addIndex('IX_SALE_L_NAME_NAME_NORM', ['NAME_NORM']);
	$table->addIndex('IX_SALE_L_NAME_LID_LID', ['LOCATION_ID', 'LANGUAGE_ID']);
});

$migration->table('b_sale_loc_ext_srv')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 100)->notNull();
});

$migration->table('b_sale_loc_ext')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SERVICE_ID')->notNull();
	$columns->int('LOCATION_ID')->notNull();
	$columns->varchar('XML_ID', 100)->notNull();
	$table->addIndex('IX_B_SALE_LOC_EXT_LID_SID', ['LOCATION_ID', 'SERVICE_ID']);
	$table->addIndex('IX_B_SALE_LOC_EXT_XML_SID', ['XML_ID', 'SERVICE_ID']);
});

$migration->table('b_sale_loc_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 30)->notNull();
	$columns->int('SORT')->default('100');
	$columns->int('DISPLAY_SORT')->default('100');
});

$migration->table('b_sale_loc_type_name')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->int('TYPE_ID')->notNull();
	$table->addIndex('IX_SALE_L_TYPE_NAME_TID_LID', ['TYPE_ID', 'LANGUAGE_ID']);
});

$migration->table('b_sale_loc_2site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOCATION_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->char('LOCATION_TYPE', 1)->notNull()->default('L');
	$table->addPrimaryKeys(['SITE_ID', 'LOCATION_ID', 'LOCATION_TYPE']);
});

$migration->table('b_sale_loc_def2site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('LOCATION_CODE', 100)->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->int('SORT')->default('100');
	$table->addPrimaryKeys(['LOCATION_CODE', 'SITE_ID']);
});

$migration->table('b_sale_location_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 100)->notNull();
	$columns->int('SORT')->notNull()->default('100');
	$table->addUniqueIndex('IX_SALE_LOCATION_GROUP_CODE', ['CODE']);
});

$migration->table('b_sale_location_group_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('LOCATION_GROUP_ID')->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 250)->notNull();
	$table->addUniqueIndex('IX_LOCATION_GROUP_LID', ['LOCATION_GROUP_ID', 'LID']);
});

$migration->table('b_sale_location2location_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOCATION_ID')->notNull();
	$columns->int('LOCATION_GROUP_ID')->notNull();
	$table->addPrimaryKeys(['LOCATION_ID', 'LOCATION_GROUP_ID']);
});

$migration->table('b_sale_delivery2location')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DELIVERY_ID')->notNull();
	$columns->varchar('LOCATION_CODE', 100)->notNull();
	$columns->char('LOCATION_TYPE', 2)->notNull()->default('L');
	$table->addPrimaryKeys(['DELIVERY_ID', 'LOCATION_CODE', 'LOCATION_TYPE']);
});

$migration->table('b_sale_company2location')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('COMPANY_ID')->notNull();
	$columns->varchar('LOCATION_CODE', 100)->notNull();
	$columns->char('LOCATION_TYPE', 1)->notNull()->default('L');
	$table->addPrimaryKeys(['COMPANY_ID', 'LOCATION_CODE', 'LOCATION_TYPE']);
});

$migration->table('b_sale_company2service')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('COMPANY_ID')->notNull();
	$columns->int('SERVICE_ID')->notNull();
	$columns->int('SERVICE_TYPE')->notNull();
	$table->addPrimaryKeys(['COMPANY_ID', 'SERVICE_ID', 'SERVICE_TYPE']);
});

$migration->table('b_sale_discount')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('XML_ID', 255);
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 255);
	$columns->decimal('PRICE_FROM', 26, 8);
	$columns->decimal('PRICE_TO', 26, 8);
	$columns->char('CURRENCY', 3);
	$columns->decimal('DISCOUNT_VALUE', 26, 8)->notNull();
	$columns->char('DISCOUNT_TYPE', 1)->notNull()->default('P');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('100');
	$columns->datetime('ACTIVE_FROM');
	$columns->datetime('ACTIVE_TO');
	$columns->datetime('TIMESTAMP_X');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->int('PRIORITY')->notNull()->default('1');
	$columns->char('LAST_DISCOUNT', 1)->notNull()->default('Y');
	$columns->char('LAST_LEVEL_DISCOUNT', 1)->default('N');
	$columns->int('VERSION')->notNull()->default('1');
	$columns->mediumText('CONDITIONS');
	$columns->mediumText('UNPACK');
	$columns->mediumText('ACTIONS');
	$columns->mediumText('APPLICATION');
	$columns->text('PREDICTION_TEXT');
	$columns->mediumText('PREDICTIONS');
	$columns->mediumText('PREDICTIONS_APP');
	$columns->char('USE_COUPONS', 1)->notNull()->default('N');
	$columns->varchar('EXECUTE_MODULE', 50)->notNull()->default('all');
	$columns->int('EXECUTE_MODE')->default('0');
	$columns->char('HAS_INDEX', 1)->default('N');
	$columns->varchar('PRESET_ID', 255);
	$columns->text('SHORT_DESCRIPTION');
	$table->addIndex('IXS_DISCOUNT_LID', ['LID']);
	$table->addIndex('IX_SSD_ACTIVE_DATE', ['ACTIVE_FROM', 'ACTIVE_TO']);
	$table->addIndex('IX_PRESET_ID', ['PRESET_ID']);
});

$migration->table('b_sale_discount_coupon')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('ACTIVE_FROM');
	$columns->datetime('ACTIVE_TO');
	$columns->varchar('COUPON', 32)->notNull();
	$columns->int('TYPE')->notNull()->default('0');
	$columns->int('MAX_USE')->notNull()->default('0');
	$columns->int('USE_COUNT')->notNull()->default('0');
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->datetime('DATE_APPLY');
	$columns->datetime('TIMESTAMP_X');
	$columns->int('MODIFIED_BY');
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->text('DESCRIPTION');
	$table->addIndex('IX_S_D_COUPON', ['COUPON']);
});

$migration->table('b_sale_discount_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->char('ACTIVE', 1);
	$columns->int('GROUP_ID')->notNull();
	$table->addUniqueIndex('IX_S_DISGRP', ['DISCOUNT_ID', 'GROUP_ID']);
	$table->addUniqueIndex('IX_S_DISGRP_G', ['GROUP_ID', 'DISCOUNT_ID']);
});

$migration->table('b_sale_discount_module')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$table->addIndex('IX_SALE_DSC_MOD', ['DISCOUNT_ID']);
});

$migration->table('b_sale_discount_entities')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->varchar('ENTITY', 255)->notNull();
	$columns->varchar('FIELD_ENTITY', 255)->notNull();
	$columns->varchar('FIELD_TABLE', 255)->notNull();
	$table->addIndex('IX_SALE_DSC_ENT_DISCOUNT_ID', ['DISCOUNT_ID']);
});

$migration->table('b_sale_order_discount')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('DISCOUNT_HASH', 32)->notNull();
	$columns->mediumText('CONDITIONS');
	$columns->mediumText('UNPACK');
	$columns->mediumText('ACTIONS');
	$columns->mediumText('APPLICATION');
	$columns->char('USE_COUPONS', 1)->notNull();
	$columns->int('SORT')->notNull();
	$columns->int('PRIORITY')->notNull();
	$columns->char('LAST_DISCOUNT', 1)->notNull();
	$columns->mediumText('ACTIONS_DESCR');
	$table->addIndex('IX_SALE_ORDER_DSC_HASH', ['DISCOUNT_HASH']);
});

$migration->table('b_sale_order_coupons')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('ORDER_DISCOUNT_ID')->notNull();
	$columns->varchar('COUPON', 32)->notNull();
	$columns->int('TYPE')->notNull();
	$columns->int('COUPON_ID')->notNull();
	$columns->text('DATA');
	$table->addIndex('IX_SALE_ORDER_CPN_ORDER', ['ORDER_ID']);
});

$migration->table('b_sale_order_modules')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_DISCOUNT_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$table->addIndex('IX_SALE_ORDER_MDL_DSC', ['ORDER_DISCOUNT_ID']);
});

$migration->table('b_sale_order_rules')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('ORDER_DISCOUNT_ID')->notNull();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('ENTITY_TYPE')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_VALUE', 255);
	$columns->int('COUPON_ID')->notNull();
	$columns->char('APPLY', 1)->notNull();
	$columns->text('ACTION_BLOCK_LIST');
	$columns->int('APPLY_BLOCK_COUNTER')->notNull()->default('0');
	$table->addIndex('IX_SALE_ORDER_RULES_ORD', ['ORDER_ID']);
});

$migration->table('b_sale_order_rules_descr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('ORDER_DISCOUNT_ID')->notNull();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('RULE_ID')->notNull();
	$columns->text('DESCR')->notNull();
	$table->addIndex('IX_SALE_ORDER_RULES_DS_ORD', ['ORDER_ID']);
	$table->addIndex('IX_SALE_ORDER_RULES_DS_RULE', ['RULE_ID']);
});

$migration->table('b_sale_order_discount_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('ENTITY_TYPE')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_VALUE', 255);
	$columns->mediumText('ENTITY_DATA')->notNull();
	$table->addIndex('IX_SALE_DSC_DATA_CMX', ['ORDER_ID', 'ENTITY_TYPE']);
});

$migration->table('b_sale_order_round')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('APPLY_BLOCK_COUNTER')->notNull()->default('0');
	$columns->char('ORDER_ROUND', 1)->notNull();
	$columns->int('ENTITY_TYPE')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_VALUE', 255);
	$columns->char('APPLY', 1)->notNull();
	$columns->mediumText('ROUND_RULE')->notNull();
	$table->addIndex('IX_SALE_ORDER_ROUND_ORD', ['ORDER_ID']);
});

$migration->table('b_sale_user_props')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->varchar('XML_ID', 50);
	$columns->varchar('VERSION_1C', 15);
	$table->addIndex('IXS_USER_PROPS_USER_ID', ['USER_ID']);
	$table->addIndex('IXS_USER_PROPS_PERSON_TYPE_ID', ['PERSON_TYPE_ID']);
	$table->addIndex('IXS_USER_PROPS_XML_ID', ['XML_ID']);
});

$migration->table('b_sale_d_ix_element')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('ELEMENT_ID')->notNull();
	$table->addIndex('IX_S_DIXE_O_1', ['ELEMENT_ID', 'DISCOUNT_ID']);
});

$migration->table('b_sale_d_ix_section')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('SECTION_ID')->notNull();
	$table->addIndex('IX_S_DIXS_O_1', ['SECTION_ID', 'DISCOUNT_ID']);
});

$migration->table('b_sale_user_props_value')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_PROPS_ID')->notNull();
	$columns->int('ORDER_PROPS_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('VALUE', 255);
	$table->addIndex('IXS_USER_PROPS_VALUE_USER_PROPS_ID', ['USER_PROPS_ID']);
	$table->addIndex('IXS_USER_PROPS_VALUE_ORDER_PROPS_ID', ['ORDER_PROPS_ID']);
});

$migration->table('b_sale_status')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 2)->notNull();
	$columns->char('TYPE', 1)->notNull()->default('O');
	$columns->int('SORT')->notNull()->default('100');
	$columns->char('NOTIFY', 1)->notNull()->default('Y');
	$columns->varchar('COLOR', 10);
	$columns->varchar('XML_ID', 255);
	$table->addPrimaryKey('ID');
});

$migration->table('b_sale_status_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('STATUS_ID', 2)->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('DESCRIPTION', 250);
	$table->addPrimaryKeys(['STATUS_ID', 'LID']);
});

$migration->table('b_sale_status_group_task')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('STATUS_ID', 2)->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->int('TASK_ID')->notNull();
	$table->addPrimaryKeys(['STATUS_ID', 'GROUP_ID', 'TASK_ID']);
});

$migration->table('b_sale_tax')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 250)->notNull();
	$columns->varchar('DESCRIPTION', 255);
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->varchar('CODE', 50);
	$table->addIndex('itax_lid', ['LID']);
});

$migration->table('b_sale_tax_rate')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TAX_ID')->notNull();
	$columns->int('PERSON_TYPE_ID');
	$columns->decimal('VALUE', 18, 4)->notNull();
	$columns->char('CURRENCY', 3);
	$columns->char('IS_PERCENT', 1)->notNull()->default('Y');
	$columns->char('IS_IN_PRICE', 1)->notNull()->default('N');
	$columns->int('APPLY_ORDER')->notNull()->default('100');
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$table->addIndex('itax_pers_type', ['PERSON_TYPE_ID']);
	$table->addIndex('itax_lid', ['TAX_ID']);
	$table->addIndex('itax_inprice', ['IS_IN_PRICE']);
});

$migration->table('b_sale_tax2location')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('TAX_RATE_ID')->notNull();
	$columns->varchar('LOCATION_CODE', 100)->notNull();
	$columns->char('LOCATION_TYPE', 1)->notNull()->default('L');
	$table->addPrimaryKeys(['TAX_RATE_ID', 'LOCATION_CODE', 'LOCATION_TYPE']);
});

$migration->table('b_sale_tax_exempt2group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->int('TAX_ID')->notNull();
	$table->addPrimaryKeys(['GROUP_ID', 'TAX_ID']);
});

$migration->table('b_sale_order_tax')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->varchar('TAX_NAME', 255)->notNull();
	$columns->decimal('VALUE', 18, 4);
	$columns->decimal('VALUE_MONEY', 26, 8)->notNull();
	$columns->int('APPLY_ORDER')->notNull();
	$columns->varchar('CODE', 50);
	$columns->char('IS_PERCENT', 1)->notNull()->default('Y');
	$columns->char('IS_IN_PRICE', 1)->notNull()->default('N');
	$table->addIndex('ixs_sot_order_id', ['ORDER_ID']);
});

$migration->table('b_sale_order_flags2group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->char('ORDER_FLAG', 1)->notNull();
	$table->addUniqueIndex('ix_sale_ordfla2group', ['GROUP_ID', 'ORDER_FLAG']);
});

$migration->table('b_sale_site2group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$table->addUniqueIndex('ix_sale_site2group', ['GROUP_ID', 'SITE_ID']);
});

$migration->table('b_sale_user_account')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->decimal('CURRENT_BUDGET', 26, 8)->notNull()->default('0.0');
	$columns->char('CURRENCY', 3)->notNull();
	$columns->char('LOCKED', 1)->notNull()->default('N');
	$columns->datetime('DATE_LOCKED');
	$columns->text('NOTES');
	$table->addUniqueIndex('IX_S_U_USER_ID', ['USER_ID', 'CURRENCY']);
});

$migration->table('b_sale_recurring')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->varchar('MODULE', 100);
	$columns->int('PRODUCT_ID');
	$columns->varchar('PRODUCT_NAME', 255);
	$columns->varchar('PRODUCT_URL', 255);
	$columns->int('PRODUCT_PRICE_ID');
	$columns->char('PRICE_TYPE', 1)->notNull()->default('R');
	$columns->char('RECUR_SCHEME_TYPE', 1)->notNull()->default('M');
	$columns->int('RECUR_SCHEME_LENGTH')->notNull()->default('0');
	$columns->char('WITHOUT_ORDER', 1)->notNull()->default('N');
	$columns->decimal('PRICE', 18, 4)->notNull()->default('0.0');
	$columns->char('CURRENCY', 3);
	$columns->char('CANCELED', 1)->notNull()->default('N');
	$columns->datetime('DATE_CANCELED');
	$columns->datetime('PRIOR_DATE');
	$columns->datetime('NEXT_DATE')->notNull();
	$columns->varchar('CALLBACK_FUNC', 100);
	$columns->varchar('PRODUCT_PROVIDER_CLASS', 100);
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('CANCELED_REASON', 255);
	$columns->int('ORDER_ID')->notNull();
	$columns->int('REMAINING_ATTEMPTS')->notNull()->default('0');
	$columns->char('SUCCESS_PAYMENT', 1)->notNull()->default('Y');
	$table->addIndex('IX_S_R_USER_ID', ['USER_ID']);
	$table->addIndex('IX_S_R_NEXT_DATE', ['NEXT_DATE', 'CANCELED', 'REMAINING_ATTEMPTS']);
	$table->addIndex('IX_S_R_PRODUCT_ID', ['MODULE', 'PRODUCT_ID', 'PRODUCT_PRICE_ID']);
});

$migration->table('b_sale_user_cards')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('100');
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->int('PAY_SYSTEM_ACTION_ID')->notNull();
	$columns->char('CURRENCY', 3);
	$columns->varchar('CARD_TYPE', 20)->notNull();
	$columns->text('CARD_NUM')->notNull();
	$columns->varchar('CARD_CODE', 5);
	$columns->int('CARD_EXP_MONTH')->notNull();
	$columns->int('CARD_EXP_YEAR')->notNull();
	$columns->varchar('DESCRIPTION', 255);
	$columns->decimal('SUM_MIN', 26, 8);
	$columns->decimal('SUM_MAX', 26, 8);
	$columns->char('SUM_CURRENCY', 3);
	$columns->char('LAST_STATUS', 1);
	$columns->varchar('LAST_STATUS_CODE', 5);
	$columns->varchar('LAST_STATUS_DESCRIPTION', 250);
	$columns->varchar('LAST_STATUS_MESSAGE', 255);
	$columns->decimal('LAST_SUM', 26, 8);
	$columns->char('LAST_CURRENCY', 3);
	$columns->datetime('LAST_DATE');
	$table->addIndex('IX_S_U_C_USER_ID', ['USER_ID', 'ACTIVE', 'CURRENCY']);
});

$migration->table('b_sale_user_transact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->datetime('TRANSACT_DATE')->notNull();
	$columns->decimal('AMOUNT', 26, 8)->notNull()->default('0.0');
	$columns->char('CURRENCY', 3)->notNull();
	$columns->char('DEBIT', 1)->notNull()->default('N');
	$columns->int('ORDER_ID');
	$columns->varchar('DESCRIPTION', 255)->notNull();
	$columns->text('NOTES');
	$columns->int('PAYMENT_ID');
	$columns->int('EMPLOYEE_ID');
	$table->addIndex('IX_S_U_T_USER_ID_CURRENCY', ['USER_ID', 'CURRENCY']);
	$table->addIndex('IX_S_U_T_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IX_S_U_T_PAYMENT_ID', ['PAYMENT_ID']);
});

$migration->table('b_sale_affiliate_plan')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->varchar('NAME', 250)->notNull();
	$columns->text('DESCRIPTION');
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->decimal('BASE_RATE', 18, 4)->notNull()->default('0');
	$columns->char('BASE_RATE_TYPE', 1)->notNull()->default('P');
	$columns->char('BASE_RATE_CURRENCY', 3);
	$columns->decimal('MIN_PAY', 26, 8)->notNull()->default('0');
	$columns->decimal('MIN_PLAN_VALUE', 26, 8);
	$columns->char('VALUE_CURRENCY', 3);
});

$migration->table('b_sale_affiliate')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('AFFILIATE_ID');
	$columns->int('PLAN_ID')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->decimal('PAID_SUM', 26, 8)->notNull()->default('0');
	$columns->decimal('APPROVED_SUM', 26, 8)->notNull()->default('0');
	$columns->decimal('PENDING_SUM', 26, 8)->notNull()->default('0');
	$columns->int('ITEMS_NUMBER')->notNull()->default('0');
	$columns->decimal('ITEMS_SUM', 26, 8)->notNull()->default('0');
	$columns->datetime('LAST_CALCULATE');
	$columns->varchar('AFF_SITE', 200);
	$columns->text('AFF_DESCRIPTION');
	$columns->char('FIX_PLAN', 1)->notNull()->default('N');
	$table->addUniqueIndex('IX_SAA_USER_ID', ['USER_ID', 'SITE_ID']);
	$table->addIndex('IX_SAA_AFFILIATE_ID', ['AFFILIATE_ID']);
});

$migration->table('b_sale_affiliate_plan_section')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PLAN_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull()->default('catalog');
	$columns->varchar('SECTION_ID', 255)->notNull();
	$columns->decimal('RATE', 18, 4)->notNull()->default('0');
	$columns->char('RATE_TYPE', 1)->notNull()->default('P');
	$columns->char('RATE_CURRENCY', 3);
	$table->addUniqueIndex('IX_SAP_PLAN_ID', ['PLAN_ID', 'MODULE_ID', 'SECTION_ID']);
});

$migration->table('b_sale_affiliate_tier')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->decimal('RATE1', 18, 4)->notNull()->default('0');
	$columns->decimal('RATE2', 18, 4)->notNull()->default('0');
	$columns->decimal('RATE3', 18, 4)->notNull()->default('0');
	$columns->decimal('RATE4', 18, 4)->notNull()->default('0');
	$columns->decimal('RATE5', 18, 4)->notNull()->default('0');
	$table->addUniqueIndex('IX_SAT_SITE_ID', ['SITE_ID']);
});

$migration->table('b_sale_affiliate_transact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('AFFILIATE_ID')->notNull();
	$columns->datetime('TIMESTAMP_X')->notNull();
	$columns->datetime('TRANSACT_DATE')->notNull();
	$columns->decimal('AMOUNT', 26, 8)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->char('DEBIT', 1)->notNull()->default('N');
	$columns->varchar('DESCRIPTION', 100)->notNull();
	$columns->int('EMPLOYEE_ID');
	$table->addIndex('IX_SAT_AFFILIATE_ID', ['AFFILIATE_ID']);
});

$migration->table('b_sale_export')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->text('VARS');
});

$migration->table('b_sale_order_delivery')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ORDER_ID')->notNull();
	$columns->varchar('ACCOUNT_NUMBER', 100);
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->datetime('DATE_REQUEST');
	$columns->datetime('DATE_UPDATE');
	$columns->varchar('DELIVERY_LOCATION', 50);
	$columns->text('PARAMS');
	$columns->varchar('STATUS_ID', 2)->notNull();
	$columns->decimal('PRICE_DELIVERY', 26, 8);
	$columns->decimal('DISCOUNT_PRICE', 26, 8);
	$columns->decimal('BASE_PRICE_DELIVERY', 26, 8);
	$columns->char('CUSTOM_PRICE_DELIVERY', 1);
	$columns->char('ALLOW_DELIVERY', 1)->default('N');
	$columns->datetime('DATE_ALLOW_DELIVERY');
	$columns->int('EMP_ALLOW_DELIVERY_ID');
	$columns->char('DEDUCTED', 1)->default('N');
	$columns->datetime('DATE_DEDUCTED');
	$columns->int('EMP_DEDUCTED_ID');
	$columns->varchar('REASON_UNDO_DEDUCTED', 255);
	$columns->char('RESERVED', 1);
	$columns->int('DELIVERY_ID')->notNull();
	$columns->varchar('DELIVERY_DOC_NUM', 20);
	$columns->datetime('DELIVERY_DOC_DATE');
	$columns->varchar('TRACKING_NUMBER', 255);
	$columns->varchar('XML_ID', 255);
	$columns->varchar('DELIVERY_NAME', 128);
	$columns->char('CANCELED', 1)->default('N');
	$columns->datetime('DATE_CANCELED');
	$columns->int('EMP_CANCELED_ID');
	$columns->varchar('REASON_CANCELED', 255)->default('');
	$columns->char('MARKED', 1);
	$columns->datetime('DATE_MARKED');
	$columns->int('EMP_MARKED_ID');
	$columns->varchar('REASON_MARKED', 255);
	$columns->varchar('CURRENCY', 3);
	$columns->char('SYSTEM', 1)->notNull()->default('N');
	$columns->double('WEIGHT', 18, 4)->default('0');
	$columns->int('RESPONSIBLE_ID');
	$columns->int('EMP_RESPONSIBLE_ID');
	$columns->datetime('DATE_RESPONSIBLE_ID');
	$columns->text('COMMENTS');
	$columns->int('COMPANY_ID');
	$columns->int('TRACKING_STATUS');
	$columns->varchar('TRACKING_DESCRIPTION', 255);
	$columns->datetime('TRACKING_LAST_CHECK');
	$columns->datetime('TRACKING_LAST_CHANGE');
	$columns->varchar('ID_1C', 36);
	$columns->varchar('VERSION_1C', 15);
	$columns->char('EXTERNAL_DELIVERY', 1)->notNull()->default('N');
	$columns->char('UPDATED_1C', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BSOD_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IX_BSOD_DATE_ALLOW_DELIVERY', ['DATE_ALLOW_DELIVERY']);
	$table->addIndex('IX_BSOD_ALLOW_DELIVERY', ['ALLOW_DELIVERY']);
	$table->addIndex('IX_BSOD_DATE_CANCELED', ['DATE_CANCELED']);
	$table->addIndex('IX_BSOD_CANCELED', ['CANCELED']);
	$table->addUniqueIndex('IXS_DLV_ACCOUNT_NUMBER', ['ACCOUNT_NUMBER']);
});

$migration->table('b_sale_order_dlv_basket')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ORDER_DELIVERY_ID')->notNull();
	$columns->int('BASKET_ID')->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->decimal('QUANTITY', 18, 4)->notNull();
	$columns->decimal('RESERVED_QUANTITY', 18, 4)->notNull();
	$columns->varchar('XML_ID', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BSODB_ORDER_DELIVERY_ID', ['ORDER_DELIVERY_ID']);
	$table->addIndex('IX_S_O_DB_BASKET_ID', ['BASKET_ID']);
});

$migration->table('b_sale_order_delivery_req')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->datetime('DATE_REQUEST');
	$columns->varchar('DELIVERY_LOCATION', 50);
	$columns->text('PARAMS');
	$columns->int('SHIPMENT_ID');
	$table->addIndex('IX_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IX_SHIPMENT_ID', ['SHIPMENT_ID']);
});

$migration->table('b_sale_order_payment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ORDER_ID')->notNull();
	$columns->varchar('ACCOUNT_NUMBER', 100);
	$columns->char('PAID', 1)->notNull()->default('N');
	$columns->datetime('DATE_PAID');
	$columns->int('EMP_PAID_ID');
	$columns->int('PAY_SYSTEM_ID')->notNull();
	$columns->char('PS_STATUS', 1);
	$columns->varchar('PS_INVOICE_ID', 250);
	$columns->varchar('PS_STATUS_CODE', 255);
	$columns->varchar('PS_STATUS_DESCRIPTION', 512);
	$columns->varchar('PS_STATUS_MESSAGE', 250);
	$columns->decimal('PS_SUM', 26, 8);
	$columns->char('PS_CURRENCY', 3);
	$columns->datetime('PS_RESPONSE_DATE');
	$columns->varchar('PS_RECURRING_TOKEN', 255);
	$columns->varchar('PS_CARD_NUMBER', 64);
	$columns->varchar('PAY_VOUCHER_NUM', 20);
	$columns->date('PAY_VOUCHER_DATE');
	$columns->datetime('DATE_PAY_BEFORE');
	$columns->datetime('DATE_BILL');
	$columns->varchar('XML_ID', 255);
	$columns->decimal('SUM', 26, 8)->notNull();
	$columns->decimal('PRICE_COD', 26, 8)->notNull()->default('0');
	$columns->char('CURRENCY', 3)->notNull();
	$columns->varchar('PAY_SYSTEM_NAME', 128)->notNull();
	$columns->int('RESPONSIBLE_ID');
	$columns->datetime('DATE_RESPONSIBLE_ID');
	$columns->int('EMP_RESPONSIBLE_ID');
	$columns->text('COMMENTS');
	$columns->int('COMPANY_ID');
	$columns->date('PAY_RETURN_DATE');
	$columns->int('EMP_RETURN_ID');
	$columns->varchar('PAY_RETURN_NUM', 20);
	$columns->text('PAY_RETURN_COMMENT');
	$columns->char('IS_RETURN', 1)->notNull()->default('N');
	$columns->char('MARKED', 1);
	$columns->datetime('DATE_MARKED');
	$columns->int('EMP_MARKED_ID');
	$columns->varchar('REASON_MARKED', 255);
	$columns->varchar('ID_1C', 36);
	$columns->varchar('VERSION_1C', 15);
	$columns->char('EXTERNAL_PAYMENT', 1)->notNull()->default('N');
	$columns->char('UPDATED_1C', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BSOP_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IX_BSOP_DATE_PAID', ['DATE_PAID']);
	$table->addIndex('IX_BSOP_PAID', ['PAID']);
	$table->addUniqueIndex('IXS_PAY_ACCOUNT_NUMBER', ['ACCOUNT_NUMBER']);
});

$migration->table('b_sale_order_payment_item')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PAYMENT_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 15)->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->decimal('QUANTITY', 18, 4)->notNull();
	$columns->varchar('XML_ID', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_S_O_PI_ENTITY_ID_TYPE', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_S_O_PI_PAYMENT_ID', ['PAYMENT_ID']);
});

$migration->table('b_sale_product2product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('PARENT_PRODUCT_ID')->notNull();
	$columns->int('CNT')->notNull();
	$table->addIndex('IXS_PRODUCT2PRODUCT_PRODUCT_ID', ['PRODUCT_ID']);
});

$migration->table('b_sale_order_product_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('RELATED_PRODUCT_ID')->notNull();
	$columns->datetime('ORDER_DATE')->notNull();
	$columns->int('CNT')->notNull()->default('1');
	$table->addUniqueIndex('IXS_PRODUCT2PRODUCT_ON_DATE', ['PRODUCT_ID', 'RELATED_PRODUCT_ID', 'ORDER_DATE']);
	$table->addIndex('IXS_ORDER_DATE', ['ORDER_DATE']);
});

$migration->table('b_sale_person_type_site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PERSON_TYPE_ID')->notNull()->default('0');
	$columns->char('SITE_ID', 2)->notNull()->default('');
	$table->addPrimaryKeys(['PERSON_TYPE_ID', 'SITE_ID']);
});

$migration->table('b_sale_viewed_product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('FUSER_ID')->unsigned()->notNull()->default('0');
	$columns->datetime('DATE_VISIT')->notNull();
	$columns->int('PRODUCT_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('MODULE', 100);
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('DETAIL_PAGE_URL', 255);
	$columns->char('CURRENCY', 3);
	$columns->decimal('PRICE', 26, 8)->notNull()->default('0.00');
	$columns->varchar('NOTES', 255);
	$columns->int('PREVIEW_PICTURE');
	$columns->int('DETAIL_PICTURE');
	$columns->varchar('CALLBACK_FUNC', 45);
	$columns->varchar('PRODUCT_PROVIDER_CLASS', 100);
	$table->addPrimaryKey('ID');
	$table->addIndex('ixLID', ['FUSER_ID', 'LID']);
	$table->addIndex('ixPRODUCT_ID', ['PRODUCT_ID']);
	$table->addIndex('ixDATE_VISIT', ['DATE_VISIT']);
});

$migration->table('b_sale_order_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('H_USER_ID')->unsigned()->notNull();
	$columns->datetime('H_DATE_INSERT')->notNull();
	$columns->int('H_ORDER_ID')->unsigned()->notNull();
	$columns->char('H_CURRENCY', 3)->notNull();
	$columns->int('PERSON_TYPE_ID')->unsigned();
	$columns->char('PAYED', 1);
	$columns->datetime('DATE_PAYED');
	$columns->int('EMP_PAYED_ID')->unsigned();
	$columns->char('CANCELED', 1);
	$columns->datetime('DATE_CANCELED');
	$columns->varchar('REASON_CANCELED', 255);
	$columns->varchar('STATUS_ID', 2)->notNull();
	$columns->datetime('DATE_STATUS');
	$columns->decimal('PRICE_DELIVERY', 26, 8);
	$columns->char('ALLOW_DELIVERY', 1);
	$columns->datetime('DATE_ALLOW_DELIVERY');
	$columns->char('RESERVED', 1);
	$columns->char('DEDUCTED', 1);
	$columns->datetime('DATE_DEDUCTED');
	$columns->varchar('REASON_UNDO_DEDUCTED', 255);
	$columns->char('MARKED', 1);
	$columns->datetime('DATE_MARKED');
	$columns->varchar('REASON_MARKED', 255);
	$columns->decimal('PRICE', 26, 8);
	$columns->char('CURRENCY', 3);
	$columns->decimal('DISCOUNT_VALUE', 26, 8);
	$columns->int('USER_ID')->unsigned();
	$columns->int('PAY_SYSTEM_ID')->unsigned();
	$columns->varchar('DELIVERY_ID', 50);
	$columns->char('PS_STATUS', 1);
	$columns->char('PS_STATUS_CODE', 5);
	$columns->varchar('PS_STATUS_DESCRIPTION', 250);
	$columns->varchar('PS_STATUS_MESSAGE', 250);
	$columns->decimal('PS_SUM', 26, 8);
	$columns->char('PS_CURRENCY', 3);
	$columns->datetime('PS_RESPONSE_DATE');
	$columns->decimal('TAX_VALUE', 26, 8);
	$columns->varchar('STAT_GID', 255);
	$columns->decimal('SUM_PAID', 26, 8);
	$columns->varchar('PAY_VOUCHER_NUM', 20);
	$columns->date('PAY_VOUCHER_DATE');
	$columns->int('AFFILIATE_ID')->unsigned();
	$columns->varchar('DELIVERY_DOC_NUM', 20);
	$columns->date('DELIVERY_DOC_DATE');
	$table->addPrimaryKey('ID');
	$table->addIndex('ixH_ORDER_ID', ['H_ORDER_ID']);
});

$migration->table('b_sale_delivery2paysystem')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DELIVERY_ID')->notNull();
	$columns->char('LINK_DIRECTION', 1)->notNull();
	$columns->int('PAYSYSTEM_ID')->notNull();
	$table->addIndex('IX_DELIVERY', ['DELIVERY_ID']);
	$table->addIndex('IX_PAYSYSTEM', ['PAYSYSTEM_ID']);
	$table->addIndex('LINK_DIRECTION', ['LINK_DIRECTION']);
});

$migration->table('b_sale_store_barcode')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('BASKET_ID')->notNull();
	$columns->varchar('BARCODE', 100);
	$columns->varchar('MARKING_CODE', 200);
	$columns->int('STORE_ID');
	$columns->double('QUANTITY')->notNull();
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY');
	$columns->int('MODIFIED_BY');
	$columns->int('ORDER_DELIVERY_BASKET_ID')->notNull()->default('0');
	$table->addIndex('IX_BSSB_O_DLV_BASKET_ID', ['ORDER_DELIVERY_BASKET_ID']);
});

$migration->table('b_sale_order_change')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->varchar('TYPE', 255)->notNull();
	$columns->varchar('DATA', 512);
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY', 50);
	$columns->int('ENTITY_ID');
	$table->addIndex('IXS_ORDER_ID_CHANGE', ['ORDER_ID']);
	$table->addIndex('IXS_TYPE_CHANGE', ['TYPE']);
});

$migration->table('b_sale_order_processing')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->default('0');
	$columns->char('PRODUCTS_ADDED', 1)->default('N');
	$columns->char('PRODUCTS_REMOVED', 1)->default('N');
	$table->addIndex('IX_ORDER_ID', ['ORDER_ID']);
});

$migration->table('b_sale_tp')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 20)->notNull();
	$columns->char('ACTIVE', 1)->notNull();
	$columns->varchar('NAME', 500)->notNull();
	$columns->text('DESCRIPTION');
	$columns->text('SETTINGS');
	$columns->varchar('CATALOG_SECTION_TAB_CLASS_NAME', 255);
	$columns->varchar('CLASS', 255);
	$columns->varchar('XML_ID', 255);
	$table->addUniqueIndex('IX_CODE', ['CODE']);
});

$migration->table('b_sale_delivery_srv')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 50);
	$columns->int('PARENT_ID');
	$columns->varchar('NAME', 255)->notNull();
	$columns->char('ACTIVE', 1)->notNull();
	$columns->text('DESCRIPTION');
	$columns->int('SORT')->notNull();
	$columns->int('LOGOTIP');
	$columns->longText('CONFIG');
	$columns->varchar('CLASS_NAME', 255)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->varchar('TRACKING_PARAMS', 255);
	$columns->char('ALLOW_EDIT_SHIPMENT', 1)->notNull()->default('Y');
	$columns->int('VAT_ID');
	$columns->varchar('XML_ID', 255);
	$table->addIndex('IX_BSD_SRV_CODE', ['CODE']);
	$table->addIndex('IX_BSD_SRV_PARENT_ID', ['PARENT_ID']);
});

$migration->table('b_sale_service_rstr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SERVICE_ID')->notNull();
	$columns->int('SERVICE_TYPE')->notNull();
	$columns->int('SORT')->default('100');
	$columns->varchar('CLASS_NAME', 255)->notNull();
	$columns->text('PARAMS');
	$table->addIndex('IX_BSSR_SERVICE_ID', ['SERVICE_ID']);
});

$migration->table('b_sale_delivery_es')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 50);
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('CLASS_NAME', 255)->notNull();
	$columns->text('PARAMS');
	$columns->char('RIGHTS', 3)->notNull();
	$columns->int('DELIVERY_ID')->notNull();
	$columns->varchar('INIT_VALUE', 255);
	$columns->char('ACTIVE', 1)->notNull();
	$columns->int('SORT')->default('100');
	$table->addIndex('IX_BSD_ES_DELIVERY_ID', ['DELIVERY_ID']);
});

$migration->table('b_sale_company')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 128)->notNull();
	$columns->varchar('LOCATION_ID', 128);
	$columns->varchar('CODE', 45);
	$columns->int('SORT')->default('100');
	$columns->varchar('XML_ID', 45);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY');
	$columns->int('MODIFIED_BY');
	$columns->varchar('ADDRESS', 255);
});

$migration->table('b_sale_bizval')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('CODE_KEY', 50)->notNull();
	$columns->varchar('CONSUMER_KEY', 50)->notNull();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->varchar('PROVIDER_KEY', 50)->notNull();
	$columns->text('PROVIDER_VALUE');
	$table->addPrimaryKeys(['CODE_KEY', 'CONSUMER_KEY', 'PERSON_TYPE_ID']);
});

$migration->table('b_sale_bizval_persondomain')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->char('DOMAIN', 1)->notNull();
	$table->addPrimaryKeys(['PERSON_TYPE_ID', 'DOMAIN']);
});

$migration->table('b_sale_bizval_code_1c')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->int('CODE_INDEX')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$table->addPrimaryKeys(['PERSON_TYPE_ID', 'CODE_INDEX']);
});

$migration->table('b_sale_order_delivery_es')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SHIPMENT_ID')->notNull();
	$columns->int('EXTRA_SERVICE_ID')->notNull();
	$columns->varchar('VALUE', 255);
	$table->addIndex('IX_BSOD_ES_SHIPMENT_ID', ['SHIPMENT_ID']);
	$table->addIndex('IX_BSOD_ES_EXTRA_SERVICE_ID', ['EXTRA_SERVICE_ID']);
});

$migration->table('b_sale_tp_map')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('VALUE_EXTERNAL', 100)->notNull();
	$columns->varchar('VALUE_INTERNAL', 100)->notNull();
	$columns->text('PARAMS');
	$table->addUniqueIndex('IX_BSTPM_E_V_V', ['ENTITY_ID', 'VALUE_EXTERNAL', 'VALUE_INTERNAL']);
});

$migration->table('b_sale_tp_map_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TRADING_PLATFORM_ID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$table->addUniqueIndex('IX_CODE_TRADING_PLATFORM_ID', ['TRADING_PLATFORM_ID', 'CODE']);
});

$migration->table('b_sale_tp_ebay_cat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('CATEGORY_ID')->notNull();
	$columns->int('PARENT_ID')->notNull();
	$columns->int('LEVEL')->notNull();
	$columns->datetime('LAST_UPDATE')->notNull();
});

$migration->table('b_sale_tp_ebay_cat_var')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CATEGORY_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('VALUE');
	$columns->char('REQUIRED', 1)->notNull();
	$columns->int('MIN_VALUES')->notNull();
	$columns->int('MAX_VALUES')->notNull();
	$columns->varchar('SELECTION_MODE', 255)->notNull();
	$columns->char('ALLOWED_AS_VARIATION', 1)->notNull();
	$columns->varchar('HELP_URL', 255)->notNull();
});

$migration->table('b_sale_tp_ebay_fq')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('FEED_TYPE', 50)->notNull();
	$columns->longText('DATA')->notNull();
});

$migration->table('b_sale_tp_ebay_fr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('FILENAME', 255)->notNull();
	$columns->varchar('FEED_TYPE', 50)->notNull();
	$columns->datetime('UPLOAD_TIME')->notNull();
	$columns->varchar('PROCESSING_REQUEST_ID', 50);
	$columns->varchar('PROCESSING_RESULT', 100);
	$columns->longText('RESULTS');
	$columns->varchar('IS_SUCCESS', 1);
});

$migration->table('b_sale_tp_order')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('TRADING_PLATFORM_ID')->notNull();
	$columns->varchar('EXTERNAL_ORDER_ID', 100)->notNull();
	$columns->text('PARAMS');
	$columns->varchar('XML_ID', 255);
	$table->addUniqueIndex('IX_UNIQ_NUMBERS', ['ORDER_ID', 'TRADING_PLATFORM_ID', 'EXTERNAL_ORDER_ID']);
});

$migration->table('b_sale_gift_related_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DISCOUNT_ID')->notNull();
	$columns->int('ELEMENT_ID');
	$columns->int('SECTION_ID');
	$columns->int('MAIN_PRODUCT_SECTION_ID');
	$table->addIndex('IX_S_GRD_O_1', ['DISCOUNT_ID']);
	$table->addIndex('IX_S_GRD_O_2', ['MAIN_PRODUCT_SECTION_ID']);
});

$migration->table('b_sale_pay_system_err_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->text('MESSAGE')->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
});

$migration->table('b_sale_yandex_settings')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('SHOP_ID')->notNull();
	$columns->text('CSR');
	$columns->text('SIGN');
	$columns->text('CERT');
	$columns->text('PKEY');
	$columns->text('PUB_KEY');
	$table->addPrimaryKey('SHOP_ID');
});

$migration->table('b_sale_hdaln')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOCATION_ID')->notNull();
	$columns->int('LEFT_MARGIN')->notNull();
	$columns->int('RIGHT_MARGIN')->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$table->addPrimaryKey('LOCATION_ID');
	$table->addIndex('IX_BSHDALN_NAME', ['NAME']);
});

$migration->table('b_sale_entity_marker')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ORDER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 25)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('TYPE', 10)->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('MESSAGE', 255)->notNull();
	$columns->varchar('COMMENT', 500);
	$columns->int('USER_ID');
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_UPDATE');
	$columns->char('SUCCESS', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BSEM_TYPE', ['TYPE']);
	$table->addIndex('IX_BSEM_ENTITY_TYPE', ['ENTITY_TYPE']);
});

$migration->table('b_sale_tp_vk_profile')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('DESCRIPTION', 255)->notNull();
	$columns->int('PLATFORM_ID')->notNull();
	$columns->text('VK_SETTINGS');
	$columns->text('EXPORT_SETTINGS');
	$columns->text('OAUTH');
	$columns->text('PROCESS');
	$columns->text('JOURNAL');
});

$migration->table('b_sale_tp_vk_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('EXPORT_ID')->notNull();
	$columns->varchar('ERROR_CODE', 255);
	$columns->varchar('ITEM_ID', 255);
	$columns->datetime('TIME');
	$columns->text('ERROR_PARAMS');
	$table->addUniqueIndex('IX_BSTPVKL_I_E_E', ['ID', 'EXPORT_ID', 'ERROR_CODE']);
});

$migration->table('b_sale_order_archive')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('LID', 2)->notNull();
	$columns->int('ORDER_ID')->notNull();
	$columns->varchar('ACCOUNT_NUMBER', 100)->notNull();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('STATUS_ID', 2)->notNull();
	$columns->char('PAYED', 1)->notNull()->default('N');
	$columns->char('DEDUCTED', 1)->notNull()->default('N');
	$columns->char('CANCELED', 1)->notNull()->default('N');
	$columns->decimal('PRICE', 26, 8)->notNull();
	$columns->decimal('SUM_PAID', 26, 8);
	$columns->char('CURRENCY', 3)->notNull();
	$columns->varchar('XML_ID', 255);
	$columns->varchar('ID_1C', 36);
	$columns->mediumText('ORDER_DATA');
	$columns->int('RESPONSIBLE_ID');
	$columns->int('COMPANY_ID');
	$columns->int('VERSION')->notNull();
	$columns->datetime('DATE_ARCHIVED')->notNull();
	$table->addIndex('IXS_USER_ID', ['USER_ID']);
	$table->addIndex('IXS_STATUS_ID', ['STATUS_ID']);
	$table->addIndex('IXS_DATE_INSERT', ['DATE_INSERT']);
	$table->addIndex('IXS_DATE_ARCHIVED', ['DATE_ARCHIVED']);
	$table->addIndex('IXS_XML_ID', ['XML_ID']);
	$table->addIndex('IXS_ID_1C', ['ID_1C']);
	$table->addIndex('IXS_RESPONSIBLE_ID', ['RESPONSIBLE_ID']);
	$table->addIndex('IXS_COMPANY_ID', ['COMPANY_ID']);
	$table->addIndex('IXS_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IXS_ACCOUNT_NUMBER', ['ACCOUNT_NUMBER']);
});

$migration->table('b_sale_order_archive_packed')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ORDER_ARCHIVE_ID')->notNull();
	$columns->mediumText('ORDER_DATA');
	$table->addPrimaryKey('ORDER_ARCHIVE_ID');
});

$migration->table('b_sale_basket_archive')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ARCHIVE_ID')->notNull();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('PRODUCT_PRICE_ID');
	$columns->varchar('NAME', 255)->notNull();
	$columns->decimal('PRICE', 26, 8);
	$columns->char('CURRENCY', 3);
	$columns->double('QUANTITY', 18, 4);
	$columns->double('WEIGHT', 18, 4);
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->varchar('MODULE', 100);
	$columns->varchar('PRODUCT_XML_ID', 100);
	$columns->int('TYPE');
	$columns->int('SET_PARENT_ID');
	$columns->int('MEASURE_CODE');
	$columns->varchar('MEASURE_NAME', 50);
	$columns->mediumText('BASKET_DATA');
	$table->addIndex('IXS_PRODUCT_ID', ['PRODUCT_ID']);
	$table->addIndex('IXS_ARCHIVE_ID', ['ARCHIVE_ID']);
});

$migration->table('b_sale_basket_archive_packed')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('BASKET_ARCHIVE_ID')->notNull();
	$columns->mediumText('BASKET_DATA');
	$table->addPrimaryKey('BASKET_ARCHIVE_ID');
});

$migration->table('b_sale_company_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('COMPANY_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SALE_COMP_GRP_CMP_ID', ['COMPANY_ID']);
});

$migration->table('b_sale_company_resp_grp')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('COMPANY_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_SALE_COMP_RESP_GRP_CMP_ID', ['COMPANY_ID']);
});

$migration->table('b_sale_cashbox')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('HANDLER', 255)->notNull();
	$columns->varchar('EMAIL', 255)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_LAST_CHECK');
	$columns->int('SORT')->default('100');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('USE_OFFLINE', 1)->notNull()->default('N');
	$columns->char('ENABLED', 1)->notNull()->default('N');
	$columns->varchar('KKM_ID', 255);
	$columns->varchar('OFD', 255);
	$columns->text('OFD_SETTINGS');
	$columns->varchar('NUMBER_KKM', 64);
	$columns->text('SETTINGS');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sale_cashbox_err_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CASHBOX_ID');
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->text('MESSAGE');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sale_cashbox_check')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CASHBOX_ID');
	$columns->varchar('EXTERNAL_UUID', 100);
	$columns->int('PAYMENT_ID');
	$columns->int('SHIPMENT_ID');
	$columns->int('CNT_FAIL_PRINT')->default('0');
	$columns->int('ORDER_ID');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_PRINT_START');
	$columns->datetime('DATE_PRINT_END');
	$columns->decimal('SUM', 26, 8);
	$columns->char('CURRENCY', 3);
	$columns->char('STATUS', 1)->notNull()->default('N');
	$columns->varchar('TYPE', 255)->notNull();
	$columns->varchar('ENTITY_REGISTRY_TYPE', 255)->notNull();
	$columns->text('LINK_PARAMS');
	$columns->text('ERROR_MESSAGE');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SALE_CHECK_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IX_SALE_CHECK_PAYMENT_ID', ['PAYMENT_ID']);
	$table->addIndex('IX_SALE_CHECK_SHIPMENT_ID', ['SHIPMENT_ID']);
	$table->addIndex('IX_SALE_CHECK_STATUS', ['STATUS']);
	$table->addIndex('IX_SALE_CHECK_EXTERNAL_UUID', ['EXTERNAL_UUID']);
});

$migration->table('b_sale_cashbox_check_correction')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('CHECK_ID')->notNull();
	$columns->varchar('CORRECTION_TYPE', 50)->notNull();
	$columns->varchar('DOCUMENT_NUMBER', 35)->notNull();
	$columns->date('DOCUMENT_DATE')->notNull();
	$columns->varchar('DESCRIPTION', 255)->default('');
	$columns->text('CORRECTION_PAYMENT')->default('');
	$columns->text('CORRECTION_VAT')->default('');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sale_check2cashbox')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHECK_ID')->notNull();
	$columns->int('CASHBOX_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_SALE_CHECK2CB_UNI', ['CHECK_ID', 'CASHBOX_ID']);
});

$migration->table('b_sale_cashbox_z_report')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CASHBOX_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_PRINT_START');
	$columns->datetime('DATE_PRINT_END');
	$columns->decimal('CASH_SUM', 18, 4);
	$columns->decimal('CASHLESS_SUM', 18, 4);
	$columns->decimal('CUMULATIVE_SUM', 18, 4);
	$columns->decimal('RETURNED_SUM', 18, 4);
	$columns->char('STATUS', 1)->notNull()->default('N');
	$columns->int('CNT_FAIL_PRINT')->default('0');
	$columns->text('LINK_PARAMS');
	$columns->char('CURRENCY', 3);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SALE_Z_REPORT_CASHBOX_ID', ['CASHBOX_ID']);
});

$migration->table('b_sale_cashbox_connect')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('HASH', 100)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('HASH');
});

$migration->table('b_sale_buyer_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->datetime('LAST_ORDER_DATE')->notNull();
	$columns->int('COUNT_FULL_PAID_ORDER');
	$columns->int('COUNT_PART_PAID_ORDER');
	$columns->decimal('SUM_PAID', 18, 4);
	$table->addPrimaryKey('ID');
	$table->addIndex('IXS_CURRENCY_LID_SELECTOR', ['CURRENCY', 'LID', 'USER_ID']);
	$table->addIndex('IXS_ORDER_USER_ID', ['USER_ID']);
	$table->addIndex('IXS_LAST_ORDER_DATE', ['LAST_ORDER_DATE']);
	$table->addIndex('IXS_COUNT_FULL_PAID_ORDER', ['COUNT_FULL_PAID_ORDER']);
	$table->addIndex('IXS_COUNT_PART_PAID_ORDER', ['COUNT_PART_PAID_ORDER']);
	$table->addIndex('IXS_SUM_PAID', ['SUM_PAID']);
});

$migration->table('b_sale_delivery_req')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->timestamp('DATE')->defaultCurrentTimestamp();
	$columns->int('DELIVERY_ID')->notNull();
	$columns->int('STATUS');
	$columns->int('CREATED_BY');
	$columns->varchar('EXTERNAL_ID', 100)->notNull();
	$columns->varchar('EXTERNAL_STATUS', 255);
	$columns->varchar('EXTERNAL_STATUS_SEMANTIC', 50);
	$columns->longText('EXTERNAL_PROPERTIES');
	$table->addIndex('IX_SALE_DELIVERY_REQUEST_DELIVERY_ID_EXTERNAL_ID', ['DELIVERY_ID', 'EXTERNAL_ID']);
});

$migration->table('b_sale_delivery_req_shp')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SHIPMENT_ID')->notNull();
	$columns->int('REQUEST_ID');
	$columns->varchar('EXTERNAL_ID', 50);
	$columns->varchar('ERROR_DESCRIPTION', 2048);
	$table->addIndex('IX_SALE_DELIVERY_REQ_SHP_ID_REQUEST_ID_EXTERNAL_ID', ['REQUEST_ID', 'EXTERNAL_ID']);
});

$migration->table('b_sale_check_related_entities')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CHECK_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_TYPE', 1)->notNull();
	$columns->varchar('ENTITY_CHECK_TYPE', 50);
});

$migration->table('b_sale_exchange_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('PARENT_ID');
	$columns->int('OWNER_ENTITY_ID');
	$columns->datetime('ENTITY_DATE_UPDATE');
	$columns->varchar('XML_ID', 50);
	$columns->varchar('MARKED', 1);
	$columns->text('DESCRIPTION');
	$columns->longText('MESSAGE');
	$columns->datetime('DATE_INSERT');
	$columns->varchar('DIRECTION', 1)->notNull();
	$columns->varchar('PROVIDER', 50)->notNull();
	$table->addIndex('IX_EXCHANGE_LOG1', ['ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_EXCHANGE_LOG2', ['ENTITY_DATE_UPDATE']);
	$table->addIndex('IX_EXCHANGE_LOG3', ['DATE_INSERT']);
});

$migration->table('b_sale_synchronizer_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->text('MESSAGE_ID');
	$columns->longText('MESSAGE');
	$columns->datetime('DATE_INSERT');
	$table->addIndex('IX_SYNCHRONIZER_LOG1', ['DATE_INSERT']);
});

$migration->table('b_sale_order_converter_crm_error')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->text('ERROR');
});

$migration->table('b_sale_usergroup_restr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$table->addIndex('IX_BSUG_ETI_EI_GI', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'GROUP_ID']);
});

$migration->table('b_sale_documentgenerator_callback_registry')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->varchar('CALLBACK_CLASS', 100)->notNull();
	$columns->varchar('CALLBACK_METHOD', 100)->notNull();
});

$migration->table('b_sale_order_entities_custom_fields')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 25)->notNull();
	$columns->varchar('ENTITY_REGISTRY_TYPE', 15)->notNull();
	$columns->varchar('FIELD', 25)->notNull();
	$table->addIndex('IX_SALE_ENTITY_CUSTOM_FIELDS', ['ENTITY_ID', 'ENTITY_TYPE', 'ENTITY_REGISTRY_TYPE']);
});

$migration->table('b_sale_domain_verification')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('DOMAIN', 255)->notNull();
	$columns->varchar('PATH', 255)->notNull();
	$columns->text('CONTENT');
	$columns->varchar('ENTITY', 1024)->notNull();
});

$migration->table('b_sale_b24integration_bind')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('SRC_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('SRC_ENTITY_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME');
	$columns->datetime('LAST_UPDATED_TIME');
	$table->addPrimaryKeys(['SRC_ENTITY_TYPE_ID', 'SRC_ENTITY_ID', 'DST_ENTITY_TYPE_ID', 'DST_ENTITY_ID']);
	$table->addIndex('IX_BSIB_ID', ['ID']);
});

$migration->table('b_sale_b24integration_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('SRC_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('SRC_ENTITY_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME');
	$columns->datetime('LAST_UPDATED_TIME');
	$table->addPrimaryKeys(['SRC_ENTITY_ID', 'DST_ENTITY_TYPE_ID', 'SRC_ENTITY_TYPE_ID']);
});

$migration->table('b_sale_b24integration_token')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('GUID', 100)->notNull();
	$columns->varchar('ACCESS_TOKEN', 100)->notNull();
	$columns->varchar('REFRESH_TOKEN', 100)->notNull();
	$columns->varchar('REST_ENDPOINT', 255)->notNull();
	$columns->varchar('PORTAL_ID', 100)->notNull();
	$columns->datetime('CREATED')->notNull();
	$columns->datetime('CHANGED')->notNull();
	$columns->datetime('EXPIRES')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_sale_delivery_rest_handler')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->int('SORT')->notNull()->default('100');
	$columns->text('DESCRIPTION');
	$columns->text('SETTINGS')->notNull();
	$columns->text('PROFILES')->notNull();
	$columns->varchar('APP_ID', 128);
	$table->addUniqueIndex('IX_SALE_DELIVERY_HANDLER_CODE', ['CODE']);
});

$migration->table('b_sale_b24integration_stat_provider')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull()->default('');
	$columns->varchar('EXTERNAL_SERVER_HOST', 255)->notNull()->default('');
	$columns->varchar('XML_ID', 255)->notNull()->default('');
	$columns->timestamp('TIMESTAMP_X')->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BICS_XML_ID', ['XML_ID']);
});

$migration->table('b_sale_b24integration_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->int('PROVIDER_ID')->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->char('STATUS', 1)->notNull();
	$columns->varchar('XML_ID', 255)->notNull()->default('');
	$columns->decimal('AMOUNT', 26, 8)->notNull();
	$columns->datetime('TIMESTAMP_X');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BSIS_ID_TYPE_ID', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'PROVIDER_ID']);
});

$migration->table('b_sale_cashbox_rest_handler')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->int('SORT')->notNull()->default('100');
	$columns->text('SETTINGS')->notNull();
	$columns->varchar('APP_ID', 128);
	$table->addUniqueIndex('IX_CASHBOX_HANDLER_CODE', ['CODE']);
});

$migration->table('b_sale_delivery_yandex_taxi_claims')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$columns->char('FURTHER_CHANGES_EXPECTED', 1)->notNull()->default('Y');
	$columns->int('SHIPMENT_ID')->notNull();
	$columns->text('INITIAL_CLAIM')->notNull();
	$columns->varchar('EXTERNAL_ID', 255)->notNull();
	$columns->varchar('EXTERNAL_STATUS', 255)->notNull();
	$columns->varchar('EXTERNAL_RESOLUTION', 20);
	$columns->varchar('EXTERNAL_CREATED_TS', 255)->notNull();
	$columns->varchar('EXTERNAL_UPDATED_TS', 255)->notNull();
	$columns->char('EXTERNAL_CURRENCY', 3);
	$columns->decimal('EXTERNAL_FINAL_PRICE', 26, 8);
	$columns->char('IS_SANDBOX_ORDER', 1)->notNull()->default('N');
	$table->addUniqueIndex('IX_UNIQUE_EXTERNAL_ID', ['EXTERNAL_ID']);
	$table->addIndex('IX_FURTHER_CHANGES_EXPECTED', ['FURTHER_CHANGES_EXPECTED']);
	$table->addIndex('IX_REPORT_DATE', ['CREATED_AT', 'IS_SANDBOX_ORDER']);
});

$migration->table('b_sale_basket_reservation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->double('QUANTITY', 18, 4)->notNull();
	$columns->datetime('DATE_RESERVE')->notNull();
	$columns->datetime('DATE_RESERVE_END')->notNull();
	$columns->int('RESERVED_BY')->unsigned();
	$columns->int('BASKET_ID')->unsigned()->notNull();
	$columns->int('STORE_ID')->unsigned();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SALE_BASKET_RESERVATION_BASKET_ID', ['BASKET_ID']);
});

$migration->table('b_sale_facebook_conversion_params')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('EVENT_NAME', 50)->notNull();
	$columns->char('LID', 2)->notNull();
	$columns->char('ENABLED', 1)->notNull();
	$columns->varchar('PARAMS', 500)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_FACEBOOK_CONVERSION_EVENT_NAME_LID', ['EVENT_NAME', 'LID']);
});

$migration->table('b_sale_analytics')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$columns->text('PAYLOAD');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SALE_ANALYTICS_CREATED_AT', ['CREATED_AT']);
	$table->addIndex('IX_SALE_ANALYTICS_CODE_CREATED_AT', ['CODE', 'CREATED_AT']);
});

$migration->table('b_sale_order_payment_ps_available')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PAYMENT_ID')->notNull();
	$columns->int('PAY_SYSTEM_ID')->notNull();
	$table->addIndex('B_SALE_ORDER_PAYMENT_PS_AVAIABLE_PAYMENT_ID', ['PAYMENT_ID']);
});

$migration->table('b_sale_basket_reservation_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('RESERVATION_ID')->notNull();
	$columns->datetime('DATE_RESERVE')->notNull();
	$columns->float('QUANTITY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('B_SALE_BASKET_RESERVATION_HISTORY_RESERVATION_ID', ['RESERVATION_ID']);
});

$migration->table('b_sale_entity_label')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->varchar('LABEL_NAME', 255)->notNull();
	$columns->text('LABEL_VALUE');
	$table->addIndex('IX_SALE_LABEL_ENTITY_ID_ENTITY_TYPE', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addUniqueIndex('IX_SALE_LABEL_ENTITY_ID_ENTITY_TYPE_LABEL_NAME', ['ENTITY_ID', 'ENTITY_TYPE', 'LABEL_NAME']);
});

