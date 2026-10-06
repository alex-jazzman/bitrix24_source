<?php

use Bitrix\Main\UpdateSystem\Migration;
use Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder;

$migration = Migration::getInstance();

$migration->table('b_booking_client_type')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('MODULE_ID', 255)->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BCT_MODULE_ID_CODE', ['MODULE_ID', 'CODE']);
});

$migration->table('b_booking_resource_type')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('MODULE_ID', 255)->notNull();
	$columns->varchar('CODE', 255);
	$columns->varchar('NAME', 255);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BRT_MODULE_ID_CODE', ['MODULE_ID', 'CODE']);
});

$migration->table('b_booking_resource_type_notification_settings')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->char('IS_INFO_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_INFO', 255)->notNull();
	$columns->int('INFO_DELAY')->notNull()->default('0');
	$columns->char('IS_CANCELLATION_ON', 1)->notNull()->default('Y');
	$columns->int('CANCELLATION_DELAY')->notNull()->default('600');
	$columns->char('IS_CONFIRMATION_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_CONFIRMATION', 255)->notNull();
	$columns->int('CONFIRMATION_DELAY')->notNull()->default('86400');
	$columns->int('CONFIRMATION_REPETITIONS')->notNull()->default('0');
	$columns->int('CONFIRMATION_REPETITIONS_INTERVAL')->notNull()->default('10800');
	$columns->int('CONFIRMATION_COUNTER_DELAY')->notNull()->default('10800');
	$columns->char('IS_REMINDER_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_REMINDER', 255)->notNull();
	$columns->int('REMINDER_DELAY')->notNull()->default('-1');
	$columns->char('IS_FEEDBACK_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_FEEDBACK', 255)->notNull();
	$columns->char('IS_DELAYED_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_DELAYED', 255)->notNull();
	$columns->int('DELAYED_DELAY')->notNull()->default('300');
	$columns->int('DELAYED_COUNTER_DELAY')->notNull()->default('300');
	$columns->varchar('SENDER_CODE', 255)->notNull()->default('');
	$table->addPrimaryKey('ID');
});

$migration->table('b_booking_resource')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TYPE_ID')->unsigned()->notNull();
	$columns->int('EXTERNAL_ID')->unsigned();
	$columns->char('IS_MAIN', 1)->notNull()->default('Y');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BR_TYPE_ID', ['TYPE_ID']);
	$table->addIndex('IX_BR_EXTERNAL_ID', ['EXTERNAL_ID']);
	$table->addIndex('IX_BR_IS_MAIN', ['IS_MAIN']);
});

$migration->table('b_booking_resource_data')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('RESOURCE_ID')->unsigned()->notNull();
	$columns->int('AVATAR_ID')->unsigned();
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('DESCRIPTION');
	$columns->char('IS_DELETED', 1)->notNull()->default('N');
	$columns->timestamp('DELETED_AT');
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp();
	$columns->bigInt('CREATED_BY')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BRD_RESOURCE_ID', ['RESOURCE_ID']);
	$table->addIndex('IX_BRD_IS_DELETED', ['IS_DELETED']);
});

$migration->table('b_booking_resource_settings')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('RESOURCE_ID')->unsigned()->notNull();
	$columns->varchar('WEEKDAYS', 50)->notNull();
	$columns->int('SLOT_SIZE')->unsigned();
	$columns->int('TIME_FROM')->unsigned()->notNull();
	$columns->int('TIME_TO')->unsigned()->notNull();
	$columns->varchar('TIMEZONE', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BRS_RESOURCE_ID', ['RESOURCE_ID']);
});

$migration->table('b_booking_resource_notification_settings')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('RESOURCE_ID')->unsigned()->notNull();
	$columns->char('IS_INFO_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_INFO', 255)->notNull();
	$columns->int('INFO_DELAY')->notNull()->default('0');
	$columns->char('IS_CANCELLATION_ON', 1)->notNull()->default('Y');
	$columns->int('CANCELLATION_DELAY')->notNull()->default('600');
	$columns->char('IS_CONFIRMATION_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_CONFIRMATION', 255)->notNull();
	$columns->int('CONFIRMATION_DELAY')->notNull()->default('86400');
	$columns->int('CONFIRMATION_REPETITIONS')->notNull()->default('0');
	$columns->int('CONFIRMATION_REPETITIONS_INTERVAL')->notNull()->default('10800');
	$columns->int('CONFIRMATION_COUNTER_DELAY')->notNull()->default('10800');
	$columns->char('IS_REMINDER_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_REMINDER', 255)->notNull();
	$columns->int('REMINDER_DELAY')->notNull()->default('-1');
	$columns->char('IS_FEEDBACK_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_FEEDBACK', 255)->notNull();
	$columns->char('IS_DELAYED_ON', 1)->notNull()->default('Y');
	$columns->varchar('TEMPLATE_TYPE_DELAYED', 255)->notNull();
	$columns->int('DELAYED_DELAY')->notNull()->default('300');
	$columns->int('DELAYED_COUNTER_DELAY')->notNull()->default('300');
	$columns->varchar('SENDER_CODE', 255)->notNull()->default('');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BRNS_RESOURCE_ID', ['RESOURCE_ID']);
});

$migration->table('b_booking_booking')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('NAME', 255);
	$columns->bigInt('DATE_FROM')->unsigned()->notNull();
	$columns->bigInt('DATE_TO')->unsigned()->notNull();
	$columns->varchar('TIMEZONE_FROM', 50)->notNull();
	$columns->int('TIMEZONE_FROM_OFFSET')->notNull();
	$columns->varchar('TIMEZONE_TO', 50)->notNull();
	$columns->int('TIMEZONE_TO_OFFSET')->notNull();
	$columns->bigInt('DATE_MAX')->unsigned()->notNull();
	$columns->char('IS_RECURRING', 1)->notNull()->default('N');
	$columns->text('RRULE');
	$columns->int('PARENT_ID')->unsigned();
	$columns->char('IS_DELETED', 1)->notNull()->default('N');
	$columns->char('IS_CONFIRMED', 1)->notNull()->default('N');
	$columns->timestamp('CONFIRMED_AT');
	$columns->text('DESCRIPTION');
	$columns->varchar('VISIT_STATUS', 20)->notNull()->default('unknown');
	$columns->varchar('SOURCE', 20)->notNull()->default('internal');
	$columns->varchar('DELETION_SCENARIO', 20);
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('DELETED_AT');
	$columns->bigInt('CREATED_BY')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BB_IS_DELETED_DATE_FROM_DATE_MAX', ['IS_DELETED', 'DATE_FROM', 'DATE_MAX']);
	$table->addIndex('IX_BB_IS_DELETED_DATE_MAX_DATE_FROM', ['IS_DELETED', 'DATE_MAX', 'DATE_FROM']);
	$table->addIndex('IX_BB_DATE_FROM_DATE_TO', ['DATE_FROM', 'DATE_TO']);
	$table->addIndex('IX_BB_DATE_MAX', ['DATE_MAX']);
	$table->addIndex('IX_BB_PARENT_ID', ['PARENT_ID']);
	$table->addIndex('IX_BB_CREATED_AT', ['CREATED_AT']);
	$table->addIndex('IX_BB_CREATED_BY', ['CREATED_BY']);
});

$migration->table('b_booking_booking_resource')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('BOOKING_ID')->unsigned()->notNull();
	$columns->int('RESOURCE_ID')->unsigned()->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BBR_BOOKING_ID_RESOURCE', ['BOOKING_ID', 'RESOURCE_ID']);
	$table->addIndex('IX_BBR_BOOKING_ID_IS_PRIMARY', ['BOOKING_ID', 'IS_PRIMARY']);
});

$migration->table('b_booking_booking_client')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('BOOKING_ID')->unsigned();
	$columns->bigInt('ENTITY_ID')->unsigned()->notNull()->default('0');
	$columns->int('CLIENT_TYPE_ID')->unsigned()->notNull();
	$columns->int('CLIENT_ID')->unsigned()->notNull();
	$columns->char('IS_PRIMARY', 1)->notNull()->default('N');
	$columns->varchar('ENTITY_TYPE', 255)->notNull()->default('booking');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BBC_ENTITY_ID_CLIENT', ['ENTITY_ID', 'ENTITY_TYPE', 'CLIENT_TYPE_ID', 'CLIENT_ID']);
	$table->addIndex('IX_BBC_CLIENT', ['CLIENT_TYPE_ID', 'CLIENT_ID']);
});

$migration->table('b_booking_booking_external_data')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('BOOKING_ID')->unsigned();
	$columns->bigInt('ENTITY_ID')->unsigned()->notNull()->default('0');
	$columns->varchar('MODULE_ID', 255)->notNull();
	$columns->varchar('ENTITY_TYPE_ID', 255)->notNull();
	$columns->varchar('VALUE', 255)->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull()->default('booking');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BBED_ENTITY_ID_ENTITY_TYPE', ['ENTITY_ID', 'ENTITY_TYPE']);
	$table->addIndex('IX_BBED_VALUE', ['MODULE_ID', 'ENTITY_TYPE_ID', 'VALUE']);
});

$migration->table('b_booking_journal')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('TYPE', 64)->notNull();
	$columns->mediumText('DATA')->notNull();
	$columns->varchar('STATUS', 10)->notNull();
	$columns->varchar('INFO', 512);
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BJ_ENTITY', ['ENTITY_ID']);
	$table->addIndex('IX_BJ_TYPE', ['TYPE']);
	$table->addIndex('IX_BJ_STATUS', ['STATUS']);
	$table->addIndex('IX_BJ_CREATED_AT', ['CREATED_AT']);
});

$migration->table('b_booking_favorites')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('MANAGER_ID')->unsigned()->notNull();
	$columns->int('RESOURCE_ID')->unsigned()->notNull();
	$columns->varchar('TYPE', 10)->notNull()->default('ADDED');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BF_RESOURCE', ['RESOURCE_ID']);
	$table->addUniqueIndex('IX_BF_MANAGER_ID_RESOURCE', ['MANAGER_ID', 'RESOURCE_ID']);
});

$migration->table('b_booking_scorer')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->int('ENTITY_ID')->notNull()->default('0');
	$columns->varchar('TYPE', 64)->notNull()->default('');
	$columns->mediumInt('VALUE')->unsigned()->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BS_USER_ID_ENTITY_ID_TYPE', ['USER_ID', 'ENTITY_ID', 'TYPE']);
	$table->addIndex('IX_BS_USER', ['USER_ID']);
	$table->addIndex('IX_BS_TYPE', ['TYPE']);
	$table->addIndex('IX_BS_ENTITY', ['ENTITY_ID']);
});

$migration->table('b_booking_booking_note')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('BOOKING_ID')->unsigned();
	$columns->bigInt('ENTITY_ID')->unsigned()->notNull()->default('0');
	$columns->text('DESCRIPTION')->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull()->default('booking');
	$columns->varchar('NOTE_TYPE', 255)->notNull()->default('manager');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BBN_ENTITY_ID_ENTITY_TYPE_NOTE_TYPE', ['ENTITY_ID', 'ENTITY_TYPE', 'NOTE_TYPE']);
});

$migration->table('b_booking_option')->create(function (CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('VALUE', 255)->notNull();
	$table->addUniqueIndex('ux_bk_option_user_id_name', ['USER_ID', 'NAME']);
});

$migration->table('b_booking_booking_message')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('BOOKING_ID')->unsigned()->notNull();
	$columns->varchar('NOTIFICATION_TYPE', 255)->notNull();
	$columns->varchar('SENDER_MODULE_ID', 255);
	$columns->varchar('SENDER_CODE', 255)->notNull();
	$columns->varchar('EXTERNAL_MESSAGE_ID', 255)->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->varchar('STATUS', 20)->notNull()->default('success');
	$columns->int('RETRY_COUNT')->unsigned()->notNull()->default('0');
	$columns->timestamp('NEXT_RETRY_AT');
	$columns->timestamp('SENT_AT')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BBM_COMPLEX_1', ['BOOKING_ID', 'NOTIFICATION_TYPE', 'SENT_AT']);
	$table->addIndex('IX_BBM_MESSAGE', ['SENDER_CODE', 'EXTERNAL_MESSAGE_ID']);
	$table->addIndex('IX_BBM_RETRY', ['STATUS', 'NEXT_RETRY_AT']);
});

$migration->table('b_booking_booking_message_failure_log')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('BOOKING_ID')->unsigned()->notNull();
	$columns->varchar('NOTIFICATION_TYPE', 255)->notNull();
	$columns->varchar('SENDER_MODULE_ID', 255)->notNull();
	$columns->varchar('SENDER_CODE', 255)->notNull();
	$columns->varchar('REASON_CODE', 255)->notNull();
	$columns->text('REASON_TEXT');
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BBMFL_COMPLEX_1', ['BOOKING_ID', 'NOTIFICATION_TYPE', 'SENDER_MODULE_ID', 'SENDER_CODE', 'CREATED_AT']);
	$table->addIndex('IX_BBMFL_COMPLEX_2', ['BOOKING_ID', 'NOTIFICATION_TYPE', 'CREATED_AT']);
});

$migration->table('b_booking_wait_list_item')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('CREATED_BY')->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp();
	$columns->char('IS_DELETED', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BWLI_IS_DELETED', ['IS_DELETED']);
});

$migration->table('b_booking_resource_linked_entity')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->bigInt('RESOURCE_ID')->unsigned()->notNull();
	$columns->bigInt('ENTITY_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->text('DATA');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BRE_RESOURCE_ENTITY', ['RESOURCE_ID', 'ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_booking_delayed_task')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('CODE', 32)->notNull();
	$columns->varchar('TYPE', 64)->notNull();
	$columns->text('DATA')->notNull();
	$columns->varchar('STATUS', 10)->notNull();
	$columns->timestamp('CREATED_AT')->defaultCurrentTimestamp();
	$columns->timestamp('UPDATED_AT')->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BDT_STATUS', ['STATUS']);
});

$migration->table('b_booking_booking_sku')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('BOOKING_ID')->unsigned()->notNull();
	$columns->int('SKU_ID')->unsigned()->notNull();
	$columns->int('PRODUCT_ROW_ID')->unsigned();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_BBS_BOOKING_SKU', ['BOOKING_ID', 'SKU_ID']);
	$table->addUniqueIndex('UX_BBS_PRODUCT_ROW', ['PRODUCT_ROW_ID']);
	$table->addIndex('IX_BBS_SKU_ID', ['SKU_ID']);
});

$migration->table('b_booking_resource_sku')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('RESOURCE_ID')->unsigned()->notNull();
	$columns->int('SKU_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_BRS_RESOURCE_SKU', ['RESOURCE_ID', 'SKU_ID']);
	$table->addIndex('IX_BRS_SKU_ID', ['SKU_ID']);
});

$migration->table('b_booking_resource_sku_yandex')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('RESOURCE_ID')->unsigned()->notNull();
	$columns->int('SKU_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_BRSY_RESOURCE_SKU', ['RESOURCE_ID', 'SKU_ID']);
	$table->addIndex('IX_BRSY_SKU_ID', ['SKU_ID']);
});

$migration->table('b_booking_booking_payment')->create(function (CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('BOOKING_ID')->unsigned()->notNull();
	$columns->int('PAYMENT_ID')->unsigned()->notNull();
	$columns->char('IS_PAID', 1)->notNull()->default('N');
	$columns->char('IS_PAID_MANUALLY', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_BBP_PAYMENT_ID', ['PAYMENT_ID']);
});
