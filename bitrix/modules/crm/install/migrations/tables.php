<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_crm_lead')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->int('ASSIGNED_BY_ID')->unsigned();
	$columns->char('OPENED', 1)->default('N');
	$columns->int('COMPANY_ID')->unsigned();
	$columns->int('CONTACT_ID')->unsigned();
	$columns->varchar('STATUS_ID', 50);
	$columns->text('STATUS_DESCRIPTION');
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$columns->varchar('PRODUCT_ID', 50);
	$columns->decimal('OPPORTUNITY', 18, 2);
	$columns->varchar('CURRENCY_ID', 50);
	$columns->decimal('OPPORTUNITY_ACCOUNT', 18, 2);
	$columns->varchar('ACCOUNT_CURRENCY_ID', 50);
	$columns->varchar('SOURCE_ID', 50);
	$columns->text('SOURCE_DESCRIPTION');
	$columns->varchar('TITLE', 255);
	$columns->varchar('FULL_NAME', 100);
	$columns->varchar('NAME', 50);
	$columns->varchar('LAST_NAME', 50);
	$columns->varchar('SECOND_NAME', 50);
	$columns->varchar('COMPANY_TITLE', 255);
	$columns->varchar('POST', 255);
	$columns->text('ADDRESS');
	$columns->text('COMMENTS');
	$columns->decimal('EXCH_RATE', 20, 4)->default('1');
	$columns->int('WEBFORM_ID')->unsigned();
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$columns->datetime('DATE_CLOSED');
	$columns->date('BIRTHDATE');
	$columns->int('BIRTHDAY_SORT')->notNull()->default('1024');
	$columns->varchar('HONORIFIC', 128);
	$columns->char('HAS_PHONE', 1);
	$columns->char('HAS_EMAIL', 1);
	$columns->char('HAS_IMOL', 1)->default('N');
	$columns->char('IS_RETURN_CUSTOMER', 1)->notNull()->default('N');
	$columns->int('FACE_ID');
	$columns->mediumText('SEARCH_CONTENT');
	$columns->char('IS_MANUAL_OPPORTUNITY', 1)->default('N');
	$columns->int('MOVED_BY_ID')->unsigned();
	$columns->datetime('MOVED_TIME');
	$columns->int('LAST_ACTIVITY_BY')->unsigned()->notNull()->default('0');
	$columns->datetime('LAST_ACTIVITY_TIME')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_LEAD_FULL_NAME', ['FULL_NAME']);
	$table->addIndex('IX_LEAD_1', ['STATUS_ID', 'ASSIGNED_BY_ID']);
	$table->addIndex('IX_LEAD_2', ['DATE_MODIFY']);
	$table->addIndex('IX_LEAD_3', ['CONTACT_ID']);
	$table->addIndex('IX_LEAD_4', ['COMPANY_ID']);
	$table->addIndex('IX_LEAD_12', ['WEBFORM_ID']);
	$table->addIndex('IX_LEAD_13', ['FACE_ID']);
	$table->addIndex('IX_LEAD_14', ['HAS_IMOL']);
	$table->addIndex('IX_LEAD_15', ['STATUS_SEMANTIC_ID', 'STATUS_ID', 'OPPORTUNITY_ACCOUNT']);
	$table->addIndex('IX_LEAD_16', ['STATUS_ID', 'OPPORTUNITY_ACCOUNT']);
	$table->addIndex('IX_LEAD_17', ['BIRTHDAY_SORT', 'ASSIGNED_BY_ID']);
	$table->addIndex('IX_LEAD_18', ['BIRTHDATE']);
	$table->addIndex('IX_LEAD_20', ['HAS_EMAIL']);
	$table->addIndex('IX_LEAD_21', ['HAS_PHONE', 'HAS_EMAIL']);
	$table->addIndex('IX_LEAD_22', ['STATUS_SEMANTIC_ID']);
	$table->addIndex('IX_LEAD_23', ['ASSIGNED_BY_ID', 'STATUS_SEMANTIC_ID']);
	$table->addIndex('IX_LEAD_24', ['DATE_CREATE', 'STATUS_SEMANTIC_ID']);
	$table->addIndex('IX_LEAD_25', ['DATE_CLOSED']);
	$table->addIndex('IX_LEAD_26', ['LAST_ACTIVITY_TIME']);
	$table->addIndex('IX_LEAD_27', ['STATUS_ID', 'LAST_ACTIVITY_TIME']);
	$table->addFulltextIndex('IX_B_CRM_LEAD_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_deal')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->int('ASSIGNED_BY_ID')->unsigned();
	$columns->char('OPENED', 1)->default('N');
	$columns->int('LEAD_ID');
	$columns->int('COMPANY_ID')->unsigned();
	$columns->int('CONTACT_ID')->unsigned();
	$columns->int('MYCOMPANY_ID')->unsigned();
	$columns->int('QUOTE_ID')->unsigned();
	$columns->varchar('TITLE', 255);
	$columns->varchar('PRODUCT_ID', 50);
	$columns->int('CATEGORY_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('STAGE_ID', 50);
	$columns->varchar('PREVIOUS_STAGE_ID', 50);
	$columns->varchar('STAGE_SEMANTIC_ID', 3)->notNull()->default('P');
	$columns->char('IS_NEW', 1);
	$columns->char('IS_RECURRING', 1)->default('N');
	$columns->char('IS_RETURN_CUSTOMER', 1)->default('N');
	$columns->char('IS_REPEATED_APPROACH', 1)->default('N');
	$columns->char('CLOSED', 1)->default('N');
	$columns->varchar('TYPE_ID', 50);
	$columns->decimal('OPPORTUNITY', 26, 8);
	$columns->char('IS_MANUAL_OPPORTUNITY', 1)->default('N');
	$columns->decimal('TAX_VALUE', 26, 8);
	$columns->varchar('CURRENCY_ID', 50);
	$columns->decimal('OPPORTUNITY_ACCOUNT', 26, 8);
	$columns->decimal('TAX_VALUE_ACCOUNT', 26, 8);
	$columns->varchar('ACCOUNT_CURRENCY_ID', 50);
	$columns->tinyInt('PROBABILITY');
	$columns->text('COMMENTS');
	$columns->datetime('BEGINDATE');
	$columns->datetime('CLOSEDATE');
	$columns->datetime('EVENT_DATE');
	$columns->varchar('EVENT_ID', 50);
	$columns->text('EVENT_DESCRIPTION');
	$columns->decimal('EXCH_RATE', 26, 8)->default('1');
	$columns->varchar('LOCATION_ID', 100);
	$columns->int('WEBFORM_ID')->unsigned();
	$columns->varchar('SOURCE_ID', 50);
	$columns->text('SOURCE_DESCRIPTION');
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$columns->text('ADDITIONAL_INFO');
	$columns->mediumText('SEARCH_CONTENT');
	$columns->varchar('ORDER_STAGE', 255);
	$columns->int('MOVED_BY_ID')->unsigned();
	$columns->datetime('MOVED_TIME');
	$columns->int('LAST_ACTIVITY_BY')->unsigned()->notNull()->default('0');
	$columns->datetime('LAST_ACTIVITY_TIME')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DEAL_1', ['STAGE_ID', 'ASSIGNED_BY_ID']);
	$table->addIndex('IX_DEAL_8', ['WEBFORM_ID']);
	$table->addIndex('IX_DEAL_10', ['ORIGIN_ID(155)', 'ORIGINATOR_ID(155)']);
	$table->addIndex('IX_DEAL_15', ['LEAD_ID']);
	$table->addIndex('IX_DEAL_18', ['IS_NEW']);
	$table->addIndex('IX_DEAL_20', ['DATE_CREATE', 'STAGE_SEMANTIC_ID']);
	$table->addIndex('IX_DEAL_21', ['IS_RETURN_CUSTOMER', 'CATEGORY_ID']);
	$table->addIndex('IX_DEAL_22', ['COMPANY_ID', 'IS_RETURN_CUSTOMER']);
	$table->addIndex('IX_DEAL_23', ['CONTACT_ID', 'IS_RETURN_CUSTOMER']);
	$table->addIndex('IX_DEAL_24', ['IS_REPEATED_APPROACH', 'CATEGORY_ID']);
	$table->addIndex('IX_DEAL_26', ['STAGE_SEMANTIC_ID', 'CATEGORY_ID', 'STAGE_ID']);
	$table->addIndex('IX_DEAL_27', ['MOVED_TIME', 'STAGE_SEMANTIC_ID']);
	$table->addIndex('IX_DEAL_28', ['CLOSEDATE']);
	$table->addIndex('IX_DEAL_29', ['LAST_ACTIVITY_TIME']);
	$table->addIndex('IX_DEAL_30', ['STAGE_SEMANTIC_ID', 'COMPANY_ID']);
	$table->addIndex('IX_DEAL_31', ['CATEGORY_ID', 'STAGE_ID', 'IS_RECURRING']);
	$table->addIndex('IX_DEAL_32', ['CATEGORY_ID', 'STAGE_SEMANTIC_ID', 'IS_RECURRING', 'STAGE_ID', 'OPPORTUNITY_ACCOUNT']);
	$table->addIndex('IX_DEAL_33', ['STAGE_ID', 'CATEGORY_ID', 'STAGE_SEMANTIC_ID']);
	$table->addIndex('IX_DEAL_34', ['STAGE_ID', 'LAST_ACTIVITY_TIME']);
	$table->addIndex('IX_DEAL_35', ['ASSIGNED_BY_ID', 'STAGE_SEMANTIC_ID', 'CATEGORY_ID', 'IS_RECURRING']);
	$table->addIndex('IX_DEAL_36', ['BEGINDATE', 'STAGE_SEMANTIC_ID']);
	$table->addIndex('IX_DEAL_QUOTE_ID', ['QUOTE_ID']);
	$table->addFulltextIndex('IX_B_CRM_DEAL_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->int('ASSIGNED_BY_ID')->unsigned();
	$columns->char('OPENED', 1)->default('N');
	$columns->int('COMPANY_ID')->unsigned();
	$columns->varchar('SOURCE_ID', 50);
	$columns->text('SOURCE_DESCRIPTION');
	$columns->varchar('FULL_NAME', 100);
	$columns->varchar('NAME', 50);
	$columns->varchar('LAST_NAME', 50);
	$columns->varchar('SECOND_NAME', 50);
	$columns->varchar('PHOTO', 10);
	$columns->varchar('POST', 255);
	$columns->text('ADDRESS');
	$columns->text('COMMENTS');
	$columns->int('LEAD_ID');
	$columns->char('EXPORT', 1)->default('N');
	$columns->varchar('TYPE_ID', 50);
	$columns->int('WEBFORM_ID')->unsigned();
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$columns->varchar('ORIGIN_VERSION', 255);
	$columns->date('BIRTHDATE');
	$columns->int('BIRTHDAY_SORT')->notNull()->default('1024');
	$columns->varchar('HONORIFIC', 128);
	$columns->char('HAS_PHONE', 1);
	$columns->char('HAS_EMAIL', 1);
	$columns->char('HAS_IMOL', 1)->default('N');
	$columns->int('FACE_ID');
	$columns->mediumText('SEARCH_CONTENT');
	$columns->int('CATEGORY_ID')->unsigned()->notNull()->default('0');
	$columns->int('LAST_ACTIVITY_BY')->unsigned()->notNull()->default('0');
	$columns->datetime('LAST_ACTIVITY_TIME')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CONTACT_LAST_NAME', ['NAME']);
	$table->addIndex('IX_CONTACT_NAME', ['LAST_NAME']);
	$table->addIndex('IX_CONTACT_FULL_NAME', ['FULL_NAME']);
	$table->addIndex('IX_CONTACT_BDAY_2', ['BIRTHDAY_SORT', 'ASSIGNED_BY_ID']);
	$table->addIndex('IX_CONTACT_BDATE_2', ['BIRTHDATE']);
	$table->addIndex('IX_CONTACT_COMPANY_2', ['COMPANY_ID']);
	$table->addIndex('IX_CONTACT_EMAIL_2', ['HAS_EMAIL']);
	$table->addIndex('IX_CONTACT_COMM_2', ['HAS_PHONE', 'HAS_EMAIL']);
	$table->addIndex('IX_CONTACT_WFORM', ['WEBFORM_ID']);
	$table->addIndex('IX_CONTACT_FACE', ['FACE_ID']);
	$table->addIndex('IX_CONTACT_IMOL', ['HAS_IMOL']);
	$table->addIndex('IX_CONTACT_LEAD', ['LEAD_ID']);
	$table->addIndex('IX_CONTACT_LAST_NAME_AND_NAME', ['LAST_NAME', 'NAME']);
	$table->addIndex('IX_CONTACT_CATEGORY', ['CATEGORY_ID']);
	$table->addIndex('IX_CONTACT_LAST_ACTIVITY_TIME', ['LAST_ACTIVITY_TIME']);
	$table->addIndex('IX_CONTACT_DATE_MODIFY', ['DATE_MODIFY']);
	$table->addFulltextIndex('IX_B_CRM_CONTACT_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_company')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->int('ASSIGNED_BY_ID')->unsigned();
	$columns->char('OPENED', 1)->default('N');
	$columns->varchar('TITLE', 255);
	$columns->varchar('LOGO', 10);
	$columns->text('ADDRESS');
	$columns->text('ADDRESS_LEGAL');
	$columns->text('BANKING_DETAILS');
	$columns->text('COMMENTS');
	$columns->varchar('COMPANY_TYPE', 50);
	$columns->varchar('INDUSTRY', 50);
	$columns->varchar('REVENUE', 255);
	$columns->varchar('CURRENCY_ID', 50);
	$columns->varchar('EMPLOYEES', 50);
	$columns->int('LEAD_ID');
	$columns->int('WEBFORM_ID')->unsigned();
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$columns->varchar('ORIGIN_VERSION', 255);
	$columns->char('HAS_PHONE', 1);
	$columns->char('HAS_EMAIL', 1);
	$columns->char('HAS_IMOL', 1)->default('N');
	$columns->char('IS_MY_COMPANY', 1)->notNull()->default('N');
	$columns->mediumText('SEARCH_CONTENT');
	$columns->int('CATEGORY_ID')->unsigned()->notNull()->default('0');
	$columns->int('LAST_ACTIVITY_BY')->unsigned()->notNull()->default('0');
	$columns->datetime('LAST_ACTIVITY_TIME')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_COMPANY_TITLE', ['TITLE']);
	$table->addIndex('IX_COMPANY_EMAIL_2', ['HAS_EMAIL']);
	$table->addIndex('IX_COMPANY_COMM_2', ['HAS_PHONE', 'HAS_EMAIL']);
	$table->addIndex('IX_COMPANY_WFORM', ['WEBFORM_ID']);
	$table->addIndex('IX_COMPANY_IMOL', ['HAS_IMOL']);
	$table->addIndex('IX_COMPANY_LEAD', ['LEAD_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_1', ['IS_MY_COMPANY', 'CATEGORY_ID']);
	$table->addIndex('IX_COMPANY_LAST_ACTIVITY_TIME', ['LAST_ACTIVITY_TIME']);
	$table->addFulltextIndex('IX_B_CRM_COMPANY_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_status')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('ENTITY_ID', 50)->notNull();
	$columns->varchar('STATUS_ID', 50)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('NAME_INIT', 100);
	$columns->int('SORT')->notNull();
	$columns->char('SYSTEM', 1)->notNull();
	$columns->char('COLOR', 10);
	$columns->char('SEMANTICS', 1);
	$columns->int('CATEGORY_ID')->unsigned();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_STATUS', ['STATUS_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_STATUS_2', ['ENTITY_ID']);
});

$migration->table('b_crm_field_multi')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('ENTITY_ID', 16)->notNull();
	$columns->int('ELEMENT_ID')->notNull();
	$columns->varchar('TYPE_ID', 16)->notNull();
	$columns->varchar('VALUE_TYPE', 50)->notNull();
	$columns->varchar('COMPLEX_ID', 100)->notNull();
	$columns->varchar('VALUE', 250)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_FM_3', ['TYPE_ID', 'VALUE', 'ENTITY_ID', 'ELEMENT_ID']);
	$table->addIndex('IX_B_CRM_FM_4', ['ENTITY_ID', 'TYPE_ID', 'ELEMENT_ID']);
	$table->addIndex('IX_B_CRM_FM_5', ['ELEMENT_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_FM_6', ['VALUE(20)']);
});

$migration->table('b_crm_field_multi_phone_country')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('FM_ID')->unsigned()->notNull();
	$columns->varchar('COUNTRY_CODE', 2)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_FIELD_MULTI_PHONE_COUNTRY_1', ['FM_ID', 'COUNTRY_CODE']);
	$table->addIndex('IX_B_CRM_FIELD_MULTI_PHONE_COUNTRY_2', ['COUNTRY_CODE']);
});

$migration->table('b_crm_event')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->varchar('EVENT_ID', 50);
	$columns->varchar('EVENT_NAME', 255)->notNull();
	$columns->text('EVENT_TEXT_1');
	$columns->text('EVENT_TEXT_2');
	$columns->int('EVENT_TYPE');
	$columns->text('FILES');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_EVENT_1', ['DATE_CREATE']);
	$table->addIndex('IX_B_CRM_EVENT_4', ['EVENT_TYPE', 'DATE_CREATE']);
	$table->addIndex('IX_B_CRM_EVENT_5', ['FILES(8)']);
	$table->addIndex('IX_B_CRM_EVENT_6', ['EVENT_TYPE', 'EVENT_ID']);
	$table->addIndex('IX_B_CRM_EVENT_7', ['CREATED_BY_ID']);
});

$migration->table('b_crm_event_relations')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ASSIGNED_BY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50);
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_FIELD', 255);
	$columns->int('EVENT_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_EVENT_REL_ENTITY', ['ENTITY_TYPE', 'ENTITY_ID', 'ENTITY_FIELD']);
	$table->addIndex('IX_EVENT_REL_1', ['EVENT_ID']);
	$table->addIndex('IX_EVENT_REL_2', ['ENTITY_TYPE', 'ENTITY_ID', 'EVENT_ID']);
});

$migration->table('b_crm_entity_lock')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 10)->notNull();
	$columns->datetime('DATE_LOCK');
	$columns->varchar('LOCKED_BY', 32);
	$table->addPrimaryKey('ENTITY_ID');
});

$migration->table('b_crm_entity_perms')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('ENTITY', 20)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ATTR', 30)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_ENTITY_ATTR', ['ENTITY', 'ENTITY_ID', 'ATTR']);
	$table->addIndex('IX_ENTITY_ATTR_1', ['ENTITY', 'ATTR', 'ENTITY_ID']);
});

$migration->table('b_crm_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->varchar('CODE', 64);
	$columns->varchar('GROUP_CODE', 64);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_crm_role_group_code', ['GROUP_CODE']);
});

$migration->table('b_crm_role_perms')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY', 20)->notNull();
	$columns->varchar('FIELD', 30)->default('-');
	$columns->varchar('FIELD_VALUE', 255);
	$columns->varchar('PERM_TYPE', 20)->notNull();
	$columns->char('ATTR', 1)->default('');
	$columns->text('SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_ROLE_PERMS_1', ['ROLE_ID', 'PERM_TYPE', 'ENTITY']);
	$table->addIndex('IX_ROLE_PERMS_2', ['ENTITY', 'PERM_TYPE', 'ATTR']);
});

$migration->table('b_crm_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('RELATION', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_ROLE_RELATION', ['ROLE_ID', 'RELATION']);
});

$migration->table('b_crm_external_sale')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->varchar('NAME', 128);
	$columns->varchar('SCHEME', 5)->notNull()->default('http');
	$columns->varchar('SERVER', 192)->notNull();
	$columns->int('PORT')->notNull()->default('80');
	$columns->varchar('LOGIN', 64)->notNull();
	$columns->varchar('PASSWORD', 128)->notNull();
	$columns->int('MODIFICATION_LABEL');
	$columns->int('IMPORT_SIZE');
	$columns->int('IMPORT_PERIOD');
	$columns->int('IMPORT_PROBABILITY');
	$columns->int('IMPORT_RESPONSIBLE');
	$columns->char('IMPORT_PUBLIC', 1);
	$columns->varchar('IMPORT_PREFIX', 128);
	$columns->int('IMPORT_ERRORS');
	$columns->int('IMPORT_GROUP_ID');
	$columns->text('COOKIE');
	$columns->text('LAST_STATUS');
	$columns->datetime('LAST_STATUS_DATE');
	$columns->text('SYNC_DATA');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_catalog')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull();
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull();
	$columns->int('CATALOG_ID')->notNull();
	$columns->varchar('CURRENCY_ID', 50)->notNull();
	$columns->decimal('PRICE', 26, 8)->notNull()->default('0');
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_product_row')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('OWNER_ID')->notNull();
	$columns->varchar('OWNER_TYPE', 20)->notNull();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->varchar('PRODUCT_NAME', 256);
	$columns->decimal('PRICE', 26, 8)->notNull();
	$columns->decimal('PRICE_ACCOUNT', 26, 8)->notNull()->default('0');
	$columns->decimal('PRICE_EXCLUSIVE', 26, 8);
	$columns->decimal('PRICE_NETTO', 26, 8);
	$columns->decimal('PRICE_BRUTTO', 26, 8);
	$columns->decimal('QUANTITY', 18, 4)->notNull();
	$columns->tinyInt('DISCOUNT_TYPE_ID')->unsigned();
	$columns->decimal('DISCOUNT_RATE', 18, 4);
	$columns->decimal('DISCOUNT_SUM', 26, 8);
	$columns->decimal('TAX_RATE', 18, 4);
	$columns->char('TAX_INCLUDED', 1);
	$columns->char('CUSTOMIZED', 1);
	$columns->int('MEASURE_CODE')->unsigned();
	$columns->varchar('MEASURE_NAME', 50);
	$columns->int('SORT');
	$columns->varchar('XML_ID', 255);
	$columns->int('TYPE')->notNull()->default('1');
	$columns->varchar('TAX_NAME', 50)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_PROD_ROW_2', ['OWNER_ID', 'OWNER_TYPE', 'SORT']);
	$table->addIndex('IX_B_CRM_PROD_PRODUCT', ['PRODUCT_ID']);
});

$migration->table('b_crm_product_row_cfg')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->notNull();
	$columns->varchar('OWNER_TYPE', 20)->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKeys(['OWNER_ID', 'OWNER_TYPE']);
});

$migration->table('b_crm_act')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->tinyInt('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('PROVIDER_ID', 100);
	$columns->varchar('PROVIDER_TYPE_ID', 100);
	$columns->varchar('PROVIDER_GROUP_ID', 100);
	$columns->int('OWNER_ID')->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('ASSOCIATED_ENTITY_ID');
	$columns->int('CALENDAR_EVENT_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('SUBJECT', 512)->notNull();
	$columns->char('IS_HANDLEABLE', 1);
	$columns->char('COMPLETED', 1)->notNull()->default('N');
	$columns->int('STATUS')->unsigned()->notNull()->default('0');
	$columns->int('RESPONSIBLE_ID')->notNull();
	$columns->int('PRIORITY')->notNull();
	$columns->int('NOTIFY_TYPE')->notNull();
	$columns->int('NOTIFY_VALUE')->unsigned();
	$columns->longText('DESCRIPTION');
	$columns->tinyInt('DESCRIPTION_TYPE')->unsigned();
	$columns->tinyInt('DIRECTION')->unsigned()->notNull();
	$columns->varchar('LOCATION', 256);
	$columns->datetime('CREATED')->notNull();
	$columns->datetime('LAST_UPDATED')->notNull();
	$columns->datetime('START_TIME');
	$columns->datetime('END_TIME');
	$columns->datetime('DEADLINE');
	$columns->tinyInt('STORAGE_TYPE_ID')->unsigned();
	$columns->text('STORAGE_ELEMENT_IDS');
	$columns->int('PARENT_ID')->unsigned()->notNull()->default('0');
	$columns->int('THREAD_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('URN', 64);
	$columns->text('SETTINGS');
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$columns->int('AUTHOR_ID')->unsigned();
	$columns->int('EDITOR_ID')->unsigned();
	$columns->longText('PROVIDER_PARAMS');
	$columns->longText('PROVIDER_DATA');
	$columns->mediumText('SEARCH_CONTENT');
	$columns->int('RESULT_STATUS')->notNull()->default('0');
	$columns->int('RESULT_STREAM')->notNull()->default('0');
	$columns->varchar('RESULT_SOURCE_ID', 255);
	$columns->int('RESULT_MARK')->notNull()->default('0');
	$columns->decimal('RESULT_VALUE', 18, 4);
	$columns->decimal('RESULT_SUM', 18, 4);
	$columns->char('RESULT_CURRENCY_ID', 3);
	$columns->int('AUTOCOMPLETE_RULE')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ACT', ['ID', 'PARENT_ID', 'OWNER_ID', 'OWNER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_ACT_1', ['RESPONSIBLE_ID', 'COMPLETED', 'DEADLINE']);
	$table->addIndex('IX_B_CRM_ACT_2', ['ASSOCIATED_ENTITY_ID', 'TYPE_ID']);
	$table->addIndex('IX_B_CRM_ACT_4', ['DEADLINE']);
	$table->addIndex('IX_B_CRM_ACT_5', ['ORIGIN_ID']);
	$table->addIndex('IX_B_CRM_ACT_8', ['PROVIDER_ID']);
	$table->addIndex('IX_B_CRM_ACT_9', ['CALENDAR_EVENT_ID']);
	$table->addIndex('IX_B_CRM_ACT_10', ['URN']);
	$table->addIndex('IX_B_CRM_ACT_11', ['PARENT_ID']);
	$table->addIndex('IX_B_CRM_ACT_12', ['THREAD_ID']);
	$table->addIndex('IX_B_CRM_ACT_14', ['LAST_UPDATED', 'TYPE_ID']);
	$table->addIndex('IX_B_CRM_ACT_15', ['COMPLETED', 'DEADLINE']);
	$table->addIndex('IX_B_CRM_ACT_16', ['RESPONSIBLE_ID', 'OWNER_TYPE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_ACT_17', ['RESPONSIBLE_ID', 'COMPLETED', 'START_TIME']);
	$table->addIndex('IX_B_CRM_ACT_18', ['RESPONSIBLE_ID', 'CREATED']);
	$table->addIndex('IX_B_CRM_ACT_19', ['TYPE_ID', 'COMPLETED', 'DEADLINE']);
	$table->addIndex('IX_B_CRM_ACT_20', ['OWNER_ID', 'OWNER_TYPE_ID', 'TYPE_ID', 'COMPLETED', 'DEADLINE']);
	$table->addIndex('IX_B_CRM_ACT_21', ['ORIGINATOR_ID']);
	$table->addIndex('IX_B_CRM_ACT_22', ['CREATED']);
	$table->addFulltextIndex('IX_B_CRM_ACT_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_act_bind')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ACTIVITY_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ACT_BIND_2', ['OWNER_ID', 'OWNER_TYPE_ID', 'ACTIVITY_ID']);
	$table->addIndex('IX_B_CRM_ACT_BIND_3', ['ACTIVITY_ID', 'OWNER_TYPE_ID', 'OWNER_ID']);
});

$migration->table('b_crm_act_comm')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->varchar('TYPE', 64);
	$columns->varchar('VALUE', 256);
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->text('ENTITY_SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ACT_COMM', ['ACTIVITY_ID', 'OWNER_ID', 'OWNER_TYPE_ID', 'ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_B_CRM_ACT_COMM_3', ['OWNER_ID', 'OWNER_TYPE_ID', 'TYPE']);
	$table->addIndex('IX_B_CRM_ACT_COMM_4', ['ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_act_elem')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->tinyInt('STORAGE_TYPE_ID')->unsigned()->notNull();
	$columns->int('ELEMENT_ID')->unsigned()->notNull();
	$table->addPrimaryKeys(['ACTIVITY_ID', 'STORAGE_TYPE_ID', 'ELEMENT_ID']);
	$table->addIndex('IX_B_CRM_ACT_ELEM_1', ['ELEMENT_ID', 'STORAGE_TYPE_ID']);
});

$migration->table('b_crm_act_app_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('APP_ID')->notNull();
	$columns->varchar('TYPE_ID', 100)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('ICON_ID')->notNull()->default('0');
	$columns->char('IS_CONFIGURABLE_TYPE', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_usr_act')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->datetime('ACTIVITY_TIME')->notNull();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->int('DEPARTMENT_ID')->unsigned()->notNull();
	$columns->varchar('SORT', 16);
	$table->addPrimaryKeys(['USER_ID', 'OWNER_ID', 'OWNER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_USR_ACT', ['USER_ID', 'OWNER_ID', 'OWNER_TYPE_ID', 'ACTIVITY_TIME', 'ACTIVITY_ID', 'DEPARTMENT_ID']);
	$table->addIndex('IX_B_CRM_USR_ACT_2', ['OWNER_ID ASC', 'OWNER_TYPE_ID ASC', 'USER_ID DESC', 'SORT DESC']);
});

$migration->table('b_crm_usr_mt')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->tinyInt('SCOPE')->unsigned()->notNull();
	$columns->char('IS_ACTIVE', 1)->notNull()->default('N');
	$columns->varchar('TITLE', 128);
	$columns->varchar('EMAIL_FROM', 255);
	$columns->varchar('SUBJECT', 255);
	$columns->tinyInt('BODY_TYPE')->unsigned();
	$columns->text('BODY');
	$columns->char('SING_REQUIRED', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull()->default('100');
	$columns->datetime('CREATED')->notNull();
	$columns->datetime('LAST_UPDATED')->notNull();
	$columns->int('AUTHOR_ID')->unsigned()->notNull();
	$columns->int('EDITOR_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_USR_MT', ['OWNER_ID', 'ENTITY_TYPE_ID', 'SCOPE', 'IS_ACTIVE']);
});

$migration->table('b_crm_user_mail_template_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->tinyInt('ENTITY_TYPE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_MAIL_TEMPLATE_ACCESS_1', ['TEMPLATE_ID', 'ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_MAIL_TEMPLATE_ACCESS_2', ['TEMPLATE_ID']);
	$table->addIndex('IX_MAIL_TEMPLATE_ACCESS_3', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_crm_sl_rel')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('SL_ID')->notNull();
	$columns->varchar('SL_EVENT_ID', 50)->notNull();
	$columns->varchar('SL_ENTITY_TYPE', 50)->notNull();
	$columns->datetime('SL_LAST_UPDATED');
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('SL_PARENT_ENTITY_TYPE', 50)->notNull();
	$columns->int('PARENT_ENTITY_ID')->unsigned()->notNull();
	$columns->tinyInt('LVL')->unsigned()->notNull()->default('1');
	$columns->tinyInt('TYPE_ID')->unsigned()->notNull()->default('1');
	$table->addIndex('IX_B_CRM_SL_REL_1', ['SL_PARENT_ENTITY_TYPE', 'PARENT_ENTITY_ID', 'LVL', 'SL_ENTITY_TYPE', 'SL_EVENT_ID', 'SL_ID']);
	$table->addIndex('IX_B_CRM_SL_REL_2', ['SL_ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_SL_REL_3', ['SL_ID', 'TYPE_ID']);
	$table->addIndex('IX_B_CRM_SL_REL_4', ['SL_LAST_UPDATED', 'SL_PARENT_ENTITY_TYPE', 'PARENT_ENTITY_ID', 'LVL', 'SL_ENTITY_TYPE', 'SL_EVENT_ID', 'SL_ID']);
});

$migration->table('b_crm_sl_subscr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->varchar('SL_ENTITY_TYPE', 50)->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->tinyInt('TYPE_ID')->unsigned()->notNull();
	$table->addPrimaryKeys(['USER_ID', 'SL_ENTITY_TYPE', 'ENTITY_ID', 'TYPE_ID']);
	$table->addIndex('IX_B_CRM_SL_SUBSCR_1', ['SL_ENTITY_TYPE', 'ENTITY_ID', 'TYPE_ID']);
});

$migration->table('b_crm_biz_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('CODE', 32)->notNull();
	$columns->varchar('NAME', 256)->notNull();
	$columns->varchar('LANG', 2);
	$table->addPrimaryKey('CODE');
});

$migration->table('b_crm_dp_org_mcd')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('TITLE', 256)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DP_ORG_MCD_3', ['TITLE', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_DP_ORG_MCD_4', ['ENTITY_TYPE_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_dp_comm_mcd')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('TYPE', 32)->notNull();
	$columns->varchar('VALUE', 256)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DP_COMM_MCD_3', ['TYPE', 'VALUE', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_DP_COMM_MCD_4', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'TYPE']);
});

$migration->table('b_crm_dp_prsn_mcd')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('LAST_NAME', 64)->notNull();
	$columns->varchar('NAME', 64);
	$columns->varchar('SECOND_NAME', 64);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DP_PRSN_MCD_5', ['ENTITY_TYPE_ID', 'LAST_NAME', 'NAME', 'SECOND_NAME']);
	$table->addIndex('IX_B_CRM_DP_PRSN_MCD_6', ['LAST_NAME', 'NAME', 'SECOND_NAME', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_DP_PRSN_MCD_7', ['ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_DP_PRSN_MCD_8', ['LAST_NAME', 'ENTITY_TYPE_ID', 'ENTITY_ID', 'NAME', 'SECOND_NAME']);
	$table->addIndex('IX_B_CRM_DP_PRSN_MCD_9', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'LAST_NAME', 'NAME', 'SECOND_NAME']);
});

$migration->table('b_crm_dp_rq_mcd')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('RQ_COUNTRY_ID')->notNull()->default('0');
	$columns->varchar('RQ_FIELD_NAME', 32)->notNull();
	$columns->varchar('VALUE', 32)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DP_RQ_MCD_3', ['RQ_FIELD_NAME', 'RQ_COUNTRY_ID', 'VALUE', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_DP_RQ_MCD_4', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'RQ_FIELD_NAME', 'RQ_COUNTRY_ID']);
});

$migration->table('b_crm_dp_bd_mcd')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('BD_COUNTRY_ID')->notNull()->default('0');
	$columns->varchar('BD_FIELD_NAME', 32)->notNull();
	$columns->varchar('VALUE', 32)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DP_BD_MCD_3', ['BD_FIELD_NAME', 'BD_COUNTRY_ID', 'VALUE', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_DP_BD_MCD_4', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'BD_FIELD_NAME', 'BD_COUNTRY_ID']);
});

$migration->table('b_crm_dp_vol_mcd')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('VALUE', 1024)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DP_VOL_MCD_1', ['TYPE_ID', 'VALUE(255)', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_DP_VOL_MCD_2', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'TYPE_ID']);
});

$migration->table('b_crm_dp_index_type_settings')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('N');
	$columns->varchar('DESCRIPTION', 256)->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->tinyInt('STATE_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('FIELD_PATH', 255)->notNull();
	$columns->varchar('FIELD_NAME', 50)->notNull();
	$columns->mediumText('PROGRESS_DATA');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UK_B_CRM_DP_IDX_TYP_STGS_1', ['ENTITY_TYPE_ID', 'FIELD_PATH', 'FIELD_NAME']);
});

$migration->table('b_crm_quote')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY')->notNull();
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->int('ASSIGNED_BY_ID')->unsigned();
	$columns->char('OPENED', 1)->default('N');
	$columns->int('LEAD_ID')->unsigned();
	$columns->int('DEAL_ID')->unsigned();
	$columns->int('COMPANY_ID')->unsigned();
	$columns->int('CONTACT_ID')->unsigned();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->int('MYCOMPANY_ID')->unsigned();
	$columns->varchar('TITLE', 255);
	$columns->varchar('STATUS_ID', 50);
	$columns->char('CLOSED', 1)->default('N');
	$columns->decimal('OPPORTUNITY', 18, 2);
	$columns->char('IS_MANUAL_OPPORTUNITY', 1)->default('N');
	$columns->decimal('TAX_VALUE', 18, 2);
	$columns->varchar('CURRENCY_ID', 50);
	$columns->decimal('OPPORTUNITY_ACCOUNT', 18, 2);
	$columns->decimal('TAX_VALUE_ACCOUNT', 18, 2);
	$columns->varchar('ACCOUNT_CURRENCY_ID', 50);
	$columns->text('COMMENTS');
	$columns->tinyInt('COMMENTS_TYPE')->unsigned();
	$columns->datetime('BEGINDATE');
	$columns->datetime('CLOSEDATE');
	$columns->decimal('EXCH_RATE', 20, 4)->default('1');
	$columns->varchar('QUOTE_NUMBER', 100);
	$columns->text('CONTENT');
	$columns->tinyInt('CONTENT_TYPE')->unsigned();
	$columns->text('TERMS');
	$columns->tinyInt('TERMS_TYPE')->unsigned();
	$columns->tinyInt('STORAGE_TYPE_ID')->unsigned();
	$columns->text('STORAGE_ELEMENT_IDS');
	$columns->varchar('LOCATION_ID', 100);
	$columns->int('WEBFORM_ID')->unsigned();
	$columns->date('ACTUAL_DATE');
	$columns->varchar('CLIENT_TITLE', 255);
	$columns->varchar('CLIENT_ADDR', 255);
	$columns->varchar('CLIENT_CONTACT', 255);
	$columns->varchar('CLIENT_EMAIL', 255);
	$columns->varchar('CLIENT_PHONE', 255);
	$columns->varchar('CLIENT_TP_ID', 255);
	$columns->varchar('CLIENT_TPA_ID', 255);
	$columns->mediumText('SEARCH_CONTENT');
	$columns->int('LAST_ACTIVITY_BY')->unsigned()->notNull()->default('0');
	$columns->datetime('LAST_ACTIVITY_TIME')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_QUOTE_1', ['STATUS_ID', 'ASSIGNED_BY_ID']);
	$table->addIndex('IX_QUOTE_2', ['COMPANY_ID']);
	$table->addIndex('IX_QUOTE_3', ['CONTACT_ID']);
	$table->addIndex('IX_QUOTE_4', ['DEAL_ID']);
	$table->addIndex('IX_QUOTE_5', ['LEAD_ID']);
	$table->addIndex('IX_QUOTE_6', ['WEBFORM_ID']);
	$table->addIndex('IX_QUOTE_7', ['LAST_ACTIVITY_TIME']);
	$table->addIndex('IX_QUOTE_8', ['DATE_CREATE']);
	$table->addUniqueIndex('IXS_QUOTE_NUMBER', ['QUOTE_NUMBER']);
	$table->addFulltextIndex('IX_B_CRM_QUOTE_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_quote_elem')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('QUOTE_ID')->unsigned()->notNull();
	$columns->tinyInt('STORAGE_TYPE_ID')->unsigned()->notNull();
	$columns->int('ELEMENT_ID')->unsigned()->notNull();
	$table->addPrimaryKeys(['QUOTE_ID', 'STORAGE_TYPE_ID', 'ELEMENT_ID']);
});

$migration->table('b_crm_dp_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('SCOPE', 6)->notNull()->default('');
	$columns->varchar('MATCH_HASH', 32)->notNull();
	$columns->text('MATCHES');
	$columns->int('QUANTITY')->unsigned()->notNull();
	$columns->int('ROOT_ENTITY_ID')->unsigned()->notNull();
	$columns->char('ROOT_ENTITY_NAME_FLAG', 1)->notNull();
	$columns->varchar('ROOT_ENTITY_NAME', 256)->notNull();
	$columns->char('ROOT_ENTITY_TITLE_FLAG', 1)->notNull();
	$columns->varchar('ROOT_ENTITY_TITLE', 256)->notNull();
	$columns->char('ROOT_ENTITY_PHONE_FLAG', 1)->notNull();
	$columns->varchar('ROOT_ENTITY_PHONE', 256)->notNull();
	$columns->char('ROOT_ENTITY_EMAIL_FLAG', 1)->notNull();
	$columns->varchar('ROOT_ENTITY_EMAIL', 256)->notNull();
	$columns->char('ROOT_ENTITY_RQ_INN_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_INN', 15)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_OGRN_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_OGRN', 13)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_OGRNIP_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_OGRNIP', 15)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_BIN_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_BIN', 12)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_EDRPOU_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_EDRPOU', 10)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_VAT_ID_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_VAT_ID', 20)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_ACC_NUM_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_ACC_NUM', 34)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_IBAN_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_IBAN', 34)->notNull()->default('');
	$columns->char('ROOT_ENTITY_RQ_IIK_FLAG', 1)->notNull()->default('1');
	$columns->varchar('ROOT_ENTITY_RQ_IIK', 20)->notNull()->default('');
	$columns->char('IS_JUNK', 1);
	$columns->int('STATUS_ID')->unsigned();
	$table->addPrimaryKeys(['USER_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'MATCH_HASH', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_1', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_NAME_FLAG', 'ROOT_ENTITY_NAME(255)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_2', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_TITLE_FLAG', 'ROOT_ENTITY_TITLE(255)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_3', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_PHONE_FLAG', 'ROOT_ENTITY_PHONE(255)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_4', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_EMAIL_FLAG', 'ROOT_ENTITY_EMAIL(255)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_5', ['MATCH_HASH', 'TYPE_ID', 'ENTITY_TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_6', ['ROOT_ENTITY_ID', 'ENTITY_TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_7', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_INN_FLAG', 'ROOT_ENTITY_RQ_INN(15)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_8', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_OGRN_FLAG', 'ROOT_ENTITY_RQ_OGRN(13)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_9', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_OGRNIP_FLAG', 'ROOT_ENTITY_RQ_OGRNIP(15)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_10', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_BIN_FLAG', 'ROOT_ENTITY_RQ_BIN(12)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_11', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_EDRPOU_FLAG', 'ROOT_ENTITY_RQ_EDRPOU(10)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_12', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_VAT_ID_FLAG', 'ROOT_ENTITY_RQ_VAT_ID(20)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_13', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_ACC_NUM_FLAG', 'ROOT_ENTITY_RQ_ACC_NUM(34)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_14', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_IBAN_FLAG', 'ROOT_ENTITY_RQ_IBAN(34)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_15', ['USER_ID', 'ENTITY_TYPE_ID', 'ROOT_ENTITY_RQ_IIK_FLAG', 'ROOT_ENTITY_RQ_IIK(20)', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_16', ['USER_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_17', ['USER_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'STATUS_ID', 'ROOT_ENTITY_NAME_FLAG', 'ROOT_ENTITY_NAME(255)']);
});

$migration->table('b_crm_dp_index_mismatch')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('SCOPE', 6)->notNull()->default('');
	$columns->varchar('MATCH_HASH', 32)->notNull();
	$columns->int('L_ENTITY_ID')->unsigned()->notNull();
	$columns->int('R_ENTITY_ID')->unsigned()->notNull();
	$table->addPrimaryKeys(['USER_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'MATCH_HASH', 'L_ENTITY_ID', 'R_ENTITY_ID', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_IND_MISM_1', ['L_ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_B_CRM_DP_IND_MISM_2', ['R_ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_dp_entity_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->varchar('RANKING_DATA', 512);
	$table->addPrimaryKeys(['ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_dp_entity_hash')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('MATCH_HASH', 32)->notNull();
	$columns->varchar('SCOPE', 6)->notNull()->default('');
	$columns->char('IS_PRIMARY', 1)->notNull();
	$columns->datetime('DATE_MODIFY')->defaultCurrentTimestamp();
	$table->addPrimaryKeys(['ENTITY_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'MATCH_HASH', 'SCOPE']);
	$table->addIndex('IX_B_CRM_DP_ENT_HASH_1', ['ENTITY_TYPE_ID', 'TYPE_ID', 'MATCH_HASH', 'SCOPE', 'ENTITY_ID', 'IS_PRIMARY']);
});

$migration->table('b_crm_addr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->tinyInt('TYPE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->tinyInt('ANCHOR_TYPE_ID')->unsigned();
	$columns->int('ANCHOR_ID')->unsigned();
	$columns->varchar('ADDRESS_1', 1024);
	$columns->varchar('ADDRESS_2', 1024);
	$columns->varchar('CITY', 128);
	$columns->varchar('POSTAL_CODE', 16);
	$columns->varchar('REGION', 128);
	$columns->varchar('PROVINCE', 128);
	$columns->varchar('COUNTRY', 128);
	$columns->varchar('COUNTRY_CODE', 100);
	$columns->int('LOC_ADDR_ID')->unsigned()->notNull()->default('0');
	$columns->tinyInt('IS_DEF')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ADDR_1', ['ENTITY_TYPE_ID', 'TYPE_ID', 'ADDRESS_1(255)', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ADDR_3', ['ENTITY_TYPE_ID', 'TYPE_ID', 'CITY', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ADDR_4', ['ENTITY_TYPE_ID', 'TYPE_ID', 'POSTAL_CODE', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ADDR_5', ['ENTITY_TYPE_ID', 'TYPE_ID', 'REGION', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ADDR_6', ['ENTITY_TYPE_ID', 'TYPE_ID', 'PROVINCE', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ADDR_7', ['ENTITY_TYPE_ID', 'TYPE_ID', 'COUNTRY', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ADDR_8', ['ANCHOR_TYPE_ID', 'TYPE_ID', 'ADDRESS_1(255)', 'ANCHOR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_10', ['ANCHOR_TYPE_ID', 'TYPE_ID', 'CITY', 'ANCHOR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_11', ['ANCHOR_TYPE_ID', 'TYPE_ID', 'POSTAL_CODE', 'ANCHOR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_12', ['ANCHOR_TYPE_ID', 'TYPE_ID', 'REGION', 'ANCHOR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_13', ['ANCHOR_TYPE_ID', 'TYPE_ID', 'PROVINCE', 'ANCHOR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_14', ['ANCHOR_TYPE_ID', 'TYPE_ID', 'COUNTRY', 'ANCHOR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_15', ['ANCHOR_TYPE_ID', 'ANCHOR_ID', 'TYPE_ID']);
	$table->addIndex('IX_B_CRM_ADDR_16', ['LOC_ADDR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_17', ['ENTITY_TYPE_ID', 'TYPE_ID', 'ADDRESS_2(255)', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ADDR_18', ['ANCHOR_TYPE_ID', 'TYPE_ID', 'ADDRESS_2(255)', 'ANCHOR_ID']);
	$table->addIndex('IX_B_CRM_ADDR_19', ['ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addUniqueIndex('IX_B_CRM_ADDR_20', ['TYPE_ID', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_deal_stage_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->date('CREATED_DATE');
	$columns->date('EFFECTIVE_DATE');
	$columns->date('START_DATE')->notNull();
	$columns->date('END_DATE')->notNull();
	$columns->int('PERIOD_YEAR')->unsigned()->notNull();
	$columns->int('PERIOD_QUARTER')->unsigned()->notNull();
	$columns->int('PERIOD_MONTH')->unsigned()->notNull();
	$columns->int('START_PERIOD_YEAR')->unsigned()->notNull();
	$columns->int('START_PERIOD_QUARTER')->unsigned()->notNull();
	$columns->int('START_PERIOD_MONTH')->unsigned()->notNull();
	$columns->int('END_PERIOD_YEAR')->unsigned()->notNull();
	$columns->int('END_PERIOD_QUARTER')->unsigned()->notNull();
	$columns->int('END_PERIOD_MONTH')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned();
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->varchar('STAGE_ID', 50);
	$columns->char('IS_LOST', 1);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DEAL_SHX_2', ['TYPE_ID', 'STAGE_ID', 'START_DATE', 'RESPONSIBLE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_3', ['TYPE_ID', 'STAGE_ID', 'END_DATE', 'RESPONSIBLE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_4', ['TYPE_ID', 'STAGE_ID', 'CREATED_TIME', 'RESPONSIBLE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_5', ['PERIOD_YEAR', 'PERIOD_MONTH', 'RESPONSIBLE_ID', 'OWNER_ID', 'START_DATE', 'END_DATE']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_6', ['PERIOD_YEAR', 'PERIOD_MONTH', 'STAGE_SEMANTIC_ID', 'RESPONSIBLE_ID', 'OWNER_ID', 'START_DATE', 'END_DATE']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_7', ['PERIOD_YEAR', 'PERIOD_MONTH', 'OWNER_ID', 'START_DATE', 'END_DATE']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_8', ['TYPE_ID', 'OWNER_ID', 'END_DATE', 'START_DATE']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_9', ['TYPE_ID', 'STAGE_ID', 'CREATED_DATE', 'RESPONSIBLE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_10', ['CATEGORY_ID', 'TYPE_ID', 'STAGE_ID', 'START_DATE', 'RESPONSIBLE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_11', ['CATEGORY_ID', 'TYPE_ID', 'STAGE_ID', 'END_DATE', 'RESPONSIBLE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_12', ['CATEGORY_ID', 'TYPE_ID', 'STAGE_ID', 'CREATED_DATE', 'RESPONSIBLE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_13', ['IS_LOST', 'CREATED_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_14', ['CATEGORY_ID', 'IS_LOST', 'CREATED_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_15', ['CATEGORY_ID', 'IS_LOST', 'STAGE_ID', 'EFFECTIVE_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_16', ['OWNER_ID', 'TYPE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SHX_17', ['CREATED_TIME']);
});

$migration->table('b_crm_deal_stage_history_with_supposed')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME');
	$columns->date('CREATED_DATE');
	$columns->int('CATEGORY_ID')->unsigned();
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->varchar('STAGE_ID', 50);
	$columns->char('IS_LOST', 1);
	$columns->char('IS_SUPPOSED', 1)->notNull()->default('N');
	$columns->date('LAST_UPDATE_DATE');
	$columns->date('CLOSE_DATE')->notNull()->default('3000-12-12');
	$columns->int('SPENT_TIME');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_HISTORY_WITH_SUPPOSED_DATES_1', ['LAST_UPDATE_DATE', 'CLOSE_DATE']);
	$table->addIndex('IX_B_CRM_HISTORY_WITH_SUPPOSED_DATES_2', ['CLOSE_DATE', 'LAST_UPDATE_DATE']);
	$table->addIndex('IX_B_CRM_HISTORY_WITH_SUPPOSED_4', ['OWNER_ID', 'CREATED_TIME']);
});

$migration->table('b_crm_deal_sum_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->date('START_DATE')->notNull();
	$columns->date('END_DATE')->notNull();
	$columns->int('PERIOD_YEAR')->unsigned()->notNull();
	$columns->int('PERIOD_QUARTER')->unsigned()->notNull();
	$columns->int('PERIOD_MONTH')->unsigned()->notNull();
	$columns->int('PERIOD_DAY')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned();
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->varchar('STAGE_ID', 50);
	$columns->char('IS_LOST', 1);
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('SUM_TOTAL', 18, 2);
	$columns->decimal('UF_SUM_1', 18, 2);
	$columns->decimal('UF_SUM_2', 18, 2);
	$columns->decimal('UF_SUM_3', 18, 2);
	$columns->decimal('UF_SUM_4', 18, 2);
	$columns->decimal('UF_SUM_5', 18, 2);
	$columns->int('UF_ATTR_1');
	$table->addPrimaryKeys(['OWNER_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_DEAL_SSTAT_1', ['STAGE_SEMANTIC_ID', 'OWNER_ID', 'END_DATE', 'START_DATE', 'CREATED_DATE', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SSTAT_2', ['IS_LOST', 'OWNER_ID', 'END_DATE', 'START_DATE', 'CREATED_DATE', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SSTAT_3', ['END_DATE', 'START_DATE', 'OWNER_ID', 'CREATED_DATE', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_SSTAT_4', ['CATEGORY_ID', 'END_DATE', 'START_DATE', 'OWNER_ID', 'CREATED_DATE', 'RESPONSIBLE_ID']);
});

$migration->table('b_crm_deal_inv_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->date('START_DATE')->notNull();
	$columns->date('END_DATE')->notNull();
	$columns->int('PERIOD_YEAR')->unsigned()->notNull();
	$columns->int('PERIOD_QUARTER')->unsigned()->notNull();
	$columns->int('PERIOD_MONTH')->unsigned()->notNull();
	$columns->int('PERIOD_DAY')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned();
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->varchar('STAGE_ID', 50);
	$columns->char('IS_LOST', 1);
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('INVOICE_SUM', 18, 2);
	$columns->int('INVOICE_QTY')->unsigned();
	$columns->decimal('TOTAL_INVOICE_SUM', 18, 2);
	$columns->int('TOTAL_INVOICE_QTY')->unsigned();
	$columns->decimal('TOTAL_SUM', 18, 2);
	$columns->decimal('TOTAL_OWED', 18, 2);
	$columns->int('UF_ATTR_1');
	$table->addPrimaryKeys(['OWNER_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_DEAL_ISTAT_1', ['STAGE_SEMANTIC_ID', 'OWNER_ID', 'END_DATE', 'START_DATE', 'CREATED_DATE', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_ISTAT_2', ['IS_LOST', 'OWNER_ID', 'END_DATE', 'START_DATE', 'CREATED_DATE', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_ISTAT_3', ['CATEGORY_ID', 'IS_LOST', 'OWNER_ID', 'END_DATE', 'START_DATE', 'CREATED_DATE', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_ISTAT_4', ['CATEGORY_ID', 'STAGE_SEMANTIC_ID', 'OWNER_ID', 'END_DATE', 'START_DATE', 'CREATED_DATE', 'RESPONSIBLE_ID']);
});

$migration->table('b_crm_deal_act_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->int('DEADLINE_YEAR')->unsigned()->notNull();
	$columns->int('DEADLINE_QUARTER')->unsigned()->notNull();
	$columns->int('DEADLINE_MONTH')->unsigned()->notNull();
	$columns->int('DEADLINE_DAY')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned();
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->varchar('STAGE_ID', 50);
	$columns->char('IS_LOST', 1);
	$columns->int('CALL_QTY')->unsigned();
	$columns->int('MEETING_QTY')->unsigned();
	$columns->int('EMAIL_QTY')->unsigned();
	$columns->int('UF_ATTR_1');
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE']);
	$table->addIndex('IX_B_CRM_DEAL_ASTAT_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'CALL_QTY', 'MEETING_QTY', 'EMAIL_QTY']);
	$table->addIndex('IX_B_CRM_DEAL_ASTAT_2', ['DEADLINE_DATE', 'OWNER_ID', 'CALL_QTY', 'MEETING_QTY', 'EMAIL_QTY']);
	$table->addIndex('IX_B_CRM_DEAL_ASTAT_3', ['IS_LOST', 'DEADLINE_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_ASTAT_4', ['CATEGORY_ID', 'IS_LOST', 'DEADLINE_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_ASTAT_5', ['CATEGORY_ID', 'RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'CALL_QTY', 'MEETING_QTY', 'EMAIL_QTY']);
});

$migration->table('b_crm_conv_map')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('SRC_TYPE_ID')->notNull();
	$columns->int('DST_TYPE_ID')->notNull();
	$columns->varchar('RELATION_TYPE', 20)->notNull();
	$columns->char('IS_CHILDREN_LIST_ENABLED', 1)->notNull()->default('Y');
	$columns->datetime('LAST_UPDATED')->notNull();
	$columns->longText('DATA');
	$table->addPrimaryKeys(['DST_TYPE_ID', 'SRC_TYPE_ID']);
});

$migration->table('b_crm_lead_status_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->date('CREATED_DATE');
	$columns->int('PERIOD_YEAR')->unsigned()->notNull();
	$columns->int('PERIOD_QUARTER')->unsigned()->notNull();
	$columns->int('PERIOD_MONTH')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$columns->varchar('STATUS_ID', 50);
	$columns->char('IS_IN_WORK', 1);
	$columns->char('IS_JUNK', 1);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_LEAD_SHX_2', ['TYPE_ID', 'CREATED_DATE', 'STATUS_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_LEAD_SHX_3', ['TYPE_ID', 'IS_JUNK', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_SHX_4', ['TYPE_ID', 'IS_JUNK', 'RESPONSIBLE_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_SHX_5', ['IS_IN_WORK', 'OWNER_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_SHX_6', ['IS_IN_WORK', 'OWNER_ID', 'RESPONSIBLE_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_SHX_7', ['IS_JUNK', 'STATUS_ID', 'CREATED_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_LEAD_SHX_8', ['OWNER_ID', 'TYPE_ID']);
});

$migration->table('b_crm_lead_status_history_with_supposed')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME');
	$columns->date('CREATED_DATE');
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$columns->varchar('STATUS_ID', 50);
	$columns->char('IS_LOST', 1);
	$columns->char('IS_SUPPOSED', 1)->notNull()->default('N');
	$columns->date('LAST_UPDATE_DATE');
	$columns->date('CLOSE_DATE')->notNull()->default('3000-12-12');
	$columns->int('SPENT_TIME');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_LEAD_STATUS_HISTORY_WITH_SUPPOSED_1', ['LAST_UPDATE_DATE', 'CLOSE_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_STATUS_HISTORY_WITH_SUPPOSED_2', ['CLOSE_DATE', 'LAST_UPDATE_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_STATUS_HISTORY_WITH_SUPPOSED_4', ['OWNER_ID', 'CREATED_TIME']);
});

$migration->table('b_crm_lead_sum_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->int('PERIOD_YEAR')->unsigned()->notNull();
	$columns->int('PERIOD_QUARTER')->unsigned()->notNull();
	$columns->int('PERIOD_MONTH')->unsigned()->notNull();
	$columns->int('PERIOD_DAY')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$columns->varchar('STATUS_ID', 50);
	$columns->varchar('SOURCE_ID', 50);
	$columns->char('IS_JUNK', 1);
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('SUM_TOTAL', 18, 2);
	$columns->decimal('UF_SUM_1', 18, 2);
	$columns->decimal('UF_SUM_2', 18, 2);
	$columns->decimal('UF_SUM_3', 18, 2);
	$columns->decimal('UF_SUM_4', 18, 2);
	$columns->decimal('UF_SUM_5', 18, 2);
	$columns->int('UF_ATTR_1');
	$table->addPrimaryKeys(['OWNER_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_SSTAT_1', ['CREATED_DATE', 'OWNER_ID', 'SOURCE_ID']);
	$table->addIndex('IX_B_CRM_LEAD_SSTAT_3', ['SOURCE_ID']);
});

$migration->table('b_crm_lead_act_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->int('DEADLINE_YEAR')->unsigned()->notNull();
	$columns->int('DEADLINE_QUARTER')->unsigned()->notNull();
	$columns->int('DEADLINE_MONTH')->unsigned()->notNull();
	$columns->int('DEADLINE_DAY')->unsigned()->notNull();
	$columns->date('CREATED_DATE');
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$columns->varchar('STATUS_ID', 50);
	$columns->char('IS_JUNK', 1);
	$columns->int('CALL_QTY')->unsigned();
	$columns->int('MEETING_QTY')->unsigned();
	$columns->int('EMAIL_QTY')->unsigned();
	$columns->int('UF_ATTR_1');
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_ASTAT_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'CALL_QTY', 'MEETING_QTY', 'EMAIL_QTY']);
	$table->addIndex('IX_B_CRM_LEAD_ASTAT_2', ['DEADLINE_DATE', 'OWNER_ID', 'CALL_QTY', 'MEETING_QTY', 'EMAIL_QTY']);
	$table->addIndex('IX_B_CRM_LEAD_ASTAT_4', ['IS_JUNK', 'OWNER_ID', 'RESPONSIBLE_ID', 'DEADLINE_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_ASTAT_5', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'CALL_QTY', 'MEETING_QTY', 'EMAIL_QTY']);
	$table->addIndex('IX_B_CRM_LEAD_ASTAT_6', ['IS_JUNK']);
});

$migration->table('b_crm_lead_conv_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('ENTRY_DATE')->notNull();
	$columns->date('CREATED_DATE');
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('DEAL_QTY')->unsigned();
	$columns->int('CONTACT_QTY')->unsigned();
	$columns->int('COMPANY_QTY')->unsigned();
	$columns->date('TOTALS_DATE');
	$table->addPrimaryKeys(['OWNER_ID', 'ENTRY_DATE']);
	$table->addIndex('IX_B_CRM_LEAD_CSTAT_1', ['RESPONSIBLE_ID', 'ENTRY_DATE', 'OWNER_ID', 'DEAL_QTY', 'CONTACT_QTY', 'COMPANY_QTY']);
	$table->addIndex('IX_B_CRM_LEAD_CSTAT_2', ['CREATED_DATE', 'OWNER_ID', 'DEAL_QTY', 'CONTACT_QTY', 'COMPANY_QTY']);
});

$migration->table('b_crm_inv_status_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->date('CREATED_DATE');
	$columns->date('BILL_DATE')->notNull();
	$columns->date('PAY_BEFORE_DATE')->notNull();
	$columns->date('ACTIVITY_DATE')->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$columns->varchar('STATUS_ID', 50);
	$columns->char('IS_NEW', 1);
	$columns->char('IS_JUNK', 1);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_INV_SHX_2', ['TYPE_ID', 'CREATED_DATE', 'STATUS_ID', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_INV_SHX_4', ['IS_JUNK', 'STATUS_ID', 'CREATED_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_INV_SHX_5', ['ACTIVITY_DATE', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_INV_SHX_6', ['STATUS_SEMANTIC_ID', 'ACTIVITY_DATE', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_INV_SHX_7', ['OWNER_ID', 'ACTIVITY_DATE']);
});

$migration->table('b_crm_invoice_sum_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->date('BILL_DATE')->notNull();
	$columns->date('PAY_BEFORE_DATE')->notNull();
	$columns->date('PAID_DATE');
	$columns->char('IS_PAID_INTIME', 1);
	$columns->date('CLOSED_DATE');
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('COMPANY_ID')->unsigned();
	$columns->int('CONTACT_ID')->unsigned();
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$columns->varchar('STATUS_ID', 50);
	$columns->char('IS_JUNK', 1);
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('SUM_TOTAL', 18, 2);
	$columns->decimal('UF_SUM_1', 18, 2);
	$columns->decimal('UF_SUM_2', 18, 2);
	$columns->decimal('UF_SUM_3', 18, 2);
	$columns->decimal('UF_SUM_4', 18, 2);
	$columns->decimal('UF_SUM_5', 18, 2);
	$columns->int('UF_ATTR_1');
	$table->addPrimaryKeys(['OWNER_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_INV_SSTAT_1', ['CREATED_DATE', 'OWNER_ID', 'RESPONSIBLE_ID']);
	$table->addIndex('IX_B_CRM_INV_SSTAT_2', ['STATUS_SEMANTIC_ID', 'CREATED_DATE', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_INV_SSTAT_6', ['STATUS_SEMANTIC_ID', 'PAY_BEFORE_DATE']);
	$table->addIndex('IX_B_CRM_INV_SSTAT_7', ['COMPANY_ID', 'STATUS_SEMANTIC_ID', 'IS_PAID_INTIME']);
	$table->addIndex('IX_B_CRM_INV_SSTAT_8', ['CONTACT_ID', 'STATUS_SEMANTIC_ID', 'IS_PAID_INTIME']);
});

$migration->table('b_crm_requisite')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('PRESET_ID')->unsigned()->notNull()->default('0');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 45);
	$columns->varchar('XML_ID', 45);
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('ADDRESS_ONLY', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('RQ_NAME', 150);
	$columns->varchar('RQ_FIRST_NAME', 50);
	$columns->varchar('RQ_LAST_NAME', 50);
	$columns->varchar('RQ_SECOND_NAME', 50);
	$columns->varchar('RQ_COMPANY_ID', 255);
	$columns->varchar('RQ_COMPANY_NAME', 255);
	$columns->varchar('RQ_COMPANY_FULL_NAME', 300);
	$columns->varchar('RQ_COMPANY_REG_DATE', 30);
	$columns->varchar('RQ_DIRECTOR', 150);
	$columns->varchar('RQ_ACCOUNTANT', 150);
	$columns->varchar('RQ_CEO_NAME', 150);
	$columns->varchar('RQ_CEO_WORK_POS', 150);
	$columns->varchar('RQ_CONTACT', 150);
	$columns->varchar('RQ_EMAIL', 255);
	$columns->varchar('RQ_PHONE', 30);
	$columns->varchar('RQ_FAX', 30);
	$columns->varchar('RQ_IDENT_DOC', 255);
	$columns->varchar('RQ_IDENT_DOC_SER', 25);
	$columns->varchar('RQ_IDENT_DOC_NUM', 25);
	$columns->varchar('RQ_IDENT_DOC_PERS_NUM', 25);
	$columns->varchar('RQ_IDENT_DOC_DATE', 30);
	$columns->varchar('RQ_IDENT_DOC_ISSUED_BY', 255);
	$columns->varchar('RQ_IDENT_DOC_DEP_CODE', 25);
	$columns->varchar('RQ_INN', 15);
	$columns->varchar('RQ_KPP', 9);
	$columns->varchar('RQ_USRLE', 20);
	$columns->varchar('RQ_IFNS', 255);
	$columns->varchar('RQ_OGRN', 13);
	$columns->varchar('RQ_OGRNIP', 15);
	$columns->varchar('RQ_OKPO', 12);
	$columns->varchar('RQ_OKTMO', 11);
	$columns->varchar('RQ_OKVED', 255);
	$columns->varchar('RQ_EDRPOU', 10);
	$columns->varchar('RQ_DRFO', 10);
	$columns->varchar('RQ_KBE', 2);
	$columns->varchar('RQ_IIN', 12);
	$columns->varchar('RQ_BIN', 12);
	$columns->varchar('RQ_ST_CERT_SER', 10);
	$columns->varchar('RQ_ST_CERT_NUM', 15);
	$columns->varchar('RQ_ST_CERT_DATE', 30);
	$columns->char('RQ_VAT_PAYER', 1)->notNull()->default('N');
	$columns->varchar('RQ_VAT_ID', 20);
	$columns->varchar('RQ_VAT_CERT_SER', 10);
	$columns->varchar('RQ_VAT_CERT_NUM', 15);
	$columns->varchar('RQ_VAT_CERT_DATE', 30);
	$columns->varchar('RQ_RESIDENCE_COUNTRY', 128);
	$columns->varchar('RQ_BASE_DOC', 255);
	$columns->varchar('RQ_REGON', 9);
	$columns->varchar('RQ_KRS', 10);
	$columns->varchar('RQ_PESEL', 11);
	$columns->varchar('RQ_LEGAL_FORM', 80);
	$columns->varchar('RQ_SIRET', 20);
	$columns->varchar('RQ_SIREN', 15);
	$columns->varchar('RQ_CAPITAL', 30);
	$columns->varchar('RQ_RCS', 50);
	$columns->varchar('RQ_CNPJ', 20);
	$columns->varchar('RQ_STATE_REG', 25);
	$columns->varchar('RQ_MNPL_REG', 20);
	$columns->varchar('RQ_CPF', 20);
	$columns->varchar('RQ_IDENT_TYPE', 50);
	$columns->varchar('RQ_TAX_REGIME', 50);
	$columns->int('RQ_SIGNATURE');
	$columns->int('RQ_STAMP');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_REQUISITE_2', ['RQ_NAME']);
	$table->addIndex('IX_B_CRM_REQUISITE_3', ['RQ_LAST_NAME', 'RQ_FIRST_NAME', 'RQ_SECOND_NAME']);
	$table->addIndex('IX_B_CRM_REQUISITE_4', ['RQ_COMPANY_NAME']);
	$table->addIndex('IX_B_CRM_REQUISITE_5', ['RQ_DIRECTOR']);
	$table->addIndex('IX_B_CRM_REQUISITE_6', ['RQ_ACCOUNTANT']);
	$table->addIndex('IX_B_CRM_REQUISITE_7', ['RQ_CEO_NAME']);
	$table->addIndex('IX_B_CRM_REQUISITE_8', ['RQ_CONTACT']);
	$table->addIndex('IX_B_CRM_REQUISITE_9', ['RQ_EMAIL']);
	$table->addIndex('IX_B_CRM_REQUISITE_10', ['RQ_PHONE']);
	$table->addIndex('IX_B_CRM_REQUISITE_11', ['RQ_FAX']);
	$table->addIndex('IX_B_CRM_REQUISITE_12', ['RQ_IDENT_DOC_NUM', 'RQ_IDENT_DOC_SER']);
	$table->addIndex('IX_B_CRM_REQUISITE_13', ['RQ_IDENT_DOC_DEP_CODE']);
	$table->addIndex('IX_B_CRM_REQUISITE_14', ['RQ_INN']);
	$table->addIndex('IX_B_CRM_REQUISITE_15', ['RQ_KPP']);
	$table->addIndex('IX_B_CRM_REQUISITE_16', ['RQ_USRLE']);
	$table->addIndex('IX_B_CRM_REQUISITE_17', ['RQ_IFNS']);
	$table->addIndex('IX_B_CRM_REQUISITE_18', ['RQ_OGRN']);
	$table->addIndex('IX_B_CRM_REQUISITE_19', ['RQ_OGRNIP']);
	$table->addIndex('IX_B_CRM_REQUISITE_20', ['RQ_OKPO']);
	$table->addIndex('IX_B_CRM_REQUISITE_21', ['RQ_OKTMO']);
	$table->addIndex('IX_B_CRM_REQUISITE_22', ['RQ_OKVED']);
	$table->addIndex('IX_B_CRM_REQUISITE_23', ['RQ_EDRPOU']);
	$table->addIndex('IX_B_CRM_REQUISITE_24', ['RQ_DRFO']);
	$table->addIndex('IX_B_CRM_REQUISITE_25', ['RQ_KBE']);
	$table->addIndex('IX_B_CRM_REQUISITE_26', ['RQ_IIN']);
	$table->addIndex('IX_B_CRM_REQUISITE_27', ['RQ_BIN']);
	$table->addIndex('IX_B_CRM_REQUISITE_28', ['RQ_VAT_PAYER']);
	$table->addIndex('IX_B_CRM_REQUISITE_29', ['RQ_VAT_ID']);
	$table->addIndex('IX_B_CRM_REQUISITE_30', ['RQ_VAT_CERT_NUM', 'RQ_VAT_CERT_SER']);
	$table->addIndex('IX_B_CRM_REQUISITE_31', ['RQ_RESIDENCE_COUNTRY']);
	$table->addIndex('IX_B_CRM_REQUISITE_32', ['RQ_IDENT_DOC_PERS_NUM']);
	$table->addIndex('IX_B_CRM_REQUISITE_33', ['RQ_ST_CERT_NUM', 'RQ_ST_CERT_SER']);
	$table->addIndex('IX_B_CRM_REQUISITE_34', ['ENTITY_TYPE_ID', 'PRESET_ID']);
	$table->addIndex('IX_B_CRM_REQUISITE_35', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'PRESET_ID']);
	$table->addIndex('IX_B_CRM_REQUISITE_36', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'SORT']);
	$table->addIndex('IX_B_CRM_REQUISITE_37', ['RQ_REGON']);
	$table->addIndex('IX_B_CRM_REQUISITE_38', ['RQ_KRS']);
	$table->addIndex('IX_B_CRM_REQUISITE_39', ['RQ_PESEL']);
	$table->addIndex('IX_B_CRM_REQUISITE_40', ['RQ_IDENT_TYPE']);
	$table->addIndex('IX_B_CRM_REQUISITE_41', ['RQ_COMPANY_ID']);
	$table->addIndex('IX_B_CRM_REQUISITE_42', ['RQ_SIRET']);
	$table->addIndex('IX_B_CRM_REQUISITE_43', ['RQ_SIREN']);
	$table->addIndex('IX_B_CRM_REQUISITE_44', ['RQ_RCS']);
	$table->addIndex('IX_B_CRM_REQUISITE_45', ['RQ_CNPJ']);
	$table->addIndex('IX_B_CRM_REQUISITE_46', ['RQ_STATE_REG']);
	$table->addIndex('IX_B_CRM_REQUISITE_47', ['RQ_MNPL_REG']);
	$table->addIndex('IX_B_CRM_REQUISITE_48', ['RQ_CPF']);
	$table->addIndex('IX_B_CRM_REQUISITE_49', ['PRESET_ID']);
});

$migration->table('b_crm_preset')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('COUNTRY_ID')->notNull()->default('0');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('XML_ID', 45);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('500');
	$columns->text('SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_PRESET_2', ['COUNTRY_ID']);
	$table->addIndex('IX_B_CRM_PRESET_3', ['ENTITY_TYPE_ID']);
});

$migration->table('b_crm_requisite_cfg')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKeys(['ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_requisite_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('REQUISITE_ID')->unsigned()->notNull()->default('0');
	$columns->int('BANK_DETAIL_ID')->unsigned()->notNull()->default('0');
	$columns->int('MC_REQUISITE_ID')->unsigned()->notNull()->default('0');
	$columns->int('MC_BANK_DETAIL_ID')->unsigned()->notNull()->default('0');
	$table->addPrimaryKeys(['ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_CRM_REQUISITE_LINK_2', ['MC_REQUISITE_ID']);
	$table->addIndex('IX_CRM_REQUISITE_LINK_3', ['REQUISITE_ID', 'MC_REQUISITE_ID']);
});

$migration->table('b_crm_bank_detail')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('COUNTRY_ID')->notNull()->default('0');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_MODIFY');
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->int('MODIFY_BY_ID')->unsigned();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 45);
	$columns->varchar('XML_ID', 45);
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('RQ_BANK_NAME', 255);
	$columns->varchar('RQ_BANK_CODE', 50);
	$columns->varchar('RQ_BANK_ADDR', 255);
	$columns->varchar('RQ_BANK_ROUTE_NUM', 9);
	$columns->varchar('RQ_BIK', 11);
	$columns->varchar('RQ_MFO', 6);
	$columns->varchar('RQ_ACC_NAME', 150);
	$columns->varchar('RQ_ACC_NUM', 34);
	$columns->varchar('RQ_ACC_TYPE', 50);
	$columns->varchar('RQ_IIK', 20);
	$columns->varchar('RQ_ACC_CURRENCY', 100);
	$columns->varchar('RQ_COR_ACC_NUM', 34);
	$columns->varchar('RQ_IBAN', 34);
	$columns->varchar('RQ_SWIFT', 11);
	$columns->varchar('RQ_BIC', 11);
	$columns->varchar('RQ_CODEB', 5);
	$columns->varchar('RQ_CODEG', 5);
	$columns->varchar('RQ_RIB', 2);
	$columns->varchar('RQ_AGENCY_NAME', 50);
	$columns->varchar('COMMENTS', 500);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_BANK_DETAIL_2', ['RQ_BANK_NAME']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_3', ['RQ_BANK_ADDR']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_4', ['RQ_BANK_ROUTE_NUM']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_5', ['RQ_BIK']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_6', ['RQ_MFO']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_7', ['RQ_ACC_NAME']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_8', ['RQ_ACC_NUM']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_9', ['RQ_IIK']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_10', ['RQ_ACC_CURRENCY']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_11', ['RQ_COR_ACC_NUM']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_12', ['RQ_IBAN']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_13', ['RQ_SWIFT']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_14', ['RQ_BIC']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_15', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'SORT']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_16', ['RQ_CODEB']);
	$table->addIndex('IX_B_CRM_BANK_DETAIL_17', ['RQ_CODEG']);
});

$migration->table('b_crm_contact_company')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CONTACT_ID')->unsigned()->notNull();
	$columns->int('COMPANY_ID')->unsigned()->notNull();
	$columns->int('SORT')->notNull();
	$columns->tinyInt('ROLE_ID')->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull();
	$table->addPrimaryKeys(['CONTACT_ID', 'COMPANY_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_COMPANY_1', ['COMPANY_ID', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_COMPANY_2', ['CONTACT_ID', 'IS_PRIMARY', 'COMPANY_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_COMPANY_3', ['CONTACT_ID', 'SORT', 'COMPANY_ID']);
});

$migration->table('b_crm_deal_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DEAL_ID')->unsigned()->notNull();
	$columns->int('CONTACT_ID')->unsigned()->notNull();
	$columns->int('SORT')->notNull();
	$columns->tinyInt('ROLE_ID')->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull();
	$table->addPrimaryKeys(['DEAL_ID', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_DEAL_CONTACT_1', ['CONTACT_ID', 'DEAL_ID']);
	$table->addIndex('IX_B_CRM_DEAL_CONTACT_2', ['DEAL_ID', 'IS_PRIMARY', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_DEAL_CONTACT_3', ['DEAL_ID', 'SORT', 'CONTACT_ID']);
});

$migration->table('b_crm_quote_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('QUOTE_ID')->unsigned()->notNull();
	$columns->int('CONTACT_ID')->unsigned()->notNull();
	$columns->int('SORT')->notNull();
	$columns->tinyInt('ROLE_ID')->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull();
	$table->addPrimaryKeys(['QUOTE_ID', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_QUOTE_CONTACT_1', ['CONTACT_ID', 'QUOTE_ID']);
	$table->addIndex('IX_B_CRM_QUOTE_CONTACT_2', ['QUOTE_ID', 'IS_PRIMARY', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_QUOTE_CONTACT_3', ['QUOTE_ID', 'SORT', 'CONTACT_ID']);
});

$migration->table('b_crm_entity_cfg')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKeys(['ENTITY_ID', 'ENTITY_TYPE_ID', 'USER_ID']);
});

$migration->table('b_crm_webform')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('LANGUAGE_ID', 2);
	$columns->tinyInt('TYPE_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('DESCRIPTION');
	$columns->varchar('BUTTON_CAPTION', 255);
	$columns->varchar('TEMPLATE_ID', 255);
	$columns->char('IS_PAY', 1)->notNull();
	$columns->varchar('GOOGLE_ANALYTICS_ID', 50);
	$columns->varchar('YANDEX_METRIC_ID', 50);
	$columns->varchar('SECURITY_CODE', 32);
	$columns->varchar('BUTTON_COLOR_FONT', 10);
	$columns->varchar('BUTTON_COLOR_BG', 10);
	$columns->varchar('CSS_PATH', 255);
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('ENTITY_SCHEME')->notNull();
	$columns->char('GOOGLE_ANALYTICS_PAGE_VIEW', 1)->notNull()->default('N');
	$columns->varchar('CAPTION', 255);
	$columns->varchar('RESULT_SUCCESS_TEXT', 255);
	$columns->varchar('RESULT_SUCCESS_URL', 500);
	$columns->varchar('RESULT_FAILURE_TEXT', 255);
	$columns->varchar('RESULT_FAILURE_URL', 500);
	$columns->char('ACTIVE', 1)->notNull()->default('N');
	$columns->longText('CSS_TEXT');
	$columns->int('ACTIVE_CHANGE_BY');
	$columns->datetime('ACTIVE_CHANGE_DATE');
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->char('COPYRIGHT_REMOVED', 1)->notNull()->default('N');
	$columns->char('USE_CAPTCHA', 1)->notNull()->default('N');
	$columns->int('BACKGROUND_IMAGE');
	$columns->varchar('CODE', 255);
	$columns->int('OPENLINE_ID');
	$columns->varchar('DUPLICATE_MODE', 20);
	$columns->varchar('XML_ID', 50);
	$columns->char('USE_LICENCE', 1)->notNull()->default('N');
	$columns->int('AGREEMENT_ID');
	$columns->longText('LICENCE_TEXT');
	$columns->varchar('LICENCE_BUTTON_CAPTION', 255);
	$columns->char('LICENCE_BUTTON_IS_CHECKED', 1)->notNull()->default('N');
	$columns->text('SCRIPT_INCLUDE_SETTINGS');
	$columns->text('INVOICE_SETTINGS');
	$columns->text('FORM_SETTINGS');
	$columns->char('IS_CALLBACK_FORM', 1)->notNull()->default('N');
	$columns->char('IS_WHATSAPP_FORM', 1)->notNull()->default('N');
	$columns->varchar('CALL_FROM', 50);
	$columns->text('CALL_TEXT');
	$columns->int('ASSIGNED_BY_ID');
	$columns->char('IS_BOOKING_FORM', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM', ['CODE']);
});

$migration->table('b_crm_webform_counter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('FORM_ID')->notNull();
	$columns->datetime('DATE_CREATE');
	$columns->int('VIEWS')->default('0');
	$columns->int('START_FILL')->default('0');
	$columns->int('END_FILL')->default('0');
	$columns->int('MONEY')->default('0');
	$columns->int('ENTITY_CONTACT')->default('0');
	$columns->int('ENTITY_COMPANY')->default('0');
	$columns->int('ENTITY_DEAL')->default('0');
	$columns->int('ENTITY_LEAD')->default('0');
	$columns->int('ENTITY_QUOTE')->default('0');
	$columns->int('ENTITY_INVOICE')->default('0');
	$columns->int('ENTITY_DYNAMIC')->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_COUNTER', ['FORM_ID']);
});

$migration->table('b_crm_webform_counter_daily')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->date('DATE_STAT')->notNull();
	$columns->int('FORM_ID')->notNull();
	$columns->int('VIEWS')->notNull()->default('0');
	$columns->int('START_FILL')->notNull()->default('0');
	$columns->int('END_FILL')->notNull()->default('0');
	$table->addPrimaryKeys(['DATE_STAT', 'FORM_ID']);
});

$migration->table('b_crm_webform_start_edit')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('FORM_ID')->notNull();
	$columns->datetime('DATE_CREATE');
	$table->addIndex('IX_B_CRM_WEBFORM_STEDIT_FID_DC', ['FORM_ID', 'DATE_CREATE']);
});

$migration->table('b_crm_webform_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TYPE', 50);
	$columns->varchar('CODE', 255);
	$columns->varchar('CAPTION', 255);
	$columns->int('FORM_ID')->notNull();
	$columns->int('GROUP_ID');
	$columns->int('SORT')->notNull()->default('100');
	$columns->char('REQUIRED', 1)->default('N');
	$columns->varchar('PLACEHOLDER', 255);
	$columns->char('MULTIPLE', 1)->notNull()->default('N');
	$columns->longText('ITEMS')->notNull();
	$columns->varchar('VALUE_TYPE', 50);
	$columns->varchar('VALUE', 255);
	$columns->longText('SETTINGS_DATA');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_FIELD', ['FORM_ID']);
});

$migration->table('b_crm_webform_field_dep')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('FORM_ID')->notNull();
	$columns->int('GROUP_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('IF_FIELD_CODE', 255);
	$columns->varchar('IF_ACTION', 20)->notNull();
	$columns->varchar('IF_VALUE', 255);
	$columns->varchar('IF_VALUE_OPERATION', 10);
	$columns->varchar('DO_FIELD_CODE', 255);
	$columns->varchar('DO_ACTION', 20)->notNull();
	$columns->varchar('DO_VALUE', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_FIELD_DEP', ['FORM_ID']);
});

$migration->table('b_crm_webform_field_dep_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('FORM_ID')->unsigned()->notNull();
	$columns->int('TYPE_ID')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_FIELD_DEP_GR', ['FORM_ID']);
});

$migration->table('b_crm_webform_field_preset')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('FORM_ID')->notNull();
	$columns->varchar('ENTITY_NAME', 25)->notNull();
	$columns->varchar('FIELD_NAME', 255)->notNull();
	$columns->varchar('VALUE', 255);
	$table->addIndex('IX_B_CRM_WEBFORM_FIELD_PRST', ['FORM_ID']);
});

$migration->table('b_crm_webform_result')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->int('FORM_ID')->notNull();
	$columns->varchar('ORIGIN_ID', 50);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_ORIGIN_ID', ['FORM_ID', 'ORIGIN_ID']);
	$table->addIndex('IX_B_CRM_WEBFORM_RESULT_FID_DI', ['FORM_ID', 'DATE_INSERT']);
});

$migration->table('b_crm_webform_result_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('FORM_ID')->notNull();
	$columns->int('RESULT_ID')->notNull();
	$columns->varchar('ENTITY_NAME', 20)->notNull();
	$columns->int('ITEM_ID')->notNull();
	$table->addIndex('IX_B_CRM_WEBFORM_RESULT_ENT', ['RESULT_ID']);
	$table->addIndex('IX_B_CRM_WEBFORM_RESULT_ENTITY_NAME_ITEM', ['ENTITY_NAME', 'ITEM_ID']);
});

$migration->table('b_crm_webform_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('FORM_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->char('WORK_TIME', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_QUEUE_FORM', ['FORM_ID']);
});

$migration->table('b_crm_webform_agreement')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('FORM_ID')->unsigned()->notNull();
	$columns->bigInt('AGREEMENT_ID')->unsigned()->notNull();
	$columns->char('CHECKED', 1)->notNull()->default('N');
	$columns->char('REQUIRED', 1)->notNull()->default('Y');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_AG_FORM', ['FORM_ID']);
});

$migration->table('b_crm_webform_landing')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('FORM_ID')->unsigned()->notNull();
	$columns->int('LANDING_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WEBFORM_LANDING_1', ['FORM_ID']);
});

$migration->table('b_crm_webpack')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 15)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$table->addPrimaryKeys(['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_crm_ads_form_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT');
	$columns->int('LINK_DIRECTION')->notNull()->default('0');
	$columns->int('WEBFORM_ID')->notNull();
	$columns->varchar('ADS_TYPE', 20)->notNull();
	$columns->varchar('ADS_ACCOUNT_ID', 50)->notNull();
	$columns->varchar('ADS_ACCOUNT_NAME', 50);
	$columns->varchar('ADS_FORM_ID', 50)->notNull();
	$columns->varchar('ADS_FORM_NAME', 50);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ADS_FORM_LINK_WI_LD', ['WEBFORM_ID', 'LINK_DIRECTION']);
});

$migration->table('b_crm_ps_rq_conv_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('COMPANY_ID')->unsigned()->notNull()->default('0');
	$columns->int('REQUISITE_ID')->unsigned()->notNull()->default('0');
	$columns->int('BANK_DETAIL_ID')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ENTITY_ID');
	$table->addIndex('IX_CRM_PS_RQ_CONV_RELATION_1', ['REQUISITE_ID']);
});

$migration->table('b_crm_act_mail_meta')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->varchar('MSG_ID_HASH', 40);
	$columns->varchar('MSG_INREPLY_HASH', 40);
	$columns->varchar('MSG_HEADER_HASH', 40);
	$table->addPrimaryKey('ACTIVITY_ID');
	$table->addIndex('IX_B_CRM_ACT_MAIL_META_1', ['MSG_ID_HASH']);
	$table->addIndex('IX_B_CRM_ACT_MAIL_META_2', ['MSG_HEADER_HASH']);
	$table->addIndex('IX_B_CRM_ACT_MAIL_META_3', ['MSG_INREPLY_HASH']);
});

$migration->table('b_crm_act_mail_body')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->mediumBlob('BODY');
	$columns->varchar('BODY_HASH', 40);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ACT_MAIL_BODY_1', ['BODY_HASH']);
});

$migration->table('b_crm_deal_category')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->date('CREATED_DATE')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->char('IS_LOCKED', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull();
	$columns->varchar('ORIGIN_ID', 255);
	$columns->varchar('ORIGINATOR_ID', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_DEAL_CAT_3', ['SORT']);
	$table->addIndex('IX_B_CRM_DEAL_CAT_4', ['IS_LOCKED', 'SORT']);
});

$migration->table('b_crm_company_act_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('TOTAL_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_ASTAT_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'TOTAL_QTY']);
	$table->addIndex('IX_B_CRM_COMPANY_ASTAT_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'TOTAL_QTY']);
});

$migration->table('b_crm_company_act_sts_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('ANSWERED_QTY')->unsigned();
	$columns->int('UNANSWERED_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_ASTS_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'ANSWERED_QTY', 'UNANSWERED_QTY']);
	$table->addIndex('IX_B_CRM_COMPANY_ASTS_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'ANSWERED_QTY', 'UNANSWERED_QTY']);
});

$migration->table('b_crm_company_act_mark_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 50)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->varchar('SOURCE_ID', 100)->notNull();
	$columns->int('NONE_QTY')->unsigned();
	$columns->int('POSITIVE_QTY')->unsigned();
	$columns->int('NEGATIVE_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'SOURCE_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_AMRS_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'SOURCE_ID', 'NONE_QTY', 'POSITIVE_QTY', 'NEGATIVE_QTY']);
	$table->addIndex('IX_B_CRM_COMPANY_AMRS_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'SOURCE_ID', 'NONE_QTY', 'POSITIVE_QTY', 'NEGATIVE_QTY']);
});

$migration->table('b_crm_company_act_stm_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('INCOMING_QTY')->unsigned();
	$columns->int('OUTGOING_QTY')->unsigned();
	$columns->int('REVERSING_QTY')->unsigned();
	$columns->int('MISSING_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_ASTM_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'INCOMING_QTY', 'OUTGOING_QTY', 'REVERSING_QTY', 'MISSING_QTY']);
	$table->addIndex('IX_B_CRM_COMPANY_ASTM_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'INCOMING_QTY', 'OUTGOING_QTY', 'REVERSING_QTY', 'MISSING_QTY']);
});

$migration->table('b_crm_company_act_sum_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('SUM_TOTAL', 18, 4);
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_ASUM_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_ASUM_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
});

$migration->table('b_crm_company_growth_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$table->addPrimaryKeys(['OWNER_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_COMPANY_GRTH_1', ['CREATED_DATE', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_GRTH_2', ['RESPONSIBLE_ID', 'CREATED_DATE', 'OWNER_ID']);
});

$migration->table('b_crm_contact_act_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('TOTAL_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_ASTAT_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'TOTAL_QTY']);
	$table->addIndex('IX_B_CRM_CONTACT_ASTAT_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'TOTAL_QTY']);
});

$migration->table('b_crm_contact_act_sts_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('ANSWERED_QTY')->unsigned();
	$columns->int('UNANSWERED_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_ASTS_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'ANSWERED_QTY', 'UNANSWERED_QTY']);
	$table->addIndex('IX_B_CRM_CONTACT_ASTS_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'ANSWERED_QTY', 'UNANSWERED_QTY']);
});

$migration->table('b_crm_contact_act_mark_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 50)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->varchar('SOURCE_ID', 100)->notNull();
	$columns->int('NONE_QTY')->unsigned();
	$columns->int('POSITIVE_QTY')->unsigned();
	$columns->int('NEGATIVE_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'SOURCE_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_AMRS_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'SOURCE_ID', 'NONE_QTY', 'POSITIVE_QTY', 'NEGATIVE_QTY']);
	$table->addIndex('IX_B_CRM_CONTACT_AMRS_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'SOURCE_ID', 'NONE_QTY', 'POSITIVE_QTY', 'NEGATIVE_QTY']);
});

$migration->table('b_crm_contact_act_stm_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->int('INCOMING_QTY')->unsigned();
	$columns->int('OUTGOING_QTY')->unsigned();
	$columns->int('REVERSING_QTY')->unsigned();
	$columns->int('MISSING_QTY')->unsigned();
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_ASTM_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'INCOMING_QTY', 'OUTGOING_QTY', 'REVERSING_QTY', 'MISSING_QTY']);
	$table->addIndex('IX_B_CRM_CONTACT_ASTM_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'INCOMING_QTY', 'OUTGOING_QTY', 'REVERSING_QTY', 'MISSING_QTY']);
});

$migration->table('b_crm_contact_act_sum_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 100)->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('SUM_TOTAL', 18, 4);
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_ASUM_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_ASUM_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
});

$migration->table('b_crm_contact_growth_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$table->addPrimaryKeys(['OWNER_ID', 'CREATED_DATE']);
	$table->addIndex('IX_B_CRM_CONTACT_GRTH_1', ['CREATED_DATE', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_GRTH_2', ['RESPONSIBLE_ID', 'CREATED_DATE', 'OWNER_ID']);
});

$migration->table('b_crm_act_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('DEADLINE_DATE')->notNull();
	$columns->varchar('PROVIDER_ID', 100)->notNull();
	$columns->varchar('PROVIDER_TYPE_ID', 50)->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->char('COMPLETED', 1);
	$columns->int('STATUS_ID')->unsigned();
	$columns->int('MARK_ID')->unsigned();
	$columns->varchar('SOURCE_ID', 100)->notNull();
	$columns->int('STREAM_ID')->unsigned();
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('SUM_TOTAL', 18, 4);
	$table->addPrimaryKeys(['OWNER_ID', 'DEADLINE_DATE', 'PROVIDER_ID', 'PROVIDER_TYPE_ID']);
	$table->addIndex('IX_B_CRM_ACT_STAT_1', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'COMPLETED']);
	$table->addIndex('IX_B_CRM_ACT_STAT_2', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'COMPLETED']);
	$table->addIndex('IX_B_CRM_ACT_STAT_5', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'STATUS_ID']);
	$table->addIndex('IX_B_CRM_ACT_STAT_6', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'STATUS_ID']);
	$table->addIndex('IX_B_CRM_ACT_STAT_7', ['RESPONSIBLE_ID', 'DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'STREAM_ID']);
	$table->addIndex('IX_B_CRM_ACT_STAT_8', ['DEADLINE_DATE', 'OWNER_ID', 'PROVIDER_ID', 'PROVIDER_TYPE_ID', 'STREAM_ID']);
});

$migration->table('b_crm_button')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY');
	$columns->char('ACTIVE', 1)->notNull()->default('N');
	$columns->int('ACTIVE_CHANGE_BY');
	$columns->datetime('ACTIVE_CHANGE_DATE');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('BACKGROUND_COLOR', 10);
	$columns->varchar('ICON_COLOR', 10);
	$columns->int('LOCATION')->notNull()->default('1');
	$columns->int('DELAY')->notNull()->default('0');
	$columns->char('LANGUAGE_ID', 2);
	$columns->text('ITEMS');
	$columns->longText('SETTINGS');
	$columns->varchar('SECURITY_CODE', 32);
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->varchar('XML_ID', 50);
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_button_avatar')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('FILE_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_button_guest')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('GID', 32)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_BUTTON_GUEST_GID', ['GID']);
});

$migration->table('b_crm_button_guest_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('GUEST_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_BUTTON_GUEST_ENT_1', ['GUEST_ID', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_utm')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('CODE', 45)->notNull();
	$columns->varchar('VALUE', 600)->notNull();
	$table->addPrimaryKeys(['ENTITY_TYPE_ID', 'ENTITY_ID', 'CODE']);
});

$migration->table('b_crm_invoice_recur')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('INVOICE_ID')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->date('NEXT_EXECUTION');
	$columns->date('LAST_EXECUTION');
	$columns->char('IS_LIMIT', 1)->notNull()->default('N');
	$columns->char('SEND_BILL', 1)->notNull()->default('N');
	$columns->int('EMAIL_ID');
	$columns->date('LIMIT_DATE');
	$columns->date('START_DATE');
	$columns->int('LIMIT_REPEAT');
	$columns->int('COUNTER_REPEAT');
	$columns->text('PARAMS');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_INVOICE_ID', ['INVOICE_ID']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_NEXT_EXECUTION', ['NEXT_EXECUTION']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_LAST_EXECUTION', ['LAST_EXECUTION']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_LIMIT_DATE', ['LIMIT_DATE']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_START_DATE', ['START_DATE']);
});

$migration->table('b_crm_entity_channel')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->tinyInt('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('ORIGIN_ID', 32);
	$columns->varchar('COMPONENT_ID', 32);
	$table->addPrimaryKeys(['ENTITY_ID', 'ENTITY_TYPE_ID', 'TYPE_ID']);
	$table->addIndex('IX_B_CRM_ENT_CHANNEL_1', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'ORIGIN_ID', 'COMPONENT_ID']);
});

$migration->table('b_crm_lead_channel_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->tinyInt('CHANNEL_TYPE_ID')->unsigned()->notNull();
	$columns->varchar('CHANNEL_ORIGIN_ID', 32);
	$columns->varchar('CHANNEL_COMPONENT_ID', 32);
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->varchar('STATUS_SEMANTIC_ID', 3);
	$table->addPrimaryKeys(['OWNER_ID', 'CHANNEL_TYPE_ID']);
	$table->addIndex('IX_B_CRM_LEAD_CHANNEL_STAT_1', ['CHANNEL_TYPE_ID', 'CHANNEL_ORIGIN_ID', 'CHANNEL_COMPONENT_ID', 'STATUS_SEMANTIC_ID', 'CREATED_DATE']);
});

$migration->table('b_crm_deal_channel_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->date('START_DATE')->notNull();
	$columns->date('END_DATE')->notNull();
	$columns->tinyInt('CHANNEL_TYPE_ID')->unsigned()->notNull();
	$columns->varchar('CHANNEL_ORIGIN_ID', 32);
	$columns->varchar('CHANNEL_COMPONENT_ID', 32);
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->char('CURRENCY_ID', 3);
	$columns->decimal('SUM_TOTAL', 18, 2);
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$table->addPrimaryKeys(['OWNER_ID', 'CHANNEL_TYPE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_CHANNEL_STAT_1', ['CHANNEL_TYPE_ID', 'CHANNEL_ORIGIN_ID', 'CHANNEL_COMPONENT_ID', 'STAGE_SEMANTIC_ID', 'START_DATE', 'END_DATE', 'SUM_TOTAL']);
});

$migration->table('b_crm_act_channel_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->date('CREATED_DATE')->notNull();
	$columns->tinyInt('CHANNEL_TYPE_ID')->unsigned()->notNull();
	$columns->varchar('CHANNEL_ORIGIN_ID', 32);
	$columns->varchar('CHANNEL_COMPONENT_ID', 32);
	$columns->int('RESPONSIBLE_ID')->unsigned()->notNull();
	$columns->char('COMPLETED', 1)->notNull()->default('N');
	$columns->tinyInt('DIRECTION')->unsigned()->notNull();
	$table->addPrimaryKeys(['OWNER_ID', 'CHANNEL_TYPE_ID']);
	$table->addIndex('IX_B_CRM_ACT_CHANNEL_STAT_1', ['CHANNEL_TYPE_ID', 'CHANNEL_ORIGIN_ID', 'CHANNEL_COMPONENT_ID', 'CREATED_DATE']);
});

$migration->table('b_crm_ext_channel_connector')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('TYPE_ID', 32)->notNull();
	$columns->varchar('NAME', 32)->notNull();
	$columns->varchar('APP_ID', 128)->notNull();
	$columns->varchar('CHANNEL_ID', 64)->notNull();
	$columns->varchar('ORIGINATOR_ID', 32)->notNull();
	$columns->varchar('EXTERNAL_SERVER_HOST', 128)->notNull();
	$table->addPrimaryKeys(['TYPE_ID', 'ORIGINATOR_ID']);
});

$migration->table('b_crm_automation_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID');
	$columns->varchar('ENTITY_STATUS', 50)->notNull();
	$columns->int('TEMPLATE_ID')->notNull()->default('0');
	$columns->text('START_RULES');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_automation_trigger')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 30)->notNull();
	$columns->int('ENTITY_TYPE_ID');
	$columns->varchar('ENTITY_STATUS', 50)->notNull();
	$columns->text('APPLY_RULES');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_automation_trigger_app')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 30)->notNull();
	$columns->datetime('DATE_CREATE');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_kanban_sort')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('PREV_ENTITY_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_KANBAN_1', ['ENTITY_TYPE_ID', 'USER_ID']);
	$table->addIndex('IX_B_CRM_KANBAN_SORT_1', ['ENTITY_ID']);
});

$migration->table('b_crm_kanban_supervisor')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->tinyInt('ENTITY_TYPE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_call_list')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->char('FILTERED', 1)->notNull()->default('N');
	$columns->varchar('GRID_ID', 255);
	$columns->text('FILTER_PARAMS');
	$columns->int('ENTITY_TYPE_ID');
	$columns->int('WEBFORM_ID');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_CALL_LIST_1', ['DATE_CREATE']);
});

$migration->table('b_crm_call_list_item')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LIST_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ELEMENT_ID')->notNull();
	$columns->varchar('STATUS_ID', 50)->notNull();
	$columns->int('CALL_ID');
	$columns->int('WEBFORM_RESULT_ID');
	$columns->int('RANK');
	$table->addPrimaryKeys(['LIST_ID', 'ENTITY_TYPE_ID', 'ELEMENT_ID']);
	$table->addIndex('IX_B_CALL_LIST_ITEM_1', ['LIST_ID', 'STATUS_ID', 'RANK']);
});

$migration->table('b_crm_call_list_created')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('LIST_ID')->notNull();
	$columns->int('ELEMENT_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CALL_LIST_CREATED_1', ['LIST_ID', 'ELEMENT_ID']);
});

$migration->table('b_crm_deal_recur')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('DEAL_ID')->notNull();
	$columns->int('BASED_ID');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->date('NEXT_EXECUTION');
	$columns->date('LAST_EXECUTION');
	$columns->char('IS_LIMIT', 1)->notNull()->default('N');
	$columns->date('LIMIT_DATE');
	$columns->date('START_DATE');
	$columns->int('LIMIT_REPEAT');
	$columns->int('COUNTER_REPEAT');
	$columns->int('CATEGORY_ID')->unsigned();
	$columns->text('PARAMS');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_DEAL_ID', ['DEAL_ID']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_BASED_ID', ['BASED_ID']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_NEXT_EXECUTION', ['NEXT_EXECUTION']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_LAST_EXECUTION', ['LAST_EXECUTION']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_LIMIT_DATE', ['LIMIT_DATE']);
	$table->addIndex('IX_B_CRM_RECUR_PARAMS_START_DATE', ['START_DATE']);
});

$migration->table('b_crm_timeline')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->int('TYPE_CATEGORY_ID')->unsigned();
	$columns->datetime('CREATED')->notNull();
	$columns->int('AUTHOR_ID')->unsigned();
	$columns->int('ASSOCIATED_ENTITY_ID');
	$columns->int('ASSOCIATED_ENTITY_TYPE_ID');
	$columns->varchar('ASSOCIATED_ENTITY_CLASS_NAME', 128);
	$columns->text('COMMENT');
	$columns->text('SETTINGS');
	$columns->varchar('SOURCE_ID', 100)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TIMELINE_2', ['ASSOCIATED_ENTITY_ID', 'ASSOCIATED_ENTITY_TYPE_ID']);
	$table->addIndex('IX_B_CRM_TIMELINE_4', ['ASSOCIATED_ENTITY_CLASS_NAME']);
	$table->addIndex('IX_B_CRM_TIMELINE_5', ['CREATED']);
	$table->addIndex('IX_B_CRM_TIMELINE_7', ['TYPE_ID', 'TYPE_CATEGORY_ID']);
	$table->addIndex('IX_B_CRM_TIMELINE_9', ['SOURCE_ID', 'TYPE_ID', 'TYPE_CATEGORY_ID']);
	$table->addIndex('IX_B_CRM_TIMELINE_10', ['ASSOCIATED_ENTITY_TYPE_ID']);
});

$migration->table('b_crm_timeline_bind')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->char('IS_FIXED', 1);
	$columns->datetime('CREATED');
	$table->addPrimaryKeys(['OWNER_ID', 'ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_B_CRM_TIMELINE_BIND_2', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'IS_FIXED']);
	$table->addIndex(
		'IX_B_CRM_TIMELINE_BIND_3',
		['ENTITY_ID', 'ENTITY_TYPE_ID', 'CREATED', 'OWNER_ID']
	);
});

$migration->table('b_crm_timeline_search')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->notNull();
	$columns->mediumText('SEARCH_CONTENT');
	$table->addPrimaryKey('OWNER_ID');
	$table->addFulltextIndex('IX_B_CRM_TIMELINE_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_wait')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$columns->datetime('START_TIME')->notNull();
	$columns->datetime('END_TIME')->notNull();
	$columns->datetime('CREATED')->notNull();
	$columns->text('DESCRIPTION');
	$columns->char('COMPLETED', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_WAIT_2', ['OWNER_ID', 'OWNER_TYPE_ID', 'COMPLETED']);
});

$migration->table('b_crm_widget_saletarget')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TYPE_ID', 15)->notNull();
	$columns->char('PERIOD_TYPE', 1)->notNull();
	$columns->int('PERIOD_YEAR')->unsigned()->notNull();
	$columns->tinyInt('PERIOD_HALF')->unsigned()->notNull()->default('0');
	$columns->tinyInt('PERIOD_QUARTER')->unsigned()->notNull()->default('0');
	$columns->tinyInt('PERIOD_MONTH')->unsigned()->notNull()->default('0');
	$columns->char('TARGET_TYPE', 1)->notNull();
	$columns->text('TARGET_GOAL')->notNull();
	$columns->datetime('CREATED')->notNull();
	$columns->datetime('MODIFIED')->notNull();
	$columns->int('AUTHOR_ID')->unsigned();
	$columns->int('EDITOR_ID')->unsigned();
	$columns->int('LEFT_BORDER')->unsigned()->notNull()->default('0');
	$columns->int('RIGHT_BORDER')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_exclusion')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->datetime('DATE_INSERT')->notNull();
	$columns->int('TYPE_ID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('COMMENT', 255);
	$table->addUniqueIndex('UK_B_CRM_EXCLUSION_TYPE_CODE', ['TYPE_ID', 'CODE']);
});

$migration->table('b_crm_lead_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LEAD_ID')->unsigned()->notNull();
	$columns->int('CONTACT_ID')->unsigned()->notNull();
	$columns->int('SORT')->notNull();
	$columns->tinyInt('ROLE_ID')->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull();
	$table->addPrimaryKeys(['LEAD_ID', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_LEAD_CONTACT_1', ['CONTACT_ID']);
});

$migration->table('b_crm_invoice_basket')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FUSER_ID')->notNull();
	$columns->int('ORDER_ID');
	$columns->int('PRODUCT_ID')->notNull();
	$columns->int('PRODUCT_PRICE_ID');
	$columns->int('PRICE_TYPE_ID');
	$columns->decimal('PRICE', 18, 4)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->decimal('BASE_PRICE', 18, 4);
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
	$columns->decimal('DISCOUNT_PRICE', 18, 4)->notNull();
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
	$table->addIndex('IXS_BASKET_USER_ID', ['FUSER_ID']);
	$table->addIndex('IXS_BASKET_ORDER_ID', ['ORDER_ID']);
	$table->addIndex('IXS_BASKET_PRODUCT_ID', ['PRODUCT_ID']);
	$table->addIndex('IXS_BASKET_PRODUCT_PRICE_ID', ['PRODUCT_PRICE_ID']);
	$table->addIndex('IXS_SBAS_XML_ID', ['PRODUCT_XML_ID', 'CATALOG_XML_ID']);
	$table->addIndex('IXS_BASKET_DATE_INSERT', ['DATE_INSERT']);
	$table->addIndex('IXS_BASKET_SET_PARENT_ID', ['SET_PARENT_ID']);
});

$migration->table('b_crm_invoice_basket_props')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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

$migration->table('b_crm_invoice')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$columns->decimal('PRICE_DELIVERY', 18, 4)->notNull()->default('0.0000');
	$columns->decimal('PRICE_PAYMENT', 18, 4)->notNull()->default('0.0000');
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
	$columns->decimal('PRICE', 18, 4)->notNull();
	$columns->char('CURRENCY', 3)->notNull();
	$columns->decimal('DISCOUNT_VALUE', 18, 4)->notNull()->default('0.0000');
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
	$columns->decimal('PS_SUM', 18, 2);
	$columns->char('PS_CURRENCY', 3);
	$columns->datetime('PS_RESPONSE_DATE');
	$columns->text('COMMENTS');
	$columns->decimal('TAX_VALUE', 18, 2)->notNull()->default('0.00');
	$columns->varchar('STAT_GID', 255);
	$columns->decimal('SUM_PAID', 18, 2)->notNull()->default('0');
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
	$table->addFulltextIndex('IX_B_CRM_INVOICE_SEARCH', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_invoice_payment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$columns->decimal('PS_SUM', 18, 4);
	$columns->char('PS_CURRENCY', 3);
	$columns->datetime('PS_RESPONSE_DATE');
	$columns->varchar('PS_RECURRING_TOKEN', 255);
	$columns->varchar('PS_CARD_NUMBER', 64);
	$columns->varchar('PAY_VOUCHER_NUM', 20);
	$columns->date('PAY_VOUCHER_DATE');
	$columns->datetime('DATE_PAY_BEFORE');
	$columns->datetime('DATE_BILL');
	$columns->varchar('XML_ID', 255);
	$columns->decimal('SUM', 18, 4)->notNull();
	$columns->decimal('PRICE_COD', 18, 4)->notNull()->default('0');
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

$migration->table('b_crm_invoice_delivery')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$columns->decimal('PRICE_DELIVERY', 18, 4);
	$columns->decimal('DISCOUNT_PRICE', 18, 4);
	$columns->decimal('BASE_PRICE_DELIVERY', 18, 4);
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

$migration->table('b_crm_invoice_dlv_basket')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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

$migration->table('b_crm_invoice_props_value')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$table->addUniqueIndex('IX_SOPV_ORD_PROP_UNI', ['ENTITY_ID', 'ENTITY_TYPE(200)', 'ORDER_PROPS_ID']);
	$table->addIndex('IX_SOPV_ORD_PROP_UNI_OLD', ['ORDER_ID', 'ORDER_PROPS_ID']);
});

$migration->table('b_crm_order_props_match')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SALE_PROP_ID')->notNull();
	$columns->int('CRM_ENTITY_TYPE')->notNull();
	$columns->int('CRM_FIELD_TYPE')->notNull();
	$columns->varchar('CRM_FIELD_CODE', 50)->notNull();
	$columns->text('SETTINGS');
	$table->addIndex('IX_BCOPM_SALE_PROP_ID', ['SALE_PROP_ID']);
	$table->addIndex('IX_BCOPM_CRM_ENTITY_TYPE', ['CRM_ENTITY_TYPE']);
});

$migration->table('b_crm_order_props_form_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->char('WORK_TIME', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BCOPFQ_PERSON_TYPE_ID', ['PERSON_TYPE_ID']);
});

$migration->table('b_crm_order_props_form')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PERSON_TYPE_ID')->notNull();
	$columns->varchar('DUPLICATE_MODE', 20);
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_order_contact_company')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('SORT')->notNull();
	$columns->tinyInt('ROLE_ID')->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull();
	$columns->varchar('XML_ID', 255);
	$table->addUniqueIndex('IX_C_OCC_ENTITY', ['ORDER_ID', 'ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_C_OCC_1', ['ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_invoice_change')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$table->addIndex('IXC_ORDER_ID_CHANGE', ['ORDER_ID']);
	$table->addIndex('IXC_TYPE_CHANGE', ['TYPE']);
});

$migration->table('b_crm_invoice_entity_marker')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$table->addIndex('IX_BSEM_ORDER_ID', ['ORDER_ID']);
});

$migration->table('b_crm_invoice_tax')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->varchar('TAX_NAME', 255)->notNull();
	$columns->decimal('VALUE', 18, 4);
	$columns->decimal('VALUE_MONEY', 18, 4)->notNull();
	$columns->int('APPLY_ORDER')->notNull();
	$columns->varchar('CODE', 50);
	$columns->char('IS_PERCENT', 1)->notNull()->default('Y');
	$columns->char('IS_IN_PRICE', 1)->notNull()->default('N');
	$table->addIndex('ixs_cit_order_id', ['ORDER_ID']);
});

$migration->table('b_crm_invoice_discount')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$table->addIndex('IX_CRM_INVOICE_DSC_HASH', ['DISCOUNT_HASH']);
});

$migration->table('b_crm_invoice_coupons')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('ORDER_DISCOUNT_ID')->notNull();
	$columns->varchar('COUPON', 32)->notNull();
	$columns->int('TYPE')->notNull();
	$columns->int('COUPON_ID')->notNull();
	$columns->text('DATA');
	$table->addIndex('IX_CRM_INVOICE_CPN_ORDER', ['ORDER_ID']);
});

$migration->table('b_crm_invoice_modules')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_DISCOUNT_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$table->addIndex('IX_CRM_INVOICE_MDL_DSC', ['ORDER_DISCOUNT_ID']);
});

$migration->table('b_crm_invoice_rules')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$table->addIndex('IX_CRM_INVOICE_RULES_ORD', ['ORDER_ID']);
});

$migration->table('b_crm_invoice_rules_descr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('ORDER_DISCOUNT_ID')->notNull();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('RULE_ID')->notNull();
	$columns->text('DESCR')->notNull();
	$table->addIndex('IX_CRM_INVOICE_RULES_DS_ORD', ['ORDER_ID']);
	$table->addIndex('IX_CRM_INVOICE_RULES_DS_RULE', ['RULE_ID']);
});

$migration->table('b_crm_invoice_discount_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ORDER_ID')->notNull();
	$columns->int('ENTITY_TYPE')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_VALUE', 255);
	$columns->mediumText('ENTITY_DATA')->notNull();
	$table->addIndex('IX_CRM_DSC_DATA_CMX', ['ORDER_ID', 'ENTITY_TYPE']);
});

$migration->table('b_crm_invoice_round')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
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
	$table->addIndex('IX_CRM_INVOICE_ROUND_ORD', ['ORDER_ID']);
});

$migration->table('b_crm_volume')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('INDICATOR_TYPE', 255)->notNull();
	$columns->int('OWNER_ID')->notNull()->default('0');
	$columns->date('DATE_CREATE');
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->timestamp('TIMESTAMP_X')->notNull()->defaultCurrentTimestamp();
	$columns->bigInt('ENTITY_SIZE')->notNull()->default('0');
	$columns->bigInt('ENTITY_COUNT')->notNull()->default('0');
	$columns->bigInt('FILE_SIZE')->notNull()->default('0');
	$columns->bigInt('FILE_COUNT')->notNull()->default('0');
	$columns->bigInt('DISK_SIZE')->notNull()->default('0');
	$columns->bigInt('DISK_COUNT')->notNull()->default('0');
	$columns->bigInt('EVENT_SIZE')->notNull()->default('0');
	$columns->bigInt('EVENT_COUNT')->notNull()->default('0');
	$columns->bigInt('ACTIVITY_SIZE')->notNull()->default('0');
	$columns->bigInt('ACTIVITY_COUNT')->notNull()->default('0');
	$columns->tinyInt('AGENT_LOCK')->notNull()->default('0');
	$columns->tinyInt('DROP_ENTITY')->notNull()->default('0');
	$columns->tinyInt('DROP_FILE')->notNull()->default('0');
	$columns->tinyInt('DROP_EVENT')->notNull()->default('0');
	$columns->tinyInt('DROP_ACTIVITY')->notNull()->default('0');
	$columns->bigInt('DROPPED_ENTITY_COUNT')->notNull()->default('0');
	$columns->bigInt('DROPPED_FILE_COUNT')->notNull()->default('0');
	$columns->bigInt('DROPPED_EVENT_COUNT')->notNull()->default('0');
	$columns->bigInt('DROPPED_ACTIVITY_COUNT')->notNull()->default('0');
	$columns->int('LAST_ID');
	$columns->int('FAIL_COUNT')->notNull()->default('0');
	$columns->varchar('LAST_ERROR', 255);
	$columns->text('FILTER');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_CRM_VL_1', ['OWNER_ID', 'INDICATOR_TYPE', 'DATE_CREATE', 'STAGE_SEMANTIC_ID']);
	$table->addIndex('IX_CRM_VL_4', ['OWNER_ID', 'INDICATOR_TYPE', 'AGENT_LOCK', 'DATE_CREATE', 'STAGE_SEMANTIC_ID']);
});

$migration->table('b_crm_field_attr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->varchar('ENTITY_SCOPE', 32)->notNull();
	$columns->tinyInt('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 64)->notNull();
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->varchar('START_PHASE', 64)->notNull();
	$columns->varchar('FINISH_PHASE', 64)->notNull();
	$columns->tinyInt('PHASE_GROUP_TYPE_ID')->unsigned()->notNull();
	$columns->char('IS_CUSTOM_FIELD', 1)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_FIELD_ATTR_1', ['ENTITY_TYPE_ID', 'ENTITY_SCOPE', 'TYPE_ID', 'FIELD_NAME']);
	$table->addIndex('IX_B_CRM_FIELD_ATTR_2', ['ENTITY_TYPE_ID', 'ENTITY_SCOPE', 'TYPE_ID', 'IS_CUSTOM_FIELD']);
	$table->addIndex('IX_B_CRM_FIELD_ATTR_3', ['FIELD_NAME', 'IS_CUSTOM_FIELD']);
});

$migration->table('b_crm_observer')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('SORT')->notNull()->default('0');
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->datetime('LAST_UPDATED_TIME')->notNull();
	$table->addPrimaryKeys(['USER_ID', 'ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_B_CRM_OBSERVER_1', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'USER_ID']);
	$table->addIndex('IX_B_CRM_OBSERVER_2', ['USER_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_cleaning')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->datetime('LAST_UPDATED_TIME')->notNull();
	$columns->int('FORCE_USER_ID');
	$table->addPrimaryKeys(['ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_B_CRM_CLEANING_1', ['CREATED_TIME']);
});

$migration->table('b_crm_order_import_product')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PRODUCT_ID')->notNull();
	$columns->varchar('SOURCE_NAME', 100)->notNull();
	$columns->varchar('SOURCE_ID', 100)->notNull();
	$columns->text('SETTINGS');
	$columns->timestamp('DATE_CREATE');
	$columns->timestamp('DATE_MODIFY')->currentTimestampOnUpdate();
	$table->addIndex('IX_B_CRM_OIP_PROD', ['PRODUCT_ID']);
	$table->addIndex('IX_B_CRM_OIP_SRC', ['SOURCE_NAME', 'SOURCE_ID']);
});

$migration->table('b_crm_tracking_site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->varchar('HOST', 255)->notNull();
	$columns->varchar('ADDRESS', 255)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('N');
	$columns->char('IS_INSTALLED', 1)->notNull()->default('N');
	$columns->text('PHONES');
	$columns->text('EMAILS');
	$columns->char('REPLACE_TEXT', 1)->notNull()->default('Y');
	$columns->char('ENRICH_TEXT', 1)->notNull()->default('Y');
	$columns->char('RESOLVE_DUPLICATES', 1)->notNull()->default('Y');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_tracking_site_b24')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LANDING_SITE_ID')->unsigned()->notNull();
	$columns->char('IS_SHOP', 1)->notNull()->default('N');
	$table->addPrimaryKeys(['LANDING_SITE_ID', 'IS_SHOP']);
});

$migration->table('b_crm_tracking_source')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('CODE', 20);
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('ICON_COLOR', 10);
	$columns->varchar('PHONE', 50);
	$columns->varchar('EMAIL', 50);
	$columns->varchar('UTM_SOURCE', 50);
	$columns->text('TAGS');
	$columns->varchar('AD_CLIENT_ID', 50);
	$columns->varchar('AD_ACCOUNT_ID', 50);
	$columns->int('CREATED_BY_ID')->notNull()->default('0');
	$columns->int('UPDATED_BY_ID')->notNull()->default('0');
	$columns->text('DESCRIPTION');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_tracking_pool')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('VALUE', 50)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_tracking_phone_number')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->varchar('VALUE', 50)->notNull();
	$columns->int('USE_CNT')->unsigned()->notNull()->default('0');
	$columns->datetime('DATE_USE');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_PHONE_NUMBER_VALUE', ['VALUE']);
});

$migration->table('b_crm_tracking_source_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('SOURCE_ID')->notNull()->default('0');
	$columns->varchar('CODE', 50)->notNull();
	$columns->varchar('VALUE', 2000)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_SRC_FLD_SID', ['SOURCE_ID']);
});

$migration->table('b_crm_tracking_expenses_pack')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_INSERT');
	$columns->int('SOURCE_ID')->notNull()->default('0');
	$columns->int('TYPE_ID')->unsigned()->notNull()->default('0');
	$columns->date('DATE_FROM');
	$columns->date('DATE_TO');
	$columns->int('ACTIONS');
	$columns->decimal('EXPENSES', 18, 2)->notNull()->default('0');
	$columns->varchar('CURRENCY_ID', 50)->notNull();
	$columns->varchar('COMMENT', 500);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_SRC_EXP_SID', ['SOURCE_ID']);
	$table->addIndex('IX_B_CRM_TRACKING_SRC_EXP_DATE', ['DATE_FROM', 'DATE_TO']);
});

$migration->table('b_crm_tracking_source_expenses')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PACK_ID')->notNull()->default('0');
	$columns->int('SOURCE_ID')->notNull()->default('0');
	$columns->int('TYPE_ID')->unsigned()->notNull()->default('0');
	$columns->date('DATE_STAT');
	$columns->int('ACTIONS');
	$columns->decimal('EXPENSES', 18, 2)->notNull()->default('0');
	$columns->varchar('CURRENCY_ID', 50)->notNull();
	$columns->varchar('COMMENT', 500);
	$columns->bigInt('SOURCE_CHILD_ID')->unsigned()->notNull()->default('0');
	$columns->bigInt('IMPRESSIONS')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_SRC_EXP_PID', ['PACK_ID']);
	$table->addIndex('IX_B_CRM_TRACKING_SRC_EXP_SID', ['SOURCE_ID']);
	$table->addIndex('IX_B_CRM_TRACKING_SRC_EXP_DST', ['DATE_STAT']);
});

$migration->table('b_crm_tracking_trace')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('DATE_CREATE');
	$columns->int('SOURCE_ID')->default('0');
	$columns->int('GUEST_ID');
	$columns->text('TAGS_RAW');
	$columns->text('PAGES_RAW');
	$columns->char('IS_MOBILE', 1)->notNull()->default('N');
	$columns->char('HAS_CHILD', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_TR_SO', ['SOURCE_ID']);
	$table->addIndex('IX_B_CRM_TRACKING_TR_DC', ['DATE_CREATE']);
});

$migration->table('b_crm_tracking_trace_tree')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('CHILD_ID')->unsigned()->notNull();
	$columns->int('PARENT_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_TREE_PID', ['PARENT_ID']);
});

$migration->table('b_crm_tracking_trace_channel')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TRACE_ID')->notNull();
	$columns->varchar('CODE', 25)->notNull();
	$columns->varchar('VALUE', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_TR_CH_CH', ['CODE']);
	$table->addIndex('IX_CRM_TRACKING_TRACE_CHANNEL_TRACE_ID', ['TRACE_ID']);
});

$migration->table('b_crm_tracking_trace_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TRACE_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TRACKING_TR_EN_EN', ['ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_TRACKING_TR_EN_TR', ['TRACE_ID']);
});

$migration->table('b_crm_tracking_source_child')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('PARENT_ID')->unsigned()->notNull()->default('0');
	$columns->bigInt('SOURCE_ID')->unsigned()->notNull();
	$columns->tinyInt('LEVEL')->unsigned()->notNull()->default('0');
	$columns->varchar('CODE', 50)->notNull();
	$columns->varchar('TITLE', 250);
	$columns->tinyInt('IS_ENABLED')->unsigned()->notNull()->default('1');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UQ_CRM_TRACKING_SOURCE_CHILD', ['SOURCE_ID', 'PARENT_ID', 'CODE']);
});

$migration->table('b_crm_tracking_trace_source')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TRACE_ID')->notNull();
	$columns->tinyInt('LEVEL')->unsigned()->notNull()->default('0');
	$columns->varchar('CODE', 50)->notNull();
	$columns->bigInt('SOURCE_CHILD_ID')->unsigned()->notNull()->default('0');
	$columns->tinyInt('PROCESSED')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UQ_CRM_TRACKING_TRACE_SRC', ['TRACE_ID', 'LEVEL']);
});

$migration->table('b_crm_recycling_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('SRC_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('SRC_ENTITY_ID')->unsigned()->notNull();
	$columns->int('SRC_RECYCLE_BIN_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_ID')->unsigned()->notNull();
	$columns->int('DST_RECYCLE_BIN_ID')->unsigned()->notNull();
	$columns->int('PREVIOUS_SRC_ENTITY_ID')->unsigned();
	$columns->int('PREVIOUS_DST_ENTITY_ID')->unsigned();
	$columns->datetime('CREATED_TIME');
	$columns->datetime('LAST_UPDATED_TIME');
	$table->addPrimaryKeys(['SRC_ENTITY_ID', 'SRC_ENTITY_TYPE_ID', 'SRC_RECYCLE_BIN_ID', 'DST_ENTITY_ID', 'DST_ENTITY_TYPE_ID', 'DST_RECYCLE_BIN_ID']);
	$table->addIndex('IX_B_CRM_RECYCLING_REL_1', ['DST_ENTITY_ID', 'DST_ENTITY_TYPE_ID', 'DST_RECYCLE_BIN_ID', 'SRC_ENTITY_ID', 'SRC_ENTITY_TYPE_ID', 'SRC_RECYCLE_BIN_ID']);
	$table->addIndex('IX_B_CRM_RECYCLING_REL_3', ['DST_RECYCLE_BIN_ID']);
	$table->addIndex('IX_B_CRM_RECYCLING_REL_4', ['SRC_RECYCLE_BIN_ID', 'DST_RECYCLE_BIN_ID']);
});

$migration->table('b_crm_order_entity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('OWNER_ID')->unsigned()->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('ORDER_ID')->unsigned()->notNull();
	$table->addPrimaryKeys(['OWNER_ID', 'OWNER_TYPE_ID', 'ORDER_ID']);
	$table->addUniqueIndex('IX_ORDER_DEAL_ID', ['ORDER_ID']);
});

$migration->table('b_crm_order_sending_channels')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_TYPE', 10)->notNull();
	$columns->varchar('CHANNEL_TYPE', 10)->notNull();
	$columns->varchar('CHANNEL_NAME', 50)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_ORDER_SENDING_CHANNEL', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_crm_ml_model_training')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODEL_NAME', 64)->notNull();
	$columns->int('RECORDS_SUCCESS')->notNull();
	$columns->int('RECORDS_FAILED')->notNull();
	$columns->datetime('DATE_START')->notNull();
	$columns->datetime('DATE_FINISH');
	$columns->varchar('STATE', 50)->notNull();
	$columns->double('AREA_UNDER_CURVE');
	$columns->int('LAST_ID');
	$table->addIndex('IX_B_CRM_ML_MODEL_TRAIN_1', ['MODEL_NAME', 'DATE_START']);
});

$migration->table('b_crm_ml_prediction_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->datetime('CREATED')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('MODEL_NAME', 64)->notNull();
	$columns->varchar('IS_PENDING', 1)->notNull()->default('N');
	$columns->varchar('ANSWER', 1);
	$columns->double('SCORE');
	$columns->double('SCORE_DELTA');
	$columns->varchar('EVENT_TYPE', 32);
	$columns->int('ASSOCIATED_ACTIVITY_ID');
	$table->addIndex('IX_B_CRM_ML_PREDICTION_HISTORY_1', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'CREATED']);
	$table->addIndex('IX_B_CRM_ML_PREDICTION_HISTORY_2', ['ASSOCIATED_ACTIVITY_ID']);
});

$migration->table('b_crm_ml_prediction_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->datetime('CREATED')->notNull();
	$columns->datetime('DELAYED_UNTIL');
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('TYPE', 32)->notNull();
	$columns->mediumText('ADDITIONAL_PARAMETERS');
	$columns->varchar('STATE', 32)->notNull();
	$columns->varchar('ERROR', 2000);
	$table->addIndex('IX_B_CRM_ML_PREDICTION_QUEUE_1', ['STATE', 'DELAYED_UNTIL']);
	$table->addIndex('IX_B_CRM_ML_PREDICTION_QUEUE_2', ['ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_rq_conv_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('CREATED')->notNull();
	$columns->int('MSEC')->unsigned()->notNull();
	$columns->varchar('TYPE', 20)->notNull();
	$columns->varchar('TAG', 255)->notNull();
	$columns->varchar('MESSAGE', 4095);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_RQ_CONV_LOG_1', ['CREATED', 'MSEC']);
	$table->addIndex('IX_B_CRM_RQ_CONV_LOG_2', ['TYPE']);
	$table->addIndex('IX_B_CRM_RQ_CONV_LOG_3', ['TAG']);
});

$migration->table('b_crm_dynamic_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('CUSTOM_SECTION_ID');
	$columns->varchar('CODE', 255);
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('TABLE_NAME', 64)->notNull();
	$columns->int('CREATED_BY')->unsigned()->notNull();
	$columns->char('IS_CATEGORIES_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_STAGES_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_BEGIN_CLOSE_DATES_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_CLIENT_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_LINK_WITH_PRODUCTS_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_CRM_TRACKING_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_MYCOMPANY_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_DOCUMENTS_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_SOURCE_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_USE_IN_USERFIELD_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_OBSERVERS_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_RECURRING_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_RECYCLEBIN_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_AUTOMATION_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_BIZ_PROC_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_SET_OPEN_PERMISSIONS', 1)->notNull()->default('Y');
	$columns->char('IS_PAYMENTS_ENABLED', 1)->notNull()->default('N');
	$columns->char('IS_COUNTERS_ENABLED', 1)->notNull()->default('N');
	$columns->datetime('CREATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->int('UPDATED_BY')->unsigned()->notNull();
	$columns->char('IS_INITIALIZED', 1)->notNull()->default('Y');
	$columns->int('DAYS_BEFORE_CLOSE');

	/*
	IMPORTANT!

	If you add a column to b_crm_dynamic_type,
	Do not forget to clear dynamic type cache in updater:

	if ($migration->context()->canUpdateDatabase())
	{
		$cache = \Bitrix\Main\Application::getInstance()->getCache();
		$cache->clean('crm_dynamic_types_collection', 'crm');
	}
	*/

	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TYPE_CSI', ['CUSTOM_SECTION_ID']);
	$table->addIndex('IX_B_CRM_TYPE_IS_INITIALIZED', ['IS_INITIALIZED']);
	$table->addIndex('IX_B_CRM_TYPE_CREATED_TIME', ['CREATED_TIME']);
	$table->addUniqueIndex('ux_crm_type_table', ['TABLE_NAME']);
	$table->addUniqueIndex('ux_b_crm_dynamic_type_entity_type_id', ['ENTITY_TYPE_ID']);
});

$migration->table('b_crm_item_category')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->char('IS_DEFAULT', 1)->notNull()->default('N');
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->varchar('CODE', 255);
	$columns->datetime('CREATED_DATE');
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('SORT')->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_ITEM_CATEGORY_CODE', ['CODE']);
	$table->addIndex('IX_B_CRM_ITEM_CATEGORY_ETD', ['ENTITY_TYPE_ID']);
});

$migration->table('b_crm_item_category_user_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned()->notNull();
	$columns->varchar('USER_FIELD_NAME', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ENTITY_TYPE_ID', ['ENTITY_TYPE_ID', 'CATEGORY_ID', 'USER_FIELD_NAME']);
	$table->addIndex('IX_B_CRM_ITEM_CATEGORY_USER_FIELD_CID', ['CATEGORY_ID']);
	$table->addIndex('IX_B_CRM_ITEM_CATEGORY_USER_FIELD_ETID_CID', ['ENTITY_TYPE_ID', 'CATEGORY_ID']);
});

$migration->table('b_crm_assigned')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ASSIGNED_BY')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ASSIGNED_ENTITY', ['ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ASSIGNED_ASSIGNED_BY', ['ASSIGNED_BY']);
});

$migration->table('b_crm_entity_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('CONTACT_ID')->unsigned()->notNull();
	$columns->int('SORT')->notNull();
	$columns->tinyInt('ROLE_ID')->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull()->default('N');
	$table->addPrimaryKeys(['ENTITY_TYPE_ID', 'ENTITY_ID', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_ENTITY_CONTACT_1', ['CONTACT_ID', 'ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ENTITY_CONTACT_2', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'IS_PRIMARY', 'CONTACT_ID']);
	$table->addIndex('IX_B_CRM_ENTITY_CONTACT_3', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'SORT', 'CONTACT_ID']);
});

$migration->table('b_crm_entity_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('SRC_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('SRC_ENTITY_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('DST_ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('RELATION_TYPE', 20)->notNull();
	$table->addPrimaryKeys(['SRC_ENTITY_TYPE_ID', 'SRC_ENTITY_ID', 'DST_ENTITY_TYPE_ID', 'DST_ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ENT_REL_DST_ENT_ID', ['DST_ENTITY_ID']);
});

$migration->table('b_crm_entity_stage_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('TYPE_ID')->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->date('CREATED_DATE');
	$columns->date('EFFECTIVE_DATE');
	$columns->date('START_DATE')->notNull();
	$columns->date('END_DATE')->notNull();
	$columns->int('PERIOD_YEAR')->notNull();
	$columns->int('PERIOD_QUARTER')->notNull();
	$columns->int('PERIOD_MONTH')->notNull();
	$columns->int('START_PERIOD_YEAR')->notNull();
	$columns->int('START_PERIOD_QUARTER')->notNull();
	$columns->int('START_PERIOD_MONTH')->notNull();
	$columns->int('END_PERIOD_YEAR')->notNull();
	$columns->int('END_PERIOD_QUARTER')->notNull();
	$columns->int('END_PERIOD_MONTH')->notNull();
	$columns->int('RESPONSIBLE_ID')->notNull();
	$columns->int('CATEGORY_ID');
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->varchar('STAGE_ID', 50);
	$columns->char('IS_LOST', 1);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_crm_entity_stage_history_owner_type_id_owner_id', ['OWNER_TYPE_ID', 'OWNER_ID']);
	$table->addIndex('IX_B_CRM_ENTITY_STAGE_HISTORY_1', ['OWNER_TYPE_ID', 'CREATED_TIME']);
	$table->addIndex('IX_B_CRM_ENTITY_STAGE_HISTORY_2', ['CREATED_TIME']);
});

$migration->table('b_crm_entity_stage_history_with_supposed')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->datetime('CREATED_TIME');
	$columns->date('CREATED_DATE');
	$columns->int('CATEGORY_ID');
	$columns->varchar('STAGE_SEMANTIC_ID', 3);
	$columns->varchar('STAGE_ID', 50);
	$columns->char('IS_LOST', 1);
	$columns->char('IS_SUPPOSED', 1)->notNull()->default('N');
	$columns->date('LAST_UPDATE_DATE');
	$columns->date('CLOSE_DATE')->notNull()->default('3000-12-12');
	$columns->int('SPENT_TIME');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_b_crm_entity_stage_history_with_supposed_2', ['OWNER_TYPE_ID', 'OWNER_ID', 'CREATED_TIME']);
});

$migration->table('b_crm_company_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('COMPANY_ID')->notNull();
	$columns->text('SEARCH_CONTENT');
	$table->addPrimaryKey('COMPANY_ID');
	$table->addFulltextIndex('ixf_b_crm_company_index_1', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_contact_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CONTACT_ID')->notNull();
	$columns->text('SEARCH_CONTENT');
	$table->addPrimaryKey('CONTACT_ID');
	$table->addFulltextIndex('ixf_b_crm_contact_index_1', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_lead_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LEAD_ID')->notNull();
	$columns->text('SEARCH_CONTENT');
	$table->addPrimaryKey('LEAD_ID');
	$table->addFulltextIndex('ixf_b_crm_lead_index_1', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_deal_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DEAL_ID')->notNull();
	$columns->text('SEARCH_CONTENT');
	$table->addPrimaryKey('DEAL_ID');
	$table->addFulltextIndex('ixf_b_crm_deal_index_1', ['SEARCH_CONTENT']);
});

$migration->table('b_crm_dp_autosearch_user_settings')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('STATUS_ID')->notNull()->default('0');
	$columns->int('EXEC_INTERVAL')->notNull()->default('0');
	$columns->datetime('LAST_EXEC_TIME');
	$columns->datetime('NEXT_EXEC_TIME');
	$columns->text('PROGRESS_DATA');
	$columns->char('IS_MERGE_ENABLED', 1)->notNull()->default('N');
	$columns->char('CHECK_CHANGED_ONLY', 1)->notNull()->default('N');
	$columns->varchar('MERGE_ID', 8);
	$columns->datetime('MERGE_ACTIVITY_DATE');
	$table->addPrimaryKeys(['USER_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_dp_automatic_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->varchar('MATCH_HASH', 32)->notNull();
	$columns->text('MATCHES');
	$columns->int('QUANTITY')->unsigned()->notNull();
	$columns->varchar('SCOPE', 6)->notNull()->default('');
	$columns->int('STATUS_ID')->unsigned();
	$columns->char('IS_DIRTY', 1)->notNull()->default('N');
	$columns->int('ROOT_ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('ROOT_ENTITY_NAME', 256)->notNull();
	$columns->varchar('ROOT_ENTITY_TITLE', 256)->notNull();
	$columns->varchar('ROOT_ENTITY_PHONE', 256)->notNull();
	$columns->varchar('ROOT_ENTITY_EMAIL', 256)->notNull();
	$columns->varchar('ROOT_ENTITY_RQ_INN', 15)->notNull()->default('');
	$columns->varchar('ROOT_ENTITY_RQ_OGRN', 13)->notNull()->default('');
	$columns->varchar('ROOT_ENTITY_RQ_OGRNIP', 15)->notNull()->default('');
	$columns->varchar('ROOT_ENTITY_RQ_BIN', 12)->notNull()->default('');
	$columns->varchar('ROOT_ENTITY_RQ_EDRPOU', 10);
	$columns->varchar('ROOT_ENTITY_RQ_VAT_ID', 20)->notNull()->default('');
	$columns->varchar('ROOT_ENTITY_RQ_ACC_NUM', 34)->notNull()->default('');
	$columns->varchar('ROOT_ENTITY_RQ_IBAN', 34)->notNull()->default('');
	$columns->varchar('ROOT_ENTITY_RQ_IIK', 20)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CRM_DP_AUTOMATIC_INDEX_1', ['MATCH_HASH', 'USER_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_CRM_DP_AUTOMATIC_INDEX_2', ['USER_ID', 'ENTITY_TYPE_ID', 'TYPE_ID', 'SCOPE']);
	$table->addIndex('IX_CRM_DP_AUTOMATIC_INDEX_3', ['ENTITY_TYPE_ID', 'ROOT_ENTITY_ID']);
});

$migration->table('b_crm_originator')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ORIGINATOR_ID', 255)->notNull();
	$columns->int('ICON_ID');
	$table->addPrimaryKey('ORIGINATOR_ID');
});

$migration->table('b_crm_order_payment_stage')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PAYMENT_ID')->notNull();
	$columns->varchar('STAGE', 255)->notNull();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('PAYMENT_ID');
});

$migration->table('b_crm_workflow_entity_stage')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('WORKFLOW_CODE', 255)->notNull();
	$columns->varchar('STAGE', 255)->notNull();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$columns->int('UPDATED_BY');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_ENTITY_ID_WORKFLOW_CODE', ['ENTITY_ID', 'WORKFLOW_CODE']);
});

$migration->table('b_crm_access_attr_lead')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->char('IS_OPENED', 1)->notNull();
	$columns->char('IS_ALWAYS_READABLE', 1)->notNull();
	$columns->varchar('PROGRESS_STEP', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_ACC_ATTR_LEAD_1', ['ENTITY_ID', 'USER_ID', 'IS_OPENED', 'IS_ALWAYS_READABLE', 'PROGRESS_STEP']);
	$table->addIndex('IX_ACC_ATTR_LEAD_2', ['USER_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_LEAD_3', ['IS_OPENED', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_LEAD_4', ['ENTITY_ID', 'IS_OPENED']);
	$table->addIndex('IX_ACC_ATTR_LEAD_5', ['IS_ALWAYS_READABLE', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_LEAD_6', ['ENTITY_ID', 'IS_ALWAYS_READABLE']);
	$table->addIndex('IX_ACC_ATTR_LEAD_7', ['CATEGORY_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_LEAD_8', ['ENTITY_ID', 'CATEGORY_ID', 'USER_ID']);
	$table->addIndex('IX_ACC_ATTR_LEAD_9', ['CATEGORY_ID', 'USER_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_access_attr_deal')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->char('IS_OPENED', 1)->notNull();
	$columns->char('IS_ALWAYS_READABLE', 1)->notNull();
	$columns->varchar('PROGRESS_STEP', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_ACC_ATTR_DEAL_1', ['ENTITY_ID', 'USER_ID', 'IS_OPENED', 'IS_ALWAYS_READABLE', 'PROGRESS_STEP']);
	$table->addIndex('IX_ACC_ATTR_DEAL_2', ['USER_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_DEAL_3', ['IS_OPENED', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_DEAL_4', ['ENTITY_ID', 'IS_OPENED']);
	$table->addIndex('IX_ACC_ATTR_DEAL_5', ['IS_ALWAYS_READABLE', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_DEAL_6', ['ENTITY_ID', 'IS_ALWAYS_READABLE']);
	$table->addIndex('IX_ACC_ATTR_DEAL_7', ['CATEGORY_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_DEAL_8', ['ENTITY_ID', 'CATEGORY_ID', 'USER_ID']);
	$table->addIndex('IX_ACC_ATTR_DEAL_9', ['CATEGORY_ID', 'USER_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_access_attr_contact')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->char('IS_OPENED', 1)->notNull();
	$columns->char('IS_ALWAYS_READABLE', 1)->notNull();
	$columns->varchar('PROGRESS_STEP', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_ACC_ATTR_CONTACT_1', ['ENTITY_ID', 'USER_ID', 'IS_OPENED', 'IS_ALWAYS_READABLE', 'PROGRESS_STEP']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_2', ['USER_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_3', ['IS_OPENED', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_4', ['ENTITY_ID', 'IS_OPENED']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_5', ['IS_ALWAYS_READABLE', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_6', ['ENTITY_ID', 'IS_ALWAYS_READABLE']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_7', ['CATEGORY_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_8', ['ENTITY_ID', 'CATEGORY_ID', 'USER_ID']);
	$table->addIndex('IX_ACC_ATTR_CONTACT_9', ['CATEGORY_ID', 'USER_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_access_attr_company')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->char('IS_OPENED', 1)->notNull();
	$columns->char('IS_ALWAYS_READABLE', 1)->notNull();
	$columns->varchar('PROGRESS_STEP', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_ACC_ATTR_COMPANY_1', ['ENTITY_ID', 'USER_ID', 'IS_OPENED', 'IS_ALWAYS_READABLE', 'PROGRESS_STEP']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_2', ['USER_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_3', ['IS_OPENED', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_4', ['ENTITY_ID', 'IS_OPENED']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_5', ['IS_ALWAYS_READABLE', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_6', ['ENTITY_ID', 'IS_ALWAYS_READABLE']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_7', ['CATEGORY_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_8', ['ENTITY_ID', 'CATEGORY_ID', 'USER_ID']);
	$table->addIndex('IX_ACC_ATTR_COMPANY_9', ['CATEGORY_ID', 'USER_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_access_attr_quote')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->char('IS_OPENED', 1)->notNull();
	$columns->char('IS_ALWAYS_READABLE', 1)->notNull();
	$columns->varchar('PROGRESS_STEP', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_ACC_ATTR_QUOTE_1', ['ENTITY_ID', 'USER_ID', 'IS_OPENED', 'IS_ALWAYS_READABLE', 'PROGRESS_STEP']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_2', ['USER_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_3', ['IS_OPENED', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_4', ['ENTITY_ID', 'IS_OPENED']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_5', ['IS_ALWAYS_READABLE', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_6', ['ENTITY_ID', 'IS_ALWAYS_READABLE']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_7', ['CATEGORY_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_8', ['ENTITY_ID', 'CATEGORY_ID', 'USER_ID']);
	$table->addIndex('IX_ACC_ATTR_QUOTE_9', ['CATEGORY_ID', 'USER_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_access_attr_order')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('CATEGORY_ID')->unsigned()->notNull();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->char('IS_OPENED', 1)->notNull();
	$columns->char('IS_ALWAYS_READABLE', 1)->notNull();
	$columns->varchar('PROGRESS_STEP', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_ACC_ATTR_ORDER_1', ['ENTITY_ID', 'USER_ID', 'IS_OPENED', 'IS_ALWAYS_READABLE', 'PROGRESS_STEP']);
	$table->addIndex('IX_ACC_ATTR_ORDER_2', ['USER_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_ORDER_3', ['IS_OPENED', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_ORDER_4', ['ENTITY_ID', 'IS_OPENED']);
	$table->addIndex('IX_ACC_ATTR_ORDER_5', ['IS_ALWAYS_READABLE', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_ORDER_6', ['ENTITY_ID', 'IS_ALWAYS_READABLE']);
	$table->addIndex('IX_ACC_ATTR_ORDER_7', ['CATEGORY_ID', 'ENTITY_ID']);
	$table->addIndex('IX_ACC_ATTR_ORDER_8', ['ENTITY_ID', 'CATEGORY_ID', 'USER_ID']);
	$table->addIndex('IX_ACC_ATTR_ORDER_9', ['CATEGORY_ID', 'USER_ID', 'ENTITY_ID']);
});

$migration->table('b_crm_webform_ads_field_mapping')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('FORM_LINK_ID')->notNull();
	$columns->varchar('CRM_FIELD_KEY', 255)->notNull();
	$columns->varchar('ADS_FIELD_KEY', 64)->notNull();
	$columns->longText('ITEMS')->notNull();
	$table->addIndex('IX_B_CRM_WEBFORM_ADS_FIELD_MAPPING', ['FORM_LINK_ID']);
});

$migration->table('b_crm_shipment_realization')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('SHIPMENT_ID')->unsigned()->notNull();
	$columns->char('IS_REALIZATION', 1)->notNull()->default('Y');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_SHIPMENT_REALIZATION_SHIPMENT_ID', ['SHIPMENT_ID']);
});

$migration->table('b_crm_product_reservation_map')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PRODUCT_ROW_ID')->unsigned()->notNull();
	$columns->int('BASKET_RESERVATION_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_PRODUCT_RESERVATION_MAP_PRODUCT_ROW_ID', ['PRODUCT_ROW_ID']);
	$table->addIndex('IX_B_CRM_PRODUCT_RESERVATION_MAP_BASKET_RESERVATION_ID', ['BASKET_RESERVATION_ID']);
});

$migration->table('b_crm_product_row_reservation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROW_ID')->unsigned()->notNull();
	$columns->double('RESERVE_QUANTITY');
	$columns->datetime('DATE_RESERVE_END');
	$columns->int('STORE_ID')->unsigned();
	$columns->char('IS_AUTO', 1);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_PRODUCT_ROW_ID', ['ROW_ID']);
});

$migration->table('b_crm_act_incoming_channel')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->notNull();
	$columns->char('COMPLETED', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ACT_INCOMING_1', ['RESPONSIBLE_ID', 'COMPLETED']);
	$table->addUniqueIndex('IX_B_CRM_ACT_INCOMING_2', ['ACTIVITY_ID']);
});

$migration->table('b_crm_entity_uncompleted_act')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->int('RESPONSIBLE_ID')->notNull();
	$columns->datetime('MIN_DEADLINE')->notNull();
	$columns->char('IS_INCOMING_CHANNEL', 1)->notNull()->default('N');
	$columns->char('HAS_ANY_INCOMING_CHANEL', 1)->notNull()->default('N');
	$columns->datetime('MIN_LIGHT_COUNTER_AT');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_UNCOMPLETED_ACT_1', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'RESPONSIBLE_ID', 'IS_INCOMING_CHANNEL', 'MIN_DEADLINE']);
	$table->addIndex('IX_B_CRM_UNCOMPLETED_ACT_2', ['RESPONSIBLE_ID', 'ENTITY_TYPE_ID', 'IS_INCOMING_CHANNEL', 'MIN_DEADLINE']);
	$table->addIndex('IX_B_CRM_UNCOMPLETED_ACT_3', ['RESPONSIBLE_ID', 'ENTITY_TYPE_ID', 'HAS_ANY_INCOMING_CHANEL', 'MIN_DEADLINE']);
	$table->addIndex('IX_B_CRM_UNCOMPLETED_ACT_4', ['ENTITY_TYPE_ID', 'HAS_ANY_INCOMING_CHANEL', 'MIN_DEADLINE']);
});

$migration->table('b_crm_automation_qr')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 32)->notNull();
	$columns->varchar('OWNER_ID', 128)->notNull();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->text('DESCRIPTION');
	$columns->text('COMPLETE_ACTION_LABEL');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ATM_QR_1', ['ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ATM_QR_2', ['OWNER_ID']);
});

$migration->table('b_crm_field_set')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->smallInt('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->smallInt('CLIENT_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('RQ_PRESET_ID')->unsigned()->notNull();
	$columns->text('FIELDS');
	$columns->varchar('CODE', 25)->notNull()->default('');
	$columns->varchar('TITLE', 25)->notNull()->default('');
	$columns->tinyInt('IS_SYSTEM')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
});

$migration->table('b_crm_item_badge')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->datetime('CREATED_DATE')->notNull();
	$columns->varchar('TYPE', 30)->notNull();
	$columns->varchar('VALUE', 30)->notNull();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('SOURCE_PROVIDER_ID', 30)->notNull();
	$columns->int('SOURCE_ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('SOURCE_ENTITY_ID')->unsigned()->notNull();
	$columns->text('SETTINGS');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ITEM_BADGE_ETID_EID', ['ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ITEM_BADGE_SPID_SETID_SEID', ['SOURCE_PROVIDER_ID', 'SOURCE_ENTITY_TYPE_ID', 'SOURCE_ENTITY_ID']);
	$table->addIndex('IX_B_CRM_ITEM_BADGE_3', ['CREATED_DATE']);
});

$migration->table('b_crm_counter_calculated_time')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->datetime('CALCULATED_AT')->notNull();
	$columns->char('IS_CALCULATING', 1)->notNull()->default('N');
	$columns->datetime('CALCULATION_STARTED_AT');
	$table->addPrimaryKeys(['USER_ID', 'CODE']);
});

$migration->table('b_crm_store_document_contractor')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$table->addUniqueIndex('IX_DOCUMENT_ENTITY', ['DOCUMENT_ID', 'ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_DOCUMENT_ID', ['DOCUMENT_ID']);
	$table->addIndex('IX_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_contractor_conversion')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CONTRACTOR_ID')->notNull();
	$columns->int('ENTITY_ID')->unsigned();
	$columns->int('ENTITY_TYPE_ID')->unsigned();
	$columns->char('SUCCESS', 1);
	$columns->text('ERRORS');
	$table->addPrimaryKey('CONTRACTOR_ID');
});

$migration->table('b_crm_act_ping_offsets')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->int('OFFSET')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ACT_PO_1', ['ACTIVITY_ID']);
});

$migration->table('b_crm_act_ping_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->datetime('PING_DATETIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_ACT_PQ_1', ['ACTIVITY_ID']);
	$table->addIndex('IX_B_CRM_ACT_PQ_2', ['PING_DATETIME']);
});

$migration->table('b_crm_timeline_note')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('ITEM_ID')->unsigned()->notNull();
	$columns->tinyInt('ITEM_TYPE')->unsigned()->notNull();
	$columns->text('TEXT')->notNull();
	$columns->int('CREATED_BY_ID')->unsigned()->notNull();
	$columns->datetime('CREATED_TIME')->notNull();
	$columns->int('UPDATED_BY_ID')->unsigned()->notNull();
	$columns->datetime('UPDATED_TIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ITEM_ID', ['ITEM_ID', 'ITEM_TYPE']);
});

$migration->table('b_crm_entity_countable_act')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('ENTITY_ASSIGNED_BY_ID')->notNull();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->int('ACTIVITY_RESPONSIBLE_ID')->notNull();
	$columns->datetime('ACTIVITY_DEADLINE')->notNull();
	$columns->char('ACTIVITY_IS_INCOMING_CHANNEL', 1)->notNull()->default('N');
	$columns->datetime('LIGHT_COUNTER_AT');
	$columns->datetime('DEADLINE_EXPIRED_AT');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_COUNTABLE_ACT_ID', ['ENTITY_ID', 'ENTITY_TYPE_ID', 'ACTIVITY_ID']);
	$table->addIndex('IX_B_CRM_COUNTABLE_ACT_1', ['ACTIVITY_RESPONSIBLE_ID', 'ENTITY_TYPE_ID', 'ACTIVITY_IS_INCOMING_CHANNEL', 'ACTIVITY_DEADLINE', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_COUNTABLE_ACT_2', ['ENTITY_ASSIGNED_BY_ID', 'ENTITY_TYPE_ID', 'ACTIVITY_IS_INCOMING_CHANNEL', 'ACTIVITY_DEADLINE', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_COUNTABLE_ACT_3', ['ENTITY_TYPE_ID', 'ACTIVITY_IS_INCOMING_CHANNEL', 'ACTIVITY_DEADLINE', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_COUNTABLE_ACT_4', ['ACTIVITY_ID']);
	$table->addIndex('IX_B_CRM_COUNTABLE_ACT_5', ['LIGHT_COUNTER_AT']);
});

$migration->table('b_crm_custom_badge')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('TITLE', 4000)->notNull();
	$columns->varchar('VALUE', 4000)->notNull();
	$columns->varchar('TYPE', 20)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_CUSTOM_BADGE_CODE', ['CODE']);
	$table->addIndex('IX_B_CRM_CUSTOM_BADGE_TYPE', ['TYPE']);
});

$migration->table('b_crm_timeline_custom_icon')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$columns->int('FILE_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_TIMELINE_CUSTOM_ICON_CODE', ['CODE']);
});

$migration->table('b_crm_timeline_custom_logo')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('CODE', 255)->notNull();
	$columns->int('FILE_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_TIMELINE_CUSTOM_LOGO_CODE', ['CODE']);
});

$migration->table('b_crm_field_content_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 255)->notNull();
	$columns->int('CONTENT_TYPE_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_CRM_FIELD_CONTENT_TYPE_ENTITY', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'FIELD_NAME']);
});

$migration->table('b_crm_act_counter_light')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->datetime('LIGHT_COUNTER_AT')->notNull();
	$columns->char('IS_LIGHT_COUNTER_NOTIFIED', 1)->default('N');
	$table->addPrimaryKey('ACTIVITY_ID');
	$table->addIndex('IX_B_CRM_ACT_COUNTER_LIGHT_2', ['IS_LIGHT_COUNTER_NOTIFIED', 'LIGHT_COUNTER_AT']);
	$table->addIndex('IX_B_CRM_ACT_COUNTER_LIGHT_3', ['LIGHT_COUNTER_AT']);
});

$migration->table('b_crm_webform_limit')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->timestamp('DATE_STAT')->notNull();
	$columns->varchar('TYPE', 25)->notNull();
	$columns->varchar('CODE', 25)->notNull();
	$columns->int('VALUE')->notNull()->default('0');
	$columns->tinyInt('NOTIFIED')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('DATE_STAT', ['DATE_STAT', 'TYPE', 'CODE']);
});

$migration->table('b_crm_agent_contract_contractor')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CONTRACT_ID')->unsigned()->notNull();
	$columns->int('ENTITY_ID')->unsigned()->notNull();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$table->addUniqueIndex('IX_DOCUMENT_ENTITY', ['CONTRACT_ID', 'ENTITY_ID', 'ENTITY_TYPE_ID']);
	$table->addIndex('IX_CONTRACT_ID', ['CONTRACT_ID']);
	$table->addIndex('IX_ENTITY', ['ENTITY_ID', 'ENTITY_TYPE_ID']);
});

$migration->table('b_crm_act_fastsearch')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$columns->datetime('CREATED')->notNull();
	$columns->datetime('DEADLINE');
	$columns->int('RESPONSIBLE_ID')->notNull();
	$columns->char('COMPLETED', 1)->notNull();
	$columns->varchar('ACTIVITY_TYPE', 210)->notNull();
	$columns->tinyInt('ACTIVITY_KIND')->notNull();
	$columns->int('AUTHOR_ID')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ACTIVITY_ID');
	$table->addIndex('IX_B_CRM_ACT_FASTSEARCH_1', ['CREATED']);
});

$migration->table('b_crm_lead_fields_context')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LEAD_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 50)->notNull();
	$columns->varchar('VALUE_ID', 20)->notNull();
	$columns->tinyInt('CONTEXT')->unsigned()->notNull();
	$table->addPrimaryKeys(['LEAD_ID', 'FIELD_NAME', 'VALUE_ID']);
	$table->addIndex('IX_B_CRM_LEAD_FIELDS_CONTEXT_FIELD_NAME', ['FIELD_NAME']);
});

$migration->table('b_crm_deal_fields_context')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DEAL_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 50)->notNull();
	$columns->varchar('VALUE_ID', 20)->notNull();
	$columns->tinyInt('CONTEXT')->unsigned()->notNull();
	$table->addPrimaryKeys(['DEAL_ID', 'FIELD_NAME', 'VALUE_ID']);
	$table->addIndex('IX_B_CRM_DEAL_FIELDS_CONTEXT_FIELD_NAME', ['FIELD_NAME']);
});

$migration->table('b_crm_contact_fields_context')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CONTACT_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 50)->notNull();
	$columns->varchar('VALUE_ID', 20)->notNull();
	$columns->tinyInt('CONTEXT')->unsigned()->notNull();
	$table->addPrimaryKeys(['CONTACT_ID', 'FIELD_NAME', 'VALUE_ID']);
	$table->addIndex('IX_B_CRM_CONTACT_FIELDS_CONTEXT_FIELD_NAME', ['FIELD_NAME']);
});

$migration->table('b_crm_company_fields_context')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('COMPANY_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 50)->notNull();
	$columns->varchar('VALUE_ID', 20)->notNull();
	$columns->tinyInt('CONTEXT')->unsigned()->notNull();
	$table->addPrimaryKeys(['COMPANY_ID', 'FIELD_NAME', 'VALUE_ID']);
	$table->addIndex('IX_B_CRM_COMPANY_FIELDS_CONTEXT_FIELD_NAME', ['FIELD_NAME']);
});

$migration->table('b_crm_quote_fields_context')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('QUOTE_ID')->unsigned()->notNull();
	$columns->varchar('FIELD_NAME', 50)->notNull();
	$columns->varchar('VALUE_ID', 20)->notNull();
	$columns->tinyInt('CONTEXT')->unsigned()->notNull();
	$table->addPrimaryKeys(['QUOTE_ID', 'FIELD_NAME', 'VALUE_ID']);
	$table->addIndex('IX_B_CRM_QUOTE_FIELDS_CONTEXT_FIELD_NAME', ['FIELD_NAME']);
});

$migration->table('b_crm_ai_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->bigInt('ENTITY_ID')->notNull();
	$columns->varchar('HASH', 32)->notNull();
	$columns->int('TYPE_ID')->notNull();
	$columns->bigInt('PARENT_ID')->notNull()->default('0');
	$columns->int('STORAGE_TYPE_ID')->notNull()->default('0');
	$columns->bigInt('STORAGE_ELEMENT_ID')->notNull()->default('0');
	$columns->bigInt('USER_ID')->notNull()->default('0');
	$columns->varchar('EXECUTION_STATUS', 255)->notNull();
	$columns->varchar('ERROR_CODE', 255);
	$columns->text('ERROR_MESSAGE');
	$columns->int('RETRY_COUNT')->notNull()->default('0');
	$columns->varchar('OPERATION_STATUS', 255);
	$columns->longText('RESULT');
	$columns->char('IS_FEEDBACK_CONSENT_GRANTED', 1)->notNull()->default('N');
	$columns->char('IS_FEEDBACK_SENT', 1)->notNull()->default('N');
	$columns->char('IS_MANUAL_LAUNCH', 1)->notNull()->default('Y');
	$columns->datetime('CREATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('FINISHED_TIME');
	$columns->char('LANGUAGE_ID', 2);
	$columns->bigInt('ENGINE_ID')->notNull()->default('0');
	$columns->int('NEXT_TYPE_ID');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_CRM_AI_QUEUE_HASH', ['HASH']);
	$table->addIndex('IX_CRM_AI_QUEUE_ENTITY_AND_TYPE', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'TYPE_ID']);
	$table->addIndex('IX_CRM_AI_QUEUE_PARENT', ['PARENT_ID']);
	$table->addIndex('IX_CRM_AI_QUEUE_USER', ['USER_ID']);
});

$migration->table('b_crm_ai_quality_assessment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->tinyInt('ACTIVITY_TYPE')->notNull();
	$columns->bigInt('ACTIVITY_ID')->notNull();
	$columns->bigInt('ASSESSMENT_SETTING_ID')->notNull();
	$columns->bigInt('JOB_ID')->notNull();
	$columns->text('PROMPT')->notNull();
	$columns->int('ASSESSMENT')->notNull()->default('0');
	$columns->int('ASSESSMENT_AVG')->notNull()->default('0');
	$columns->char('USE_IN_RATING', 1)->notNull()->default('Y');
	$columns->bigInt('RATED_USER_ID')->notNull()->default('0');
	$columns->bigInt('MANAGER_USER_ID')->notNull()->default('0');
	$columns->bigInt('RATED_USER_CHAT_ID')->notNull()->default('0');
	$columns->bigInt('MANAGER_USER_CHAT_ID')->notNull()->default('0');
	$columns->mediumText('CRITERIA_DATA');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CRM_AI_QA_RUI_A', ['RATED_USER_ID', 'ASSESSMENT']);
	$table->addIndex('IX_CRM_AI_QA_MANAGER_USER', ['MANAGER_USER_ID']);
	$table->addIndex('IX_CRM_AI_QA_CREATED_AT', ['CREATED_AT']);
	$table->addIndex('IX_CRM_AI_QA_ACTIVITY', ['ACTIVITY_TYPE', 'ACTIVITY_ID']);
	$table->addIndex('IX_CRM_AI_QA_SETTING_RATING_TYPE', ['ASSESSMENT_SETTING_ID', 'USE_IN_RATING', 'ACTIVITY_TYPE']);
});

$migration->table('b_crm_terminal_payment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PAYMENT_ID')->notNull();
	$table->addPrimaryKey('PAYMENT_ID');
});

$migration->table('b_crm_act_sms_placeholder')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('ENTITY_TYPE_ID')->unsigned()->notNull();
	$columns->smallInt('ENTITY_CATEGORY_ID');
	$columns->int('TEMPLATE_ID')->unsigned()->notNull();
	$columns->varchar('PLACEHOLDER_ID', 255)->notNull();
	$columns->varchar('FIELD_NAME', 255);
	$columns->varchar('FIELD_ENTITY_TYPE', 255);
	$columns->varchar('FIELD_VALUE', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_CRM_ACT_SMS_PLACEHOLDER_ETI_ECI_TI', ['ENTITY_TYPE_ID', 'ENTITY_CATEGORY_ID', 'TEMPLATE_ID']);
	$table->addIndex('IX_CRM_ACT_SMS_PLACEHOLDER_ETI_ECI_TI_PI', ['ENTITY_TYPE_ID', 'ENTITY_CATEGORY_ID', 'TEMPLATE_ID', 'PLACEHOLDER_ID']);
});

$migration->table('b_crm_automated_solution')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('INTRANET_CUSTOM_SECTION_ID')->unsigned();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->tinyInt('SOURCE_ID')->notNull()->default('0');
	$columns->int('SORT')->notNull();
	$columns->datetime('CREATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY')->unsigned()->notNull();
	$columns->int('UPDATED_BY')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_AUTOMATED_SOLUTION_CODE', ['CODE']);
	$table->addIndex('IX_B_CRM_AUTOMATED_SOLUTION_ICSI', ['INTRANET_CUSTOM_SECTION_ID']);
});

$migration->table('b_crm_multi_value_store')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('TYPE_KEY', 255)->notNull();
	$columns->varchar('VALUE', 255)->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKeys(['TYPE_KEY', 'VALUE']);
	$table->addIndex('IX_CRM_MULTI_VALUE_STORE_TK_CA', ['TYPE_KEY', 'CREATED_AT']);
});

$migration->table('b_crm_timeline_rest_app_layout_blocks')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->smallInt('ITEM_TYPE')->unsigned()->notNull();
	$columns->int('ITEM_ID')->unsigned()->notNull();
	$columns->varchar('CLIENT_ID', 128)->notNull();
	$columns->text('LAYOUT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CRM_TIMELINE_REST_APP_LAYOUT_BLOCKS_CLIENT_ID', ['CLIENT_ID']);
	$table->addIndex('IX_B_CRM_TIMELINE_REST_APP_LAYOUT_BLOCKS_BINDINGS', ['ITEM_TYPE', 'ITEM_ID']);
	$table->addIndex('IX_B_CRM_TIMELINE_REST_APP_LAYOUT_BLOCKS_BINDINGS_WITH_CLIENT_ID', ['ITEM_TYPE', 'ITEM_ID', 'CLIENT_ID']);
});

$migration->table('b_crm_sequences')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('SEQUENCE_NAME', 50)->notNull();
	$columns->int('SEQUENCE_VALUE')->notNull()->default('0');
	$table->addPrimaryKey('SEQUENCE_NAME');
});

$migration->table('b_crm_webpack_file_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('FILE_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 15)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$table->addPrimaryKey('FILE_ID');
	$table->addIndex('IX_B_CRM_WEBPACK_FILE_LOG_ENTITY_ID_ENTITY_TYPE', ['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_crm_copilot_call_assessment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('DESCRIPTION', 2000)->notNull()->default('');
	$columns->text('PROMPT')->notNull();
	$columns->text('GIST');
	$columns->tinyInt('CALL_TYPE')->notNull();
	$columns->tinyInt('AUTO_CHECK_TYPE')->notNull();
	$columns->char('IS_ENABLED', 1)->notNull()->default('Y');
	$columns->char('IS_DEFAULT', 1)->notNull()->default('Y');
	$columns->char('IS_AI_IMPROVEMENT_ENABLED', 1)->notNull()->default('Y');
	$columns->bigInt('JOB_ID')->notNull()->default('0');
	$columns->varchar('STATUS', 100)->notNull()->default('');
	$columns->varchar('CODE', 30);
	$columns->tinyInt('LOW_BORDER')->notNull()->default('30');
	$columns->tinyInt('HIGH_BORDER')->notNull()->default('70');
	$columns->varchar('AVAILABILITY_TYPE', 20)->notNull()->default('always_active');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY_ID')->notNull()->default('0');
	$columns->int('UPDATED_BY_ID')->notNull()->default('0');
	$table->addIndex('IX_CRM_COPILOT_CALL_ASSESSMENT_IS_DEFAULT', ['IS_DEFAULT']);
	$table->addIndex('IX_B_CRM_COPILOT_CALL_ASSESSMENT_IS_ENABLED_UPDATED_AT', ['IS_ENABLED', 'UPDATED_AT']);
});

$migration->table('b_crm_copilot_call_assessment_client_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ASSESSMENT_ID')->notNull();
	$columns->int('CLIENT_TYPE_ID')->notNull();
	$table->addIndex('IX_CRM_COPILOT_CALL_ASSESSMENT_CLIENT_TYPE_AI', ['ASSESSMENT_ID']);
	$table->addIndex('IX_CRM_COPILOT_CALL_ASSESSMENT_CLIENT_TYPE_CTI', ['CLIENT_TYPE_ID']);
});

$migration->table('b_crm_copilot_call_assessment_availability')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ASSESSMENT_ID')->notNull();
	$columns->datetime('START_POINT');
	$columns->datetime('END_POINT');
	$columns->varchar('WEEKDAY_TYPE', 20);
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CRM_CCAA_ASSESSMENT_ID', ['ASSESSMENT_ID']);
});

$migration->table('b_crm_copilot_call_assessment_criteria')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ASSESSMENT_ID')->notNull();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('DESCRIPTION', 600)->notNull();
	$columns->smallInt('SORT')->notNull()->default('0');
	$columns->int('CREATED_BY_ID')->notNull();
	$columns->int('UPDATED_BY_ID')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CRM_CCAC_ASSESSMENT_ID', ['ASSESSMENT_ID']);
});

$migration->table('b_crm_ai_call_summary')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ACTIVITY_ID')->notNull();
	$columns->int('JOB_ID')->notNull();
	$columns->varchar('THEME', 255);
	$columns->varchar('PRODUCT', 255);
	$columns->varchar('INTENT', 255);
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('UX_B_CRM_AI_CALL_SUMMARY_ACTIVITY_ID', ['ACTIVITY_ID']);
});

$migration->table('b_crm_ai_call_script_edit_review')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ASSESSMENT_ID')->notNull();
	$columns->int('JOB_ID')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('UX_B_CRM_AI_CALL_SCRIPT_EDIT_REVIEW_ASSESSMENT_ID', ['ASSESSMENT_ID']);
});

$migration->table('b_crm_ai_call_script_selection')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ACTIVITY_ID')->notNull();
	$columns->int('ASSESSMENT_SETTING_ID')->notNull();
	$columns->int('JOB_ID')->notNull();
	$columns->tinyInt('CONFIDENCE')->notNull();
	$columns->varchar('RATIONALE', 1000);
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('GROUPED_AT');
	$columns->datetime('ENRICHED_AT');
	$table->addIndex('IX_B_CRM_AI_CSS_ACTIVITY_ID', ['ACTIVITY_ID']);
	$table->addIndex('IX_B_CRM_AI_CSS_JOB_ID', ['JOB_ID']);
	$table->addIndex('IX_B_CRM_AI_CSS_CONFIDENCE_CREATED_AT', ['CONFIDENCE', 'CREATED_AT']);
	$table->addIndex('IX_B_CRM_AI_CSS_GROUPED', ['GROUPED_AT', 'CONFIDENCE']);
	$table->addIndex('IX_B_CRM_AI_CSS_ENRICHED', ['ENRICHED_AT', 'CONFIDENCE', 'ASSESSMENT_SETTING_ID']);
});

$migration->table('b_crm_ai_call_script_maintenance_context')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('JOB_ID')->notNull();
	$columns->varchar('TYPE', 32)->notNull();
	$columns->text('DATA');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('UX_B_CRM_AI_CSMC_JOB_ID', ['JOB_ID']);
	$table->addIndex('IX_B_CRM_AI_CSMC_CREATED_AT', ['CREATED_AT']);
});

$migration->table('b_crm_copilot_call_assessment_summary_state')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('MANAGER_ID')->notNull();
	$columns->varchar('SITUATION_TYPE', 32)->notNull();
	$columns->int('LAST_ANCHOR_ID');
	$columns->varchar('STATE', 16);
	$columns->datetime('NOTIFIED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('UX_B_CRM_CCASS_MGR_SITUATION', ['MANAGER_ID', 'SITUATION_TYPE']);
});

$migration->table('b_crm_communication_category')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 64)->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->int('SORT')->default('100');
	$columns->varchar('HANDLER_CLASS', 255)->notNull();
	$table->addUniqueIndex('IX_B_CRM_COMM_CATEGORY_MI_C', ['MODULE_ID', 'CODE']);
});

$migration->table('b_crm_communication_channel')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CATEGORY_ID')->notNull();
	$columns->varchar('MODULE_ID', 64)->notNull();
	$columns->varchar('CODE', 128)->notNull();
	$columns->varchar('HANDLER_CLASS', 256)->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY_ID')->notNull()->default('0');
	$columns->int('UPDATED_BY_ID')->notNull()->default('0');
	$columns->int('SORT')->notNull()->default('0');
	$columns->char('IS_ENABLED', 1)->default('Y');
	$table->addUniqueIndex('IX_B_CRM_COMMUNICATION_CHANNEL_MI_C', ['MODULE_ID', 'CODE']);
});

$migration->table('b_crm_communication_channel_rule')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->int('CHANNEL_ID')->notNull();
	$columns->int('QUEUE_CONFIG_ID')->notNull()->default('0');
	$columns->int('SORT')->notNull()->default('0');
	$columns->text('SEARCH_TARGETS');
	$columns->mediumText('RULES')->notNull();
	$columns->text('ENTITIES')->notNull();
	$columns->text('SETTINGS');
	$table->addIndex('IX_B_CRM_COMM_CHANNEL_RULE_1', ['CHANNEL_ID']);
	$table->addIndex('IX_B_CRM_COMM_CHANNEL_RULE_2', ['QUEUE_CONFIG_ID']);
});

$migration->table('b_crm_communication_channel_event')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('EVENT_ID', 255)->notNull();
	$columns->int('USER_ID');
	$columns->varchar('MODULE_ID', 64)->notNull();
	$columns->mediumText('DATA')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CRM_COMM_CHANNEL_EVENT', ['MODULE_ID', 'EVENT_ID']);
});

$migration->table('b_crm_responsible_queue_config')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('TYPE', 64)->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->text('SETTINGS');
});

$migration->table('b_crm_responsible_queue_config_members')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SORT')->notNull()->default('0');
	$columns->int('QUEUE_CONFIG_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$table->addIndex('IX_B_CRM_QUEUE_CONFIG_MEMBERS_1', ['QUEUE_CONFIG_ID']);
});

$migration->table('b_crm_responsible_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SORT')->notNull()->default('0');
	$columns->int('CONFIG_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('DEPARTMENT_ID')->notNull()->default('0');
	$columns->datetime('LAST_ACTIVITY_DATE')->notNull()->defaultCurrentTimestamp();
	$columns->bigInt('LAST_ACTIVITY_DATE_EXACT');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->text('SETTINGS');
	$table->addIndex('IX_B_CRM_QUEUE_1', ['CONFIG_ID', 'LAST_ACTIVITY_DATE']);
	$table->addIndex('IX_B_CRM_QUEUE_2', ['USER_ID']);
});

$migration->table('b_crm_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('LOGGER_ID', 100)->notNull();
	$columns->datetime('CREATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('VALID_TO')->notNull();
	$columns->varchar('LOG_LEVEL', 32)->notNull();
	$columns->text('MESSAGE')->notNull();
	$columns->text('CONTEXT')->notNull();
	$columns->varchar('URL', 2048)->notNull();
	$table->addIndex('IX_B_CRM_LOG_1', ['VALID_TO']);
});

$migration->table('b_crm_repeat_sale_segment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->text('PROMPT')->notNull();
	$columns->char('IS_ENABLED', 1)->notNull()->default('Y');
	$columns->char('IS_AUTO_DISABLED', 1)->notNull()->default('N');
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->varchar('CODE', 30);
	$columns->varchar('BASE_SEGMENT_CODE', 30);
	$columns->int('ENTITY_TYPE_ID')->notNull()->default('2');
	$columns->int('ENTITY_CATEGORY_ID')->notNull()->default('0');
	$columns->varchar('ENTITY_STAGE_ID', 50)->notNull()->default('');
	$columns->int('MINIMUM_DAYS_AFTER_LAST_CLOSED_ENTITY')->notNull()->default('0');
	$columns->varchar('ENTITY_TITLE_PATTERN', 255);
	$columns->tinyInt('ASSIGNMENT_TYPE_ID')->notNull()->default('1');
	$columns->int('CALL_ASSESSMENT_ID');
	$columns->varchar('IS_AI_ENABLED', 1)->notNull()->default('Y');
	$columns->int('CLIENT_FOUND');
	$columns->smallInt('CLIENT_COVERAGE');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY_ID')->notNull()->default('0');
	$columns->int('UPDATED_BY_ID')->notNull()->default('0');
});

$migration->table('b_crm_repeat_sale_ai_screening')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->int('SEGMENT_ID')->notNull();
	$columns->int('AI_OPINION');
	$columns->varchar('CATEGORY', 255);
	$columns->date('DESIRED_CREATION_DATE');
	$columns->text('PARAMS');
	$columns->int('RESULT_ENTITY_TYPE_ID');
	$columns->int('RESULT_ENTITY_ID');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('IX_B_CRM_REPEAT_SALE_AI_SCREENING_OI_OTI_SI', ['OWNER_ID', 'OWNER_TYPE_ID', 'SEGMENT_ID']);
	$table->addIndex('IX_B_CRM_REPEAT_SALE_AI_SCREENING_AO_DCD', ['AI_OPINION', 'DESIRED_CREATION_DATE']);
	$table->addIndex('IX_B_CRM_REPEAT_SALE_AI_SCREENING_DCD_AO', ['DESIRED_CREATION_DATE', 'AI_OPINION']);
});

$migration->table('b_crm_repeat_sale_job')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SEGMENT_ID')->notNull();
	$columns->int('SCHEDULE_TYPE')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY_ID')->notNull()->default('0');
	$columns->int('UPDATED_BY_ID')->notNull()->default('0');
	$table->addIndex('IX_B_CRM_REPEAT_SALE_JOB_SI', ['SEGMENT_ID']);
});

$migration->table('b_crm_repeat_sale_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('JOB_ID')->notNull();
	$columns->varchar('IS_ONLY_CALC', 1)->notNull()->default('N');
	$columns->int('STATUS')->notNull();
	$columns->int('LAST_ENTITY_TYPE_ID');
	$columns->int('LAST_ITEM_ID');
	$columns->int('LAST_ASSIGNMENT_ID');
	$columns->int('ITEMS_COUNT')->notNull()->default('0');
	$columns->int('HANDLER_TYPE_ID')->notNull();
	$columns->int('RETRY_COUNT')->notNull()->default('0');
	$columns->varchar('HASH', 32);
	$columns->text('PARAMS');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CRM_REPEAT_SALE_QUEUE_JI_H', ['JOB_ID', 'HASH']);
});

$migration->table('b_crm_repeat_sale_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('JOB_ID')->notNull();
	$columns->int('SEGMENT_ID')->notNull();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('STAGE_SEMANTIC_ID', 1)->notNull()->default('P');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CRM_REPEAT_SALE_LOG_JI', ['JOB_ID']);
	$table->addIndex('IX_B_CRM_REPEAT_SALE_LOG_SI', ['SEGMENT_ID']);
	$table->addIndex('IX_B_CRM_REPEAT_SALE_LOG_ETI_EI', ['ENTITY_TYPE_ID', 'ENTITY_ID']);
	$table->addIndex('IX_B_CRM_REPEAT_SALE_LOG_SI_SSI', ['SEGMENT_ID', 'STAGE_SEMANTIC_ID']);
});

$migration->table('b_crm_repeat_sale_segment_assignment_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SEGMENT_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$table->addIndex('IX_B_CRM_REPEAT_SALE_SEGMENT_ASSIGNMENT_USER_SI_UI', ['SEGMENT_ID', 'USER_ID']);
});

$migration->table('b_crm_ai_queue_buffer')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PROVIDER_ID')->notNull();
	$columns->int('STATUS')->notNull();
	$columns->text('PROVIDER_DATA');
	$columns->varchar('PROVIDER_DATA_HASH', 32)->notNull();
	$columns->int('RETRY_COUNT')->notNull()->default('0');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY_ID')->notNull()->default('0');
	$table->addIndex('IX_B_CRM_AI_QUEUE_BUFFER_PI_PDH', ['PROVIDER_ID', 'PROVIDER_DATA_HASH']);
	$table->addIndex('IX_B_CRM_AI_QUEUE_BUFFER_CA', ['CREATED_AT']);
});

$migration->table('b_crm_last_communication')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->datetime('LAST_COMMUNICATION_TIME')->notNull();
	$columns->varchar('TYPE', 64)->notNull();
	$columns->int('ACTIVITY_ID');
	$table->addUniqueIndex('ux_b_crm_last_communication_entity_type_id_entity_id_type', ['ENTITY_TYPE_ID', 'ENTITY_ID', 'TYPE']);
	$table->addIndex('ix_b_crm_last_communication_activity_id', ['ACTIVITY_ID']);
});

$migration->table('b_crm_dynamic_recurring')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ITEM_ID')->notNull();
	$columns->int('BASED_ID');
	$columns->char('ACTIVE', 1)->notNull()->default('N');
	$columns->date('NEXT_EXECUTION');
	$columns->date('LAST_EXECUTION');
	$columns->char('IS_LIMIT', 1)->notNull()->default('N');
	$columns->date('LIMIT_DATE');
	$columns->date('START_DATE')->notNull();
	$columns->int('LIMIT_REPEAT');
	$columns->int('COUNTER_REPEAT');
	$columns->int('CATEGORY_ID');
	$columns->char('IS_SEND_EMAIL', 1)->notNull()->default('N');
	$columns->text('EMAIL_IDS');
	$columns->text('PARAMS');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY_ID')->notNull()->default('0');
	$columns->int('UPDATED_BY_ID')->notNull()->default('0');
	$table->addIndex('IX_B_CRM_DYNAMIC_RECURRING_ETI_II', ['ENTITY_TYPE_ID', 'ITEM_ID']);
	$table->addIndex('IX_B_CRM_DYNAMIC_RECURRING_BI', ['BASED_ID']);
	$table->addIndex('IX_B_CRM_DYNAMIC_RECURRING_NE', ['NEXT_EXECUTION']);
	$table->addIndex('IX_B_CRM_DYNAMIC_RECURRING_LE', ['LAST_EXECUTION']);
	$table->addIndex('IX_B_CRM_DYNAMIC_RECURRING_LD', ['LIMIT_DATE']);
	$table->addIndex('IX_B_CRM_DYNAMIC_RECURRING_SD', ['START_DATE']);
});

$migration->table('b_crm_documentgenerator_template_custom_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('FIELD_UID', 255)->notNull();
	$columns->text('FIELD_VALUE');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CRM_DG_TPL_CF_FIELD_UID', ['FIELD_UID']);
	$table->addUniqueIndex('IX_B_CRM_DG_TPL_CF_TEMPLATE_FIELD', ['TEMPLATE_ID', 'FIELD_UID']);
});

$migration->table('b_crm_dynamic_recurring_document')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->int('EMAIL_TEMPLATE_ID')->notNull();
	$columns->int('RECURRING_ITEM_ID')->notNull();
	$table->addUniqueIndex('IX_B_CRM_DYNAMIC_RECURRING_DOCUMENT_DI', ['DOCUMENT_ID']);
});

$migration->table('b_crm_entity_perms_notification')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('AUTOMATED_SOLUTION_ID')->notNull()->default('0');
	$columns->int('ENTITY_TYPE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('PERM_TYPE', 20)->notNull();
	$table->addIndex('IX_B_CRM_ENTITY_PERMS_NOTIFICATION_ASI_UD_PT', ['AUTOMATED_SOLUTION_ID', 'USER_ID', 'PERM_TYPE']);
});

$migration->table('b_crm_dp_mhdc')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('DATASET_ID', 32)->notNull();
	$columns->datetime('DATASET_TS')->notNull();
	$columns->int('RN')->unsigned()->notNull();
	$columns->varchar('MATCH_HASH', 32)->notNull();
	$columns->int('QTY')->unsigned()->notNull();
	$table->addPrimaryKeys(['DATASET_ID', 'DATASET_TS', 'RN']);
	$table->addIndex('IX_B_CRM_DP_MHDC_DATASET_TS', ['DATASET_TS']);
});

$migration->table('b_crm_act_mail_body_bind')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('BODY_ID')->notNull();
	$columns->int('OWNER_TYPE_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$table->addIndex('IX_B_CRM_ACT_MAIL_BODY_BIND_1', ['BODY_ID']);
	$table->addIndex('IX_B_CRM_ACT_MAIL_BODY_BIND_2', ['OWNER_ID', 'OWNER_TYPE_ID']);
});
