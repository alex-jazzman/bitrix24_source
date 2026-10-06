<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_bp_workflow_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$columns->varchar('DOCUMENT_STATUS', 50);
	$columns->int('AUTO_EXECUTE')->notNull()->default('0');
	$columns->varchar('NAME', 255);
	$columns->text('DESCRIPTION');
	$columns->mediumBlob('TEMPLATE');
	$columns->blob('PARAMETERS');
	$columns->blob('VARIABLES');
	$columns->mediumBlob('CONSTANTS');
	$columns->datetime('MODIFIED')->notNull();
	$columns->char('IS_MODIFIED', 1)->notNull()->default('N');
	$columns->int('USER_ID');
	$columns->varchar('SYSTEM_CODE', 50);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->int('SORT')->notNull()->default('10');
	$columns->varchar('TYPE', 15)->notNull()->default('default');
	$columns->text('SETTINGS');
	$columns->int('CREATED_BY');
	$columns->int('UPDATED_BY');
	$columns->int('ACTIVATED_BY');
	$columns->datetime('ACTIVATED_AT');
	$columns->varchar('CREATE_SOURCE', 32)->default('USER');
	$table->addIndex('ix_bp_wf_template_mo', ['MODULE_ID', 'ENTITY', 'DOCUMENT_TYPE']);
});

$migration->table('b_bp_workflow_state')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 32)->notNull();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_ID', 128)->notNull();
	$columns->int('DOCUMENT_ID_INT')->notNull();
	$columns->int('WORKFLOW_TEMPLATE_ID')->notNull();
	$columns->varchar('STATE', 128);
	$columns->varchar('STATE_TITLE', 255);
	$columns->text('STATE_PARAMETERS');
	$columns->datetime('MODIFIED')->notNull();
	$columns->datetime('STARTED');
	$columns->int('STARTED_BY');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_ws_document_id', ['DOCUMENT_ID', 'ENTITY', 'MODULE_ID']);
	$table->addIndex('ix_bp_ws_document_id1', ['DOCUMENT_ID_INT', 'ENTITY', 'MODULE_ID', 'STATE']);
	$table->addIndex('ix_bp_ws_started_by', ['STARTED_BY']);
	$table->addIndex('ix_bp_ws_started', ['STARTED']);
	$table->addIndex('ix_bp_ws_workflow_template_id_started', ['WORKFLOW_TEMPLATE_ID', 'STARTED']);
});

$migration->table('b_bp_workflow_permissions')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->varchar('OBJECT_ID', 64)->notNull();
	$columns->varchar('PERMISSION', 64)->notNull();
	$table->addIndex('ix_bp_wf_permissions_wt', ['WORKFLOW_ID']);
});

$migration->table('b_bp_workflow_instance')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 32)->notNull();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_ID', 128)->notNull();
	$columns->int('WORKFLOW_TEMPLATE_ID')->notNull();
	$columns->mediumBlob('WORKFLOW');
	$columns->mediumBlob('WORKFLOW_RO');
	$columns->datetime('STARTED');
	$columns->int('STARTED_BY');
	$columns->smallInt('STARTED_EVENT_TYPE')->notNull()->default('0');
	$columns->int('STATUS');
	$columns->datetime('MODIFIED')->notNull();
	$columns->varchar('OWNER_ID', 32);
	$columns->datetime('OWNED_UNTIL');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_wi_document', ['DOCUMENT_ID', 'ENTITY', 'MODULE_ID', 'STARTED_EVENT_TYPE']);
	$table->addIndex('ix_bp_wi_started_by', ['STARTED_BY']);
	$table->addIndex('ix_bp_wi_tpl_started', ['WORKFLOW_TEMPLATE_ID', 'STARTED']);
	$table->addIndex('ix_bp_wi_modified', ['MODIFIED']);
	$table->addIndex('ix_bp_wi_status_modified', ['STATUS', 'MODIFIED']);
	$table->addIndex('ix_bp_wi_modified_id_owned_until', ['MODIFIED', 'ID', 'OWNED_UNTIL']);
});

$migration->table('b_bp_tracking')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->int('TYPE')->notNull();
	$columns->datetime('MODIFIED')->notNull();
	$columns->varchar('ACTION_NAME', 128)->notNull();
	$columns->varchar('ACTION_TITLE', 255);
	$columns->int('EXECUTION_STATUS')->notNull()->default('0');
	$columns->int('EXECUTION_RESULT')->notNull()->default('0');
	$columns->text('ACTION_NOTE');
	$columns->int('MODIFIED_BY');
	$columns->char('COMPLETED', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_tracking_wft', ['WORKFLOW_ID', 'TYPE']);
	$table->addIndex('ix_bp_tracking_md', ['MODIFIED']);
	$table->addIndex('ix_bp_tracking_ctm', ['COMPLETED', 'TYPE', 'MODIFIED']);
});

$migration->table('b_bp_task')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->varchar('ACTIVITY', 128)->notNull();
	$columns->varchar('ACTIVITY_NAME', 128)->notNull();
	$columns->datetime('CREATED_DATE');
	$columns->datetime('MODIFIED')->notNull();
	$columns->datetime('OVERDUE_DATE');
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('DESCRIPTION');
	$columns->text('PARAMETERS');
	$columns->int('STATUS')->notNull()->default('0');
	$columns->char('IS_INLINE', 1)->notNull()->default('N');
	$columns->int('DELEGATION_TYPE')->notNull()->default('0');
	$columns->varchar('DOCUMENT_NAME', 255);
	$table->addIndex('ix_bp_tasks_sort', ['OVERDUE_DATE', 'MODIFIED']);
	$table->addIndex('ix_bp_tasks_wf_ac', ['WORKFLOW_ID', 'ACTIVITY']);
	$table->addIndex('ix_bp_tasks_wf_od', ['WORKFLOW_ID', 'OVERDUE_DATE']);
	$table->addIndex('ix_bp_tasks_modified', ['MODIFIED']);
	$table->addIndex('ix_bp_tasks_created', ['CREATED_DATE']);
});

$migration->table('b_bp_task_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('TASK_ID')->notNull();
	$columns->int('STATUS')->notNull()->default('0');
	$columns->datetime('DATE_UPDATE');
	$columns->int('ORIGINAL_USER_ID')->notNull()->default('0');
	$table->addUniqueIndex('ix_bp_task_user', ['USER_ID', 'TASK_ID']);
	$table->addIndex('ix_bp_task_user_2', ['TASK_ID']);
	$table->addIndex('ix_bp_task_user_3', ['USER_ID', 'STATUS']);
});

$migration->table('b_bp_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_ID', 128)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->blob('DOCUMENT');
	$columns->datetime('MODIFIED')->notNull();
	$columns->int('USER_ID');
	$table->addIndex('ix_bp_history_doc', ['DOCUMENT_ID', 'ENTITY', 'MODULE_ID']);
});

$migration->table('b_bp_workflow_state_identify')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$table->addUniqueIndex('ix_bp_wsi_wf', ['WORKFLOW_ID']);
});

$migration->table('b_bp_rest_activity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('APP_ID', 128)->notNull();
	$columns->text('APP_NAME');
	$columns->varchar('CODE', 128)->notNull();
	$columns->varchar('INTERNAL_CODE', 32)->notNull();
	$columns->varchar('HANDLER', 1000)->notNull();
	$columns->int('AUTH_USER_ID')->notNull()->default('0');
	$columns->char('USE_SUBSCRIPTION', 1)->notNull()->default('');
	$columns->char('USE_PLACEMENT', 1)->notNull()->default('N');
	$columns->text('NAME');
	$columns->text('DESCRIPTION');
	$columns->text('PROPERTIES');
	$columns->text('RETURN_PROPERTIES');
	$columns->text('DOCUMENT_TYPE');
	$columns->text('FILTER');
	$columns->char('IS_ROBOT', 1)->notNull()->default('N');
	$table->addUniqueIndex('ix_bp_ra_ic', ['INTERNAL_CODE']);
});

$migration->table('b_bp_scheduler_event')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->varchar('HANDLER', 128)->notNull();
	$columns->varchar('EVENT_MODULE', 32)->notNull();
	$columns->varchar('EVENT_TYPE', 100)->notNull();
	$columns->varchar('ENTITY_ID', 100);
	$columns->mediumText('EVENT_PARAMETERS');
	$table->addIndex('ix_b_bp_se_2', ['EVENT_MODULE', 'EVENT_TYPE', 'ENTITY_ID']);
	$table->addIndex('ix_b_bp_se_3', ['WORKFLOW_ID']);
});

$migration->table('b_bp_rest_provider')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('APP_ID', 128)->notNull();
	$columns->text('APP_NAME');
	$columns->varchar('CODE', 128)->notNull();
	$columns->varchar('TYPE', 30)->notNull();
	$columns->varchar('HANDLER', 1000)->notNull();
	$columns->text('NAME');
	$columns->text('DESCRIPTION');
});

$migration->table('b_bp_automation_trigger')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 30)->notNull();
	$columns->varchar('MODULE_ID', 32)->notNull();
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$columns->varchar('DOCUMENT_STATUS', 50)->notNull();
	$columns->text('APPLY_RULES');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_atm_trigger_1', ['DOCUMENT_TYPE', 'DOCUMENT_STATUS']);
});

$migration->table('b_bp_global_const')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 50)->notNull();
	$columns->text('NAME')->notNull();
	$columns->text('DESCRIPTION');
	$columns->varchar('PROPERTY_TYPE', 30)->notNull();
	$columns->char('IS_REQUIRED', 1)->notNull()->default('N');
	$columns->char('IS_MULTIPLE', 1)->notNull()->default('N');
	$columns->text('PROPERTY_OPTIONS');
	$columns->text('PROPERTY_SETTINGS');
	$columns->text('PROPERTY_VALUE');
	$columns->datetime('CREATED_DATE');
	$columns->int('CREATED_BY');
	$columns->varchar('VISIBILITY', 30)->default('GLOBAL');
	$columns->datetime('MODIFIED_DATE');
	$columns->int('MODIFIED_BY');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_gc_visibility', ['VISIBILITY']);
});

$migration->table('b_bp_script')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$columns->varchar('NAME', 255);
	$columns->text('DESCRIPTION');
	$columns->int('WORKFLOW_TEMPLATE_ID')->notNull();
	$columns->datetime('CREATED_DATE')->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('MODIFIED_DATE')->notNull();
	$columns->int('MODIFIED_BY')->notNull();
	$columns->varchar('ORIGINATOR_ID', 255);
	$columns->varchar('ORIGIN_ID', 255);
	$columns->int('SORT')->notNull()->default('10');
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$table->addIndex('ix_bp_script_mo', ['MODULE_ID', 'ENTITY', 'DOCUMENT_TYPE']);
});

$migration->table('b_bp_script_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('SCRIPT_ID')->notNull();
	$columns->datetime('STARTED_DATE');
	$columns->int('STARTED_BY');
	$columns->tinyInt('STATUS')->unsigned()->notNull()->default('0');
	$columns->datetime('MODIFIED_DATE')->notNull();
	$columns->int('MODIFIED_BY')->notNull();
	$columns->mediumText('WORKFLOW_PARAMETERS');
	$table->addIndex('ix_bp_sq_script_id', ['SCRIPT_ID']);
	$table->addIndex('ix_bp_sq_script_id_status', ['SCRIPT_ID', 'STATUS']);
	$table->addIndex('ix_bp_sq_started_by', ['STARTED_BY']);
});

$migration->table('b_bp_script_queue_document')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('QUEUE_ID')->notNull();
	$columns->varchar('DOCUMENT_ID', 128)->notNull();
	$columns->varchar('WORKFLOW_ID', 32)->notNull()->default('');
	$columns->tinyInt('STATUS')->unsigned()->notNull()->default('0');
	$columns->varchar('STATUS_MESSAGE', 255);
	$table->addIndex('ix_bp_sqd_queue_id', ['QUEUE_ID']);
	$table->addIndex('ix_bp_sqd_wf', ['WORKFLOW_ID']);
	$table->addIndex('ix_bp_sqd_queue_wf', ['QUEUE_ID', 'WORKFLOW_ID']);
});

$migration->table('b_bp_storage_activity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('WORKFLOW_TEMPLATE_ID')->unsigned()->notNull();
	$columns->varchar('ACTIVITY_NAME', 128)->notNull();
	$columns->varchar('KEY_ID', 128)->notNull();
	$columns->text('KEY_VALUE');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_st_act_1', ['WORKFLOW_TEMPLATE_ID', 'ACTIVITY_NAME']);
});

$migration->table('b_bp_global_var')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 50)->notNull();
	$columns->text('NAME')->notNull();
	$columns->text('DESCRIPTION');
	$columns->varchar('PROPERTY_TYPE', 30)->notNull();
	$columns->char('IS_REQUIRED', 1)->notNull()->default('N');
	$columns->char('IS_MULTIPLE', 1)->notNull()->default('N');
	$columns->text('PROPERTY_OPTIONS');
	$columns->text('PROPERTY_SETTINGS');
	$columns->text('PROPERTY_VALUE');
	$columns->datetime('CREATED_DATE');
	$columns->int('CREATED_BY');
	$columns->varchar('VISIBILITY', 30)->default('GLOBAL');
	$columns->datetime('MODIFIED_DATE');
	$columns->int('MODIFIED_BY');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_gv_visibility', ['VISIBILITY']);
});

$migration->table('b_bp_debugger_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ID', 32)->notNull();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$columns->int('DOCUMENT_CATEGORY_ID');
	$columns->tinyInt('MODE')->unsigned()->notNull();
	$columns->varchar('TITLE', 256);
	$columns->int('STARTED_BY')->notNull();
	$columns->datetime('STARTED_DATE')->notNull();
	$columns->datetime('FINISHED_DATE');
	$columns->char('ACTIVE', 1)->notNull();
	$columns->char('FIXED', 1)->notNull();
	$columns->tinyInt('DEBUGGER_STATE')->notNull()->default('-1');
	$table->addPrimaryKey('ID');
});

$migration->table('b_bp_debugger_session_document')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('SESSION_ID', 32)->notNull();
	$columns->varchar('DOCUMENT_ID', 128)->notNull();
	$columns->datetime('DATE_EXPIRE');
	$table->addPrimaryKey('ID');
});

$migration->table('b_bp_debugger_session_workflow_context')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('SESSION_ID', 32)->notNull();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->int('TEMPLATE_SHARDS_ID');
});

$migration->table('b_bp_debugger_session_template_shards')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->mediumBlob('SHARDS');
	$columns->tinyInt('TEMPLATE_TYPE')->unsigned();
	$columns->datetime('MODIFIED')->notNull();
});

$migration->table('b_bp_workflow_duration_stat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->int('TEMPLATE_ID')->unsigned()->notNull();
	$columns->int('DURATION')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_wf_dur_stat_template', ['TEMPLATE_ID']);
});

$migration->table('b_bp_workflow_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->int('IS_AUTHOR')->notNull()->default('1');
	$columns->int('WORKFLOW_STATUS')->notNull()->default('0');
	$columns->int('TASK_STATUS')->notNull()->default('0');
	$columns->datetime('MODIFIED')->notNull();
	$table->addPrimaryKeys(['USER_ID', 'WORKFLOW_ID']);
	$table->addIndex('ix_bp_wu_status', ['USER_ID', 'WORKFLOW_STATUS', 'TASK_STATUS', 'MODIFIED']);
	$table->addIndex('ix_bp_wu_my', ['USER_ID', 'IS_AUTHOR', 'TASK_STATUS', 'MODIFIED']);
	$table->addIndex('ix_bp_wu_my_task', ['USER_ID', 'TASK_STATUS', 'MODIFIED']);
	$table->addIndex('ix_bp_wu_wf', ['WORKFLOW_ID']);
});

$migration->table('b_bp_workflow_meta')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->int('START_DURATION')->unsigned();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_wf_meta_wf_id', ['WORKFLOW_ID']);
});

$migration->table('b_bp_workflow_filter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->varchar('MODULE_ID', 32)->notNull();
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_ID', 128)->notNull();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->datetime('STARTED')->notNull();
	$table->addPrimaryKey('WORKFLOW_ID');
	$table->addIndex('ix_bp_wf_flt_1', ['DOCUMENT_ID', 'ENTITY', 'MODULE_ID']);
	$table->addIndex('ix_bp_wf_flt_2', ['MODULE_ID']);
	$table->addIndex('ix_bp_wf_flt_3', ['TEMPLATE_ID']);
	$table->addIndex('ix_bp_wf_flt_4', ['STARTED']);
});

$migration->table('b_bp_task_search_content')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('TASK_ID')->notNull();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->text('SEARCH_CONTENT')->notNull();
	$table->addPrimaryKey('TASK_ID');
	$table->addIndex('ix_bp_task_search_1', ['WORKFLOW_ID']);
	$table->addFulltextIndex('ix_bp_task_search_2', ['SEARCH_CONTENT']);
});

$migration->table('b_bp_workflow_user_comment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->int('UNREAD_CNT')->notNull()->default('0');
	$columns->tinyInt('LAST_TYPE')->notNull()->default('0');
	$columns->datetime('MODIFIED')->notNull();
	$table->addPrimaryKeys(['USER_ID', 'WORKFLOW_ID']);
	$table->addIndex('ix_bp_wuc_wf', ['WORKFLOW_ID']);
	$table->addIndex('ix_bp_wuc_lt', ['LAST_TYPE']);
	$table->addIndex('ix_bp_wuc_ltm', ['LAST_TYPE', 'MODIFIED']);
});

$migration->table('b_bp_workflow_result')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->varchar('ACTIVITY', 128)->notNull();
	$columns->text('RESULT');
	$columns->datetime('CREATED_DATE')->notNull();
	$columns->int('PRIORITY')->notNull()->default('0');
	$table->addIndex('ix_bp_r_wf', ['WORKFLOW_ID']);
});

$migration->table('b_bp_workflow_template_settings')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('VALUE');
	$table->addIndex('ix_bp_wf_template_settings_tpl_id', ['TEMPLATE_ID']);
	// Covers lookups by setting value, e.g. finding the launched copies of a system AI-agent
	// template by ORIGIN_SYSTEM_CODE. VALUE is TEXT on MySQL, so the prefix length is mandatory.
	$table->addIndex('ix_bp_wf_template_settings_name_value', ['NAME', 'VALUE(50)']);
});

$migration->table('b_bp_workflow_template_user_option')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('OPTION_CODE')->notNull();
	$table->addUniqueIndex('ux_bp_template_user_option', ['TEMPLATE_ID', 'USER_ID', 'OPTION_CODE']);
	$table->addIndex('ix_bp_user_option', ['USER_ID', 'OPTION_CODE']);
});

$migration->table('b_bp_document_type_user_option')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('OPTION_CODE')->notNull();
	$table->addUniqueIndex('ux_bp_document_type_user_option', ['MODULE_ID', 'ENTITY', 'DOCUMENT_TYPE', 'USER_ID', 'OPTION_CODE']);
	$table->addIndex('ix_bp_document_type_user_option', ['MODULE_ID', 'ENTITY', 'USER_ID', 'OPTION_CODE']);
});

$migration->table('b_bp_workflow_template_draft')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 32)->notNull();
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$columns->int('TEMPLATE_ID');
	$columns->mediumBlob('TEMPLATE_DATA')->notNull();
	$columns->int('STATUS')->notNull()->default('0');
	$columns->int('USER_ID')->notNull();
	$columns->datetime('CREATED')->notNull();
	$table->addIndex('ix_bp_wf_draft_template', ['TEMPLATE_ID']);
	$table->addIndex('ix_bp_wf_draft_user', ['USER_ID']);
});

$migration->table('b_bp_workflow_template_change')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->tinyInt('EVENT_TYPE')->notNull();
	$columns->int('USER_ID');
	$columns->datetime('CREATED')->notNull();
	$columns->int('VERSION_NUMBER');
	$columns->tinyInt('PUBLICATION_TYPE');
	$columns->mediumBlob('SNAPSHOT');
	$columns->datetime('TEMPLATE_MODIFIED');
	$table->addUniqueIndex('ux_bp_wf_tpl_change_version', ['TEMPLATE_ID', 'VERSION_NUMBER']);
	$table->addIndex('ix_bp_wf_tpl_change_event_pub', ['TEMPLATE_ID', 'EVENT_TYPE', 'PUBLICATION_TYPE']);
	$table->addIndex('ix_bp_wf_tpl_change_created', ['TEMPLATE_ID', 'CREATED']);
});

$migration->table('b_bp_workflow_template_pilot')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('MODULE_ID', 32)->notNull();
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$columns->mediumBlob('TEMPLATE_DATA')->notNull();
	$columns->varchar('REVISION', 64)->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATED')->notNull();
	// The only mechanism of the "at most one pilot version per template" invariant
	$table->addUniqueIndex('ux_bp_wf_template_pilot_template', ['TEMPLATE_ID']);
});

$migration->table('b_bp_workflow_template_pilot_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PILOT_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	// The mirrored pair: reading the audience of a version, and checking a member by their codes
	$table->addUniqueIndex('ux_bp_wf_pilot_access_code', ['PILOT_ID', 'ACCESS_CODE']);
	$table->addIndex('ix_bp_wf_pilot_access_code_pilot', ['ACCESS_CODE', 'PILOT_ID']);
});

$migration->table('b_bp_task_archive')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->mediumBlob('TASKS_DATA')->notNull();
	$table->addIndex('ix_bp_task_archive_wf_id', ['WORKFLOW_ID']);
});

$migration->table('b_bp_task_archive_tasks')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ARCHIVE_ID')->notNull();
	$columns->int('TASK_ID')->notNull();
	$columns->datetime('COMPLETED_AT')->notNull();
	$table->addIndex('ix_bp_task_archive_tasks_task_archive', ['TASK_ID', 'ARCHIVE_ID']);
	$table->addIndex('ix_bp_task_archive_tasks_archive_completed_at', ['ARCHIVE_ID', 'COMPLETED_AT']);
	$table->addIndex('ix_bp_task_archive_tasks_competed_at_archive', ['COMPLETED_AT', 'ARCHIVE_ID']);
});

$migration->table('b_bp_robot_version_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('ROBOT_CODE', 255)->notNull();
	$columns->int('VERSION')->notNull();
	$columns->date('DATE_CHANGED')->notNull();
	$table->addUniqueIndex('ux_bp_robot_version_index_robot_code', ['ROBOT_CODE']);
	$table->addIndex('ix_bp_robot_version_index_date_changed', ['DATE_CHANGED']);
});

$migration->table('b_bp_workflow_template_trigger')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('TRIGGER_NAME', 128)->notNull();
	$columns->varchar('TRIGGER_TYPE', 128)->notNull();
	$columns->text('APPLY_RULES');
	$columns->varchar('MODULE_ID', 32)->notNull();
	$columns->varchar('ENTITY', 64)->notNull();
	$columns->varchar('DOCUMENT_TYPE', 128)->notNull();
	$table->addPrimaryKeys(['TEMPLATE_ID', 'TRIGGER_NAME']);
	$table->addIndex('ix_bp_wtt_tt', ['TRIGGER_TYPE']);
	$table->addIndex('ix_bp_wtt_med', ['MODULE_ID', 'ENTITY', 'DOCUMENT_TYPE']);
});

$migration->table('b_bp_workflow_trigger_schedule')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('TRIGGER_NAME', 128)->notNull();
	$columns->varchar('SCHEDULE_TYPE', 16)->notNull();
	$columns->mediumText('SCHEDULE_DATA')->notNull();
	$columns->datetime('NEXT_RUN_AT');
	$columns->datetime('LAST_RUN_AT');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('ux_bp_wts_template_trigger', ['TEMPLATE_ID', 'TRIGGER_NAME']);
	$table->addIndex('ix_bp_wts_next', ['NEXT_RUN_AT']);
});

$migration->table('b_bp_workflow_template_section')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('SECTION_ID', 255)->notNull();
	$columns->varchar('PATH', 255);
	$columns->datetime('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('ix_bp_wts_template_section_path', ['TEMPLATE_ID', 'SECTION_ID', 'PATH']);
});

$migration->table('b_bp_storage_type')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('CODE', 64);
	$columns->text('DESCRIPTION');
	$columns->int('CREATED_BY')->notNull();
	$columns->int('UPDATED_BY')->notNull();
	$columns->datetime('CREATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_TIME')->notNull()->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addUniqueIndex('ix_bp_storage_type_code', ['CODE']);
});

$migration->table('b_bp_storage_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('STORAGE_ID')->notNull();
	$columns->varchar('CODE', 100)->notNull();
	$columns->int('SORT')->notNull()->default('500');
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('DESCRIPTION');
	$columns->varchar('TYPE', 50)->notNull();
	$columns->char('MULTIPLE', 1)->notNull()->default('N');
	$columns->char('MANDATORY', 1)->notNull()->default('N');
	$columns->text('SETTINGS');
	$table->addUniqueIndex('ux_storage_code', ['STORAGE_ID', 'CODE']);
});

$migration->table('b_bp_storage_record_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('STORAGE_ID')->notNull();
	$columns->mediumText('VALUE')->notNull();
	$columns->varchar('CODE', 255);
	$columns->varchar('DOCUMENT_ID', 128)->notNull();
	$columns->varchar('WORKFLOW_ID', 32)->notNull();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->datetime('CREATED_TIME')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_TIME')->notNull()->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$columns->int('CREATED_BY')->notNull();
	$columns->int('UPDATED_BY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_storage_record_data_time_storage', ['CREATED_TIME', 'STORAGE_ID']);
	$table->addIndex('ix_storage_record_data_document_storage', ['DOCUMENT_ID', 'STORAGE_ID']);
	$table->addIndex('ix_storage_record_data_storage', ['STORAGE_ID']);
	$table->addIndex('ix_storage_record_data_storage_time', ['STORAGE_ID', 'CREATED_TIME']);
	// Keyset batches of the rows owned by a template, used while removing a managed AI-agent copy.
	$table->addIndex('ix_bp_storage_record_data_template', ['TEMPLATE_ID', 'ID']);
});

$migration->table('b_bp_workflow_template_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$table->addUniqueIndex('ux_bp_wf_template_file_template_id', ['TEMPLATE_ID', 'FILE_ID']);
});

$migration->table('b_bp_messenger_workflow_start_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('QUEUE_ID', 255)->notNull();
	$columns->varchar('ITEM_ID', 255);
	$columns->varchar('CLASS', 255)->notNull();
	$columns->text('PAYLOAD')->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$columns->int('TTL')->notNull();
	$columns->datetime('AVAILABLE_AT')->notNull();
	$columns->varchar('STATUS', 255)->notNull();
	$table->addIndex('IX_QUEUE_ID_STATUS_AVAILABLE_AT', ['QUEUE_ID', 'STATUS', 'AVAILABLE_AT']);
	$table->addIndex('IX_STATUS_AVAILABLE_AT', ['STATUS', 'UPDATED_AT']);
});

$migration->table('b_bp_messenger_workflow_resume_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
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
	$table->addIndex('IX_QUEUE_ID_AVAILABLE_AT', ['QUEUE_ID', 'AVAILABLE_AT']);
	$table->addIndex('IX_QUEUE_ID_ITEM_ID', ['QUEUE_ID', 'ITEM_ID']);
});

$migration->table('b_bp_workflow_template_user_data')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('ENTITY_ID', 50)->notNull();
	$columns->varchar('TYPE', 50)->notNull();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('VALUE', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_bp_wf_tpl_ud_type_entity_name', ['TYPE', 'ENTITY_ID', 'NAME']);
	$table->addIndex('ix_bp_wf_tpl_ud_tpl_type', ['TEMPLATE_ID', 'TYPE']);
});

$migration->table('b_bp_debug')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64);
	$columns->varchar('DOCUMENT_ID', 128);
	$columns->char('ENABLED', 1)->notNull()->default('Y');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp()->currentTimestampOnUpdate();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BP_DEBUG_USER_ID', ['USER_ID']);
	$table->addIndex('IX_BP_DEBUG_USER_TEMPLATE_ID', ['USER_ID', 'TEMPLATE_ID']);
});

$migration->table('b_bp_debug_session')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('DEBUG_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64);
	$columns->varchar('DOCUMENT_ID', 128);
	$columns->varchar('WORKFLOW_ID', 32);
	$columns->int('TEMPLATE_ID');
	$columns->decimal('START_TIME', 16, 6)->notNull();
	$columns->decimal('END_TIME', 16, 6);
	$columns->text('METADATA');
	$columns->text('LOGS');
	$columns->text('METRICS');
	$columns->datetime('CREATED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_bp_debug_trace')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('DEBUG_SESSION_ID')->notNull();
	$columns->varchar('KEY', 255)->notNull();
	$columns->varchar('TYPE', 50)->notNull();
	$columns->varchar('MESSAGE', 255);
	$columns->text('DATA');
	$columns->text('CONTEXT');
	$columns->decimal('TIMESTAMP', 16, 6)->notNull();
	$columns->datetime('CREATED_AT')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_BP_DEBUG_SESSION_ID', ['DEBUG_SESSION_ID']);
});

$migration->table('b_bp_storage_record_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('RECORD_ID')->notNull();
	$columns->int('FIELD_ID')->notNull();
	$columns->text('VALUE')->notNull();
	$columns->decimal('VALUE_NUM', 18, 4);
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_storage_record_field_record_field', ['RECORD_ID', 'FIELD_ID']);
	$table->addIndex('ix_storage_record_field_value_record', ['FIELD_ID', 'VALUE(100)', 'RECORD_ID']);
	$table->addIndex('ix_storage_record_field_num_record', ['FIELD_ID', 'VALUE_NUM', 'RECORD_ID']);
});

$migration->table('b_bp_storage_data_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('STORAGE_TYPE_ID')->notNull();
	$columns->text('DEFINITION');
	$columns->char('STATUS', 1)->notNull()->default('N');
	$columns->text('ERROR_TEXT');
	$columns->mediumText('DELETION_MARKS');
	$columns->datetime('MATERIALIZED_AT');
	$columns->int('MATERIALIZED_BY');
	$columns->int('OWNER_TEMPLATE_ID');
	$columns->varchar('OWNER_ACTIVITY_NAME', 255);
	$columns->int('CREATED_BY')->notNull();
	$columns->int('UPDATED_BY')->notNull();
	$columns->datetime('CREATED_TIME')->notNull()->defaultCurrentTimestamp();

	$columns->datetime('UPDATED_TIME')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('ix_bp_storage_data_view_st', ['STORAGE_TYPE_ID']);
	$table->addIndex('ix_bp_storage_data_view_owner', ['OWNER_TEMPLATE_ID', 'OWNER_ACTIVITY_NAME']);
});

$migration->table('b_bp_workflow_last_values')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->datetime('VERSION_KEY')->notNull();
	$columns->varchar('WORKFLOW_ID', 32);
	$columns->varchar('MODULE_ID', 32);
	$columns->varchar('ENTITY', 64);
	$columns->varchar('DOCUMENT_ID', 128);
	$columns->int('STATUS')->notNull()->default('0');
	$columns->datetime('COMPLETED_AT')->notNull();
	$columns->datetime('UPDATED_AT')->notNull();
	$columns->text('VALUES_DATA')->notNull();
	$table->addPrimaryKey('TEMPLATE_ID');
	$table->addIndex('IX_BP_WF_LAST_VALUES_COMPLETED', ['COMPLETED_AT']);
});

$migration->table('b_bp_access_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 250)->notNull();
});

$migration->table('b_bp_access_role_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('RELATION', 100)->notNull()->default('');
	$table->addIndex('ix_bp_access_rel_role', ['ROLE_ID']);
	$table->addIndex('ix_bp_access_rel_code', ['RELATION']);
});

$migration->table('b_bp_access_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ROLE_ID')->unsigned()->notNull();
	$columns->varchar('PERMISSION_ID', 32)->notNull()->default('0');
	$columns->int('VALUE')->notNull()->default(0);
	$table->addIndex('ix_bp_access_perm_role', ['ROLE_ID']);
	$table->addIndex('ix_bp_access_perm_pid', ['PERMISSION_ID']);
	$table->addIndex('ix_bp_access_perm_value_pid', ['VALUE', 'PERMISSION_ID']);
	$table->addIndex('ix_bp_access_perm_role_pid_value', ['ROLE_ID', 'PERMISSION_ID', 'VALUE']);
});

// Managed copies of system AI agents: the instance row owns the launched copy, the resource rows own
// everything created around it. No foreign keys: resource rows are deleted explicitly, the instance row last.
$migration->table('b_bp_managed_agent_instance')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->char('IDENTITY_HASH', 64)->notNull();
	$columns->varchar('SYSTEM_CODE', 50)->notNull();
	$columns->varchar('CONTEXT_NAMESPACE', 64)->notNull();
	$columns->varchar('CONTEXT_TYPE', 64)->notNull();
	$columns->varchar('CONTEXT_ID', 128)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('TEMPLATE_ID');
	$columns->varchar('STATE', 24)->notNull();
	$columns->char('CONFIG_FINGERPRINT', 64)->notNull();
	$columns->int('RETRY_COUNT')->notNull()->default('0');
	$columns->datetime('NEXT_RETRY_AT');
	$columns->varchar('LAST_ERROR_CODE', 64);
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('UPDATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_bp_ma_instance_identity', ['IDENTITY_HASH']);
	$table->addUniqueIndex('ux_bp_ma_instance_template', ['TEMPLATE_ID']);
	$table->addIndex('ix_bp_ma_instance_cleanup', ['STATE', 'NEXT_RETRY_AT', 'ID']);
});

$migration->table('b_bp_managed_agent_resource')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->bigInt('INSTANCE_ID')->notNull();
	$columns->varchar('TYPE', 32)->notNull();
	$columns->varchar('RESOURCE_ID', 128)->notNull();
	$columns->mediumText('DATA');
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ux_bp_ma_resource_identity', ['INSTANCE_ID', 'TYPE', 'RESOURCE_ID']);
	$table->addIndex('ix_bp_ma_resource_cleanup', ['INSTANCE_ID', 'TYPE', 'ID']);
	$table->addIndex('ix_bp_ma_resource_lookup', ['TYPE', 'RESOURCE_ID']);
});

// The registry is asked about on the creation and on the completion path of every workflow of the portal, so
// the presence of its two tables is stated here instead of being probed by the first request that needs it.
// Written only after both tables are really there: a create that failed must not be remembered as a schema.
if (
	$migration->context()->tableExists('b_bp_managed_agent_instance')
	&& $migration->context()->tableExists('b_bp_managed_agent_resource')
)
{
	$migration->option()->set('bizproc', 'ai_agent_registry_schema_ready', 'Y');
}
