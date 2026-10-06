<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_ai_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->char('HASH', 32)->notNull();
	$columns->varchar('ENGINE_CLASS', 100)->notNull();
	$columns->varchar('ENGINE_CODE', 100);
	$columns->text('ENGINE_CUSTOM_SETTINGS');
	$columns->varchar('PAYLOAD_CLASS', 100)->notNull();
	$columns->mediumText('PAYLOAD')->notNull();
	$columns->text('CONTEXT');
	$columns->text('PARAMETERS');
	$columns->char('HISTORY_WRITE', 1)->default('N');
	$columns->int('HISTORY_GROUP_ID');
	$columns->char('CACHE_HASH', 32);
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('EXPIRE_DATE');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_DATE_CREATE', ['DATE_CREATE']);
	$table->addIndex('IX_B_EXPIRE_DATE', ['EXPIRE_DATE']);
	$table->addUniqueIndex('IX_B_HASH', ['HASH']);
});

$migration->table('b_ai_history')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CONTEXT_MODULE', 100)->notNull();
	$columns->varchar('CONTEXT_ID', 100)->notNull();
	$columns->varchar('ENGINE_CLASS', 100)->notNull();
	$columns->varchar('ENGINE_CODE', 100);
	$columns->varchar('PAYLOAD_CLASS', 100)->notNull();
	$columns->mediumText('PAYLOAD')->notNull();
	$columns->text('PARAMETERS');
	$columns->int('GROUP_ID')->notNull()->default('-1');
	$columns->mediumText('REQUEST_TEXT');
	$columns->text('RESULT_TEXT');
	$columns->mediumText('CONTEXT');
	$columns->boolean('CACHED')->default('0');
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CREATED_BY', ['CREATED_BY_ID']);
	$table->addIndex('IX_B_AI_HISTORY_PERF_01', ['CONTEXT_ID', 'CREATED_BY_ID', 'CONTEXT_MODULE', 'GROUP_ID']);
});

$migration->table('b_ai_engine')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('APP_CODE', 128);
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('CODE', 100)->notNull();
	$columns->varchar('CATEGORY', 20)->notNull();
	$columns->varchar('COMPLETIONS_URL', 250)->notNull();
	$columns->text('SETTINGS');
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_APP_CODE', ['APP_CODE', 'CODE']);
	$table->addIndex('IX_B_CODE', ['CODE']);
});

$migration->table('b_ai_prompt')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('APP_CODE', 128);
	$columns->int('PARENT_ID');
	$columns->text('CACHE_CATEGORY');
	$columns->varchar('SECTION', 20);
	$columns->int('AUTHOR_ID')->notNull()->default('0');
	$columns->int('EDITOR_ID')->notNull()->default('0');
	$columns->int('SORT');
	$columns->varchar('CODE', 100)->notNull();
	$columns->varchar('TYPE', 32);
	$columns->varchar('ICON', 50);
	$columns->char('HASH', 32)->notNull();
	$columns->text('PROMPT');
	$columns->varchar('DEFAULT_TITLE', 255)->default('');
	$columns->text('TEXT_TRANSLATES');
	$columns->text('SETTINGS');
	$columns->char('WORK_WITH_RESULT', 1)->notNull()->default('N');
	$columns->tinyInt('IS_NEW')->unsigned()->default('0');
	$columns->tinyInt('IS_ACTIVE')->unsigned()->default('1');
	$columns->char('IS_SYSTEM', 1)->notNull()->default('N');
	$columns->text('JSON_OUTPUT_SCHEMA');
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_APP_CODE', ['APP_CODE']);
	$table->addIndex('IX_B_CODE', ['CODE']);
	$table->addIndex('IX_B_PARENT_ID', ['PARENT_ID']);
	$table->addIndex('IX_B_IS_NEW', ['IS_NEW']);
	$table->addIndex('IX_B_IS_SYSTEM', ['IS_SYSTEM']);
});

$migration->table('b_ai_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 100)->notNull();
	$columns->varchar('INDUSTRY_CODE', 100);
	$columns->text('NAME_TRANSLATES');
	$columns->text('DESCRIPTION_TRANSLATES');
	$columns->varchar('DEFAULT_NAME', 255)->default('');
	$columns->varchar('DEFAULT_DESCRIPTION', 255)->default('');
	$columns->int('AUTHOR_ID')->notNull()->default('0');
	$columns->int('EDITOR_ID')->notNull()->default('0');
	$columns->char('HASH', 32)->notNull();
	$columns->text('INSTRUCTION')->notNull();
	$columns->text('AVATAR')->notNull();
	$columns->tinyInt('IS_NEW')->unsigned()->default('0');
	$columns->tinyInt('IS_ACTIVE')->default('1');
	$columns->tinyInt('IS_RECOMMENDED')->unsigned()->default('0');
	$columns->char('IS_SYSTEM', 1)->notNull()->default('Y');
	$columns->int('SORT');
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CODE', ['CODE']);
	$table->addIndex('IX_B_IS_NEW', ['IS_NEW']);
	$table->addIndex('IX_B_IS_RECOMMENDED', ['IS_RECOMMENDED']);
	$table->addIndex('IX_B_SORT', ['SORT']);
	$table->addIndex('IX_B_INDUSTRY_CODE', ['INDUSTRY_CODE']);
});

$migration->table('b_ai_role_prompt')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ROLE_ID')->notNull();
	$columns->int('PROMPT_ID')->notNull();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKeys(['ROLE_ID', 'PROMPT_ID']);
});

$migration->table('b_ai_role_industry')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 100)->notNull();
	$columns->char('HASH', 32)->notNull();
	$columns->text('NAME_TRANSLATES')->notNull();
	$columns->tinyInt('IS_NEW')->unsigned()->default('0');
	$columns->int('SORT');
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('IX_B_CODE', ['CODE']);
	$table->addIndex('IX_B_SORT', ['SORT']);
});

$migration->table('b_ai_recent_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('ROLE_CODE', 100)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->timestamp('DATE_TOUCH')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('IX_B_ROLE_USER', ['USER_ID', 'ROLE_CODE']);
	$table->addIndex('IX_B_DATE_TOUCH', ['DATE_TOUCH']);
});

$migration->table('b_ai_role_favorite')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('ROLE_CODE', 100)->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addUniqueIndex('IX_B_FAVORITE_ROLE_USER', ['USER_ID', 'ROLE_CODE']);
});

$migration->table('b_ai_plan')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 100)->notNull();
	$columns->char('HASH', 32)->notNull();
	$columns->int('MAX_USAGE')->notNull();
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CODE', ['CODE']);
});

$migration->table('b_ai_usage')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('USAGE_PERIOD', 50)->notNull();
	$columns->int('USAGE_COUNT')->notNull()->default('1');
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_USER_PERIOD', ['USER_ID', 'USAGE_PERIOD']);
	$table->addIndex('IX_B_USER_ID', ['USER_ID']);
	$table->addIndex('IX_B_AI_USAGE_PERIOD', ['USAGE_PERIOD']);
});

$migration->table('b_ai_section')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('CODE', 100)->notNull();
	$columns->char('HASH', 32)->notNull();
	$columns->text('TRANSLATE')->notNull();
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_CODE', ['CODE']);
});

$migration->table('b_ai_prompt_share')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PROMPT_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_ACCESS_CODE', ['ACCESS_CODE']);
	$table->addIndex('IX_B_PROMPT_ID', ['PROMPT_ID']);
	$table->addUniqueIndex('IX_B_PROMPT_OWNER', ['PROMPT_ID', 'ACCESS_CODE']);
});

$migration->table('b_ai_prompt_owner')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('PROMPT_ID')->notNull();
	$columns->tinyInt('IS_FAVORITE')->default('0');
	$columns->tinyInt('IS_DELETED')->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_USER_ID', ['USER_ID']);
	$table->addIndex('IX_B_PROMPT_ID', ['PROMPT_ID']);
	$table->addUniqueIndex('IX_B_PROMPT_OWNER', ['USER_ID', 'PROMPT_ID']);
});

$migration->table('b_ai_prompt_owner_option')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->text('SORTING_IN_FAVORITE_LIST');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_B_USER_ID', ['USER_ID']);
});

$migration->table('b_ai_prompt_category')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('PROMPT_ID')->notNull();
	$columns->varchar('CODE', 100)->notNull();
	$table->addUniqueIndex('IX_B_PROMPT_OWNER', ['PROMPT_ID', 'CODE']);
	$table->addIndex('IX_B_PROMPT_ID', ['PROMPT_ID']);
	$table->addIndex('IX_B_CODE', ['CODE']);
});

$migration->table('b_ai_baas_package')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->date('DATE_START')->notNull();
	$columns->date('DATE_EXPIRED')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_DATE_EXPIRED', ['DATE_EXPIRED']);
});

$migration->table('b_ai_counter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 100)->notNull();
	$columns->varchar('VALUE', 200);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_option_name', ['NAME']);
});

$migration->table('b_ai_prompt_translate_name')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('PROMPT_ID')->notNull();
	$columns->varchar('LANG', 5)->notNull();
	$columns->varchar('TEXT', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_PROMPT_ID', ['PROMPT_ID']);
	$table->addUniqueIndex('IX_B_PROMPT_LANG', ['PROMPT_ID', 'LANG']);
});

$migration->table('b_ai_prompt_display_rule')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PROMPT_ID')->notNull();
	$columns->varchar('NAME', 25)->notNull();
	$columns->tinyInt('IS_CHECK_INVERT')->default('1');
	$columns->varchar('VALUE', 100)->notNull();
	$table->addIndex('IX_B_PROMPT_ID', ['PROMPT_ID']);
	$table->addIndex('IX_B_RULE_NAME', ['NAME']);
});

$migration->table('b_ai_role_display_rule')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('NAME', 25)->notNull();
	$columns->tinyInt('IS_CHECK_INVERT')->default('1');
	$columns->varchar('VALUE', 100)->notNull();
	$table->addIndex('IX_B_PROMPT_ID', ['ROLE_ID']);
	$table->addIndex('IX_B_RULE_NAME', ['NAME']);
});

$migration->table('b_ai_image_style_prompt')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CODE', 100)->notNull();
	$columns->char('HASH', 32)->notNull();
	$columns->text('PROMPT');
	$columns->text('NAME_TRANSLATES')->notNull();
	$columns->varchar('PREVIEW', 255)->notNull();
	$columns->int('SORT');
	$columns->timestamp('DATE_MODIFY')->notNull()->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CODE', ['CODE']);
});

$migration->table('b_ai_role_owner')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('ROLE_ID')->notNull();
	$columns->tinyInt('IS_DELETED')->default('0');
	$table->addIndex('IX_B_USER_ID', ['USER_ID']);
	$table->addIndex('IX_B_ROLE_ID', ['ROLE_ID']);
	$table->addUniqueIndex('IX_B_ROLE_OWNER', ['USER_ID', 'ROLE_ID']);
});

$migration->table('b_ai_role_share')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	$columns->timestamp('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->int('CREATED_BY')->notNull();
	$table->addIndex('IX_B_ACCESS_CODE', ['ACCESS_CODE']);
	$table->addIndex('IX_B_ROLE_ID', ['ROLE_ID']);
	$table->addUniqueIndex('IX_B_ROLE_ACCESSORS', ['ROLE_ID', 'ACCESS_CODE']);
});

$migration->table('b_ai_role_translate_name')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('LANG', 5)->notNull();
	$columns->varchar('TEXT', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_ROLE_ID', ['ROLE_ID']);
	$table->addUniqueIndex('IX_B_ROLE_LANG', ['ROLE_ID', 'LANG']);
});

$migration->table('b_ai_role_translate_description')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('LANG', 5)->notNull();
	$columns->varchar('TEXT', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_ROLE_ID', ['ROLE_ID']);
	$table->addUniqueIndex('IX_B_ROLE_LANG', ['ROLE_ID', 'LANG']);
});

$migration->table('b_ai_chatbot_chatbot')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('CLASS', 255)->notNull();
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CHAT_CODE', ['CODE']);
});

$migration->table('b_ai_chatbot_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CHATBOT_ID');
	$columns->varchar('CODE', 255)->notNull();
	$columns->int('AUTHOR_ID');
	$columns->text('PARAMS');
	$columns->varchar('INPUT_STATUS', 255);
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$table->addUniqueIndex('IX_B_CHATBOT_ID_MESSAGE_ID', ['CHATBOT_ID', 'CODE']);
});

$migration->table('b_ai_chatbot_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$columns->varchar('TYPE', 20)->notNull();
	$columns->text('CONTENT')->notNull();
	$columns->text('PARAMS');
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CHATBOT_MESSAGE_CHAT_ID', ['CHAT_ID']);
});

$migration->table('b_ai_chatbot_message_unread')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->datetime('DATE_CREATE')->defaultCurrentTimestamp();
	$table->addIndex('IX_B_CHATBOT_CHAT_ID_MESSAGE_ID', ['CHAT_ID', 'MESSAGE_ID']);
});

$migration->table('b_ai_bitrix_engine')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('CLASS', 255)->notNull();
	$columns->varchar('CATEGORY', 255)->notNull();
	$columns->tinyInt('IS_ACTIVE')->default('1');
	$table->addIndex('IX_B_AI_BITRIX_ENGINE_CLASS', ['CLASS']);
});
