<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_im_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PARENT_ID')->default('0');
	$columns->int('PARENT_MID')->default('0');
	$columns->varchar('TITLE', 255);
	$columns->text('DESCRIPTION');
	$columns->varchar('COLOR', 255);
	$columns->char('TYPE', 1);
	$columns->char('EXTRANET', 1);
	$columns->int('AUTHOR_ID')->notNull();
	$columns->int('AVATAR');
	$columns->int('PIN_MESSAGE_ID')->default('0');
	$columns->smallInt('CALL_TYPE')->default('0');
	$columns->varchar('CALL_NUMBER', 20);
	$columns->varchar('ENTITY_TYPE', 50);
	$columns->varchar('ENTITY_ID', 255);
	$columns->varchar('ENTITY_DATA_1', 255);
	$columns->varchar('ENTITY_DATA_2', 255);
	$columns->varchar('ENTITY_DATA_3', 255);
	$columns->int('DISK_FOLDER_ID');
	$columns->int('MESSAGE_COUNT')->default('0');
	$columns->int('USER_COUNT')->default('0');
	$columns->int('PREV_MESSAGE_ID');
	$columns->int('LAST_MESSAGE_ID');
	$columns->varchar('LAST_MESSAGE_STATUS', 50)->default('received');
	$columns->datetime('DATE_CREATE');
	$columns->varchar('MANAGE_USERS', 255)->notNull()->default('MEMBER');
	$columns->varchar('MANAGE_USERS_ADD', 255)->notNull()->default('MEMBER');
	$columns->varchar('MANAGE_USERS_DELETE', 255)->notNull()->default('MANAGER');
	$columns->varchar('MANAGE_UI', 255)->notNull()->default('MEMBER');
	$columns->varchar('MANAGE_SETTINGS', 255)->notNull()->default('OWNER');
	$columns->int('DISAPPEARING_TIME');
	$columns->varchar('CAN_POST', 255)->notNull()->default('MEMBER');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_CHAT_1', ['AUTHOR_ID', 'TYPE']);
	$table->addIndex('IX_IM_CHAT_2', ['ENTITY_TYPE', 'ENTITY_ID', 'AUTHOR_ID']);
	$table->addIndex('IX_IM_CHAT_3', ['CALL_NUMBER', 'AUTHOR_ID']);
	$table->addIndex('IX_IM_CHAT_4', ['TYPE']);
	$table->addIndex('IX_IM_CHAT_5', ['PARENT_ID', 'PARENT_MID']);
	$table->addIndex('IX_IM_CHAT_6', ['AVATAR']);
});

$migration->table('b_im_chat_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CHAT_ID')->notNull();
	$columns->mediumText('SEARCH_CONTENT');
	$columns->varchar('SEARCH_TITLE', 511);
	$table->addPrimaryKey('CHAT_ID');
	$table->addIndex('IX_IM_CHAT_INDEX_1', ['SEARCH_TITLE']);
	$table->addFulltextIndex('IXF_IM_CHAT_INDEX_1', ['SEARCH_CONTENT']);
	$table->addFulltextIndex('IXF_IM_CHAT_INDEX_2', ['SEARCH_TITLE']);
});

$migration->table('b_im_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$columns->text('MESSAGE');
	$columns->text('MESSAGE_OUT');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->varchar('EMAIL_TEMPLATE', 255);
	$columns->smallInt('NOTIFY_TYPE')->default('0');
	$columns->varchar('NOTIFY_MODULE', 255);
	$columns->varchar('NOTIFY_EVENT', 255);
	$columns->varchar('NOTIFY_TAG', 255);
	$columns->varchar('NOTIFY_SUB_TAG', 255);
	$columns->varchar('NOTIFY_TITLE', 255);
	$columns->text('NOTIFY_BUTTONS');
	$columns->char('NOTIFY_READ', 1)->default('N');
	$columns->int('IMPORT_ID');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_MESS_2', ['NOTIFY_TAG', 'AUTHOR_ID']);
	$table->addIndex('IX_IM_MESS_3', ['NOTIFY_SUB_TAG', 'AUTHOR_ID']);
	$table->addIndex('IX_IM_MESS_4', ['CHAT_ID', 'NOTIFY_READ']);
	$table->addIndex('IX_IM_MESS_5', ['CHAT_ID', 'DATE_CREATE']);
	$table->addIndex('IX_IM_MESS_8', ['NOTIFY_TYPE', 'DATE_CREATE']);
	$table->addIndex('IX_IM_MESS_10', ['AUTHOR_ID', 'CHAT_ID']);
});

$migration->table('b_im_message_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->mediumText('SEARCH_CONTENT');
	$table->addPrimaryKey('MESSAGE_ID');
	$table->addFulltextIndex('IXF_IM_MESSAGE_INDEX_1', ['SEARCH_CONTENT']);
});

$migration->table('b_im_message_param')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->varchar('PARAM_NAME', 100)->notNull();
	$columns->varchar('PARAM_VALUE', 100);
	$columns->text('PARAM_JSON');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_IM_MESSAGE_PARAM_1', ['MESSAGE_ID', 'PARAM_NAME']);
	$table->addIndex('IX_B_IM_MESSAGE_PARAM_2', ['PARAM_NAME', 'PARAM_VALUE(50)', 'MESSAGE_ID']);
});

$migration->table('b_im_message_favorite')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addUniqueIndex('pk_b_im_message_favorite', ['ID']);
	$table->addIndex('IX_B_IM_MESSAGE_FAVORITE_1', ['USER_ID', 'DATE_CREATE DESC']);
	$table->addIndex('IX_B_IM_MESSAGE_FAVORITE_2', ['CHAT_ID', 'DATE_CREATE DESC']);
});

$migration->table('b_im_status')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('COLOR', 255);
	$columns->varchar('STATUS', 50)->default('online');
	$columns->varchar('STATUS_TEXT', 255);
	$columns->datetime('IDLE');
	$columns->datetime('DESKTOP_LAST_DATE');
	$columns->datetime('MOBILE_LAST_DATE');
	$columns->int('EVENT_ID');
	$columns->datetime('EVENT_UNTIL_DATE');
	$columns->char('INVITED', 1)->default('N');
	$columns->char('EVENT_LOG', 1)->notNull()->default('N');
	$table->addPrimaryKey('USER_ID');
	$table->addIndex('IX_IM_STATUS_EUD', ['EVENT_UNTIL_DATE']);
});

$migration->table('b_im_relation')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID')->notNull();
	$columns->char('MESSAGE_TYPE', 1)->default('P');
	$columns->int('USER_ID')->notNull();
	$columns->int('START_ID')->default('0');
	$columns->int('UNREAD_ID')->default('0');
	$columns->int('LAST_ID')->default('0');
	$columns->int('LAST_SEND_ID')->default('0');
	$columns->int('LAST_FILE_ID')->default('0');
	$columns->datetime('LAST_READ');
	$columns->smallInt('STATUS')->default('0');
	$columns->smallInt('CALL_STATUS')->default('0');
	$columns->varchar('MESSAGE_STATUS', 50)->default('received');
	$columns->char('NOTIFY_BLOCK', 1)->default('N');
	$columns->char('MANAGER', 1)->default('N');
	$columns->int('COUNTER')->default('0');
	$columns->int('START_COUNTER')->default('0');
	$columns->int('LAST_SEND_MESSAGE_ID')->notNull()->default('0');
	$columns->varchar('REASON', 50)->notNull()->default('');
	$columns->char('IS_HIDDEN', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_REL_2', ['USER_ID', 'MESSAGE_TYPE', 'STATUS']);
	$table->addIndex('IX_IM_REL_3', ['USER_ID', 'MESSAGE_TYPE', 'CHAT_ID']);
	$table->addIndex('IX_IM_REL_4', ['USER_ID', 'STATUS']);
	$table->addIndex('IX_IM_REL_5', ['MESSAGE_TYPE', 'STATUS']);
	$table->addIndex('IX_IM_REL_6', ['CHAT_ID', 'USER_ID']);
	$table->addIndex('IX_IM_REL_8', ['STATUS', 'COUNTER']);
	$table->addIndex('IX_IM_REL_9', ['USER_ID', 'CHAT_ID']);
	$table->addIndex('IX_IM_REL_10', ['CHAT_ID', 'LAST_SEND_MESSAGE_ID']);
});

$migration->table('b_im_recent')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->char('ITEM_TYPE', 1)->notNull()->default('P');
	$columns->int('ITEM_ID')->notNull();
	$columns->int('ITEM_MID')->notNull();
	$columns->int('ITEM_CID')->default('0');
	$columns->int('ITEM_RID')->default('0');
	$columns->int('ITEM_OLID')->default('0');
	$columns->char('PINNED', 1)->default('N');
	$columns->char('UNREAD', 1)->default('N');
	$columns->datetime('DATE_MESSAGE');
	$columns->datetime('DATE_UPDATE');
	$columns->int('MARKED_ID');
	$columns->int('PIN_SORT');
	$columns->datetime('DATE_LAST_ACTIVITY')->notNull()->defaultCurrentTimestamp();
	$columns->int('PREVIEW_SOURCE_CID')->notNull()->default('0');
	$columns->int('PREVIEW_SOURCE_MID')->notNull()->default('0');
	$table->addPrimaryKeys(['USER_ID', 'ITEM_TYPE', 'ITEM_ID']);
	$table->addIndex('IX_IM_REC_1', ['ITEM_TYPE', 'ITEM_ID']);
	$table->addIndex('IX_IM_REC_2', ['DATE_UPDATE']);
	$table->addIndex('IX_IM_REC_3', ['ITEM_RID']);
	$table->addIndex('IX_IM_REC_4', ['ITEM_MID']);
	$table->addIndex('IX_IM_REC_5', ['USER_ID', 'ITEM_CID']);
	$table->addIndex('IX_IM_REC_6', ['PINNED', 'USER_ID', 'PIN_SORT']);
	$table->addIndex('IX_IM_REC_7', ['ITEM_CID', 'USER_ID']);
	$table->addIndex('IX_IM_REC_8', ['USER_ID', 'DATE_LAST_ACTIVITY']);
	$table->addIndex('IX_IM_REC_9', ['USER_ID', 'PINNED', 'DATE_LAST_ACTIVITY']);
});

$migration->table('b_im_last_search')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('DIALOG_ID', 50)->notNull();
	$columns->int('ITEM_CID')->notNull()->default('0');
	$columns->int('ITEM_RID')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_LS_2', ['USER_ID', 'DIALOG_ID']);
});

$migration->table('b_im_bot')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('BOT_ID')->notNull();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$columns->char('TYPE', 1)->notNull()->default('B');
	$columns->varchar('CLASS', 255);
	$columns->varchar('LANG', 50)->default('');
	$columns->varchar('METHOD_BOT_DELETE', 255);
	$columns->varchar('METHOD_MESSAGE_ADD', 255);
	$columns->varchar('METHOD_MESSAGE_UPDATE', 255);
	$columns->varchar('METHOD_MESSAGE_DELETE', 255);
	$columns->varchar('METHOD_WELCOME_MESSAGE', 255);
	$columns->varchar('METHOD_CONTEXT_GET', 255);
	$columns->varchar('METHOD_REACTION_CHANGE', 255);
	$columns->text('TEXT_PRIVATE_WELCOME_MESSAGE');
	$columns->text('TEXT_CHAT_WELCOME_MESSAGE');
	$columns->int('COUNT_COMMAND')->default('0');
	$columns->int('COUNT_MESSAGE')->default('0');
	$columns->int('COUNT_CHAT')->default('0');
	$columns->int('COUNT_USER')->default('0');
	$columns->varchar('APP_ID', 128);
	$columns->char('VERIFIED', 1)->default('N');
	$columns->char('OPENLINE', 1)->default('N');
	$columns->char('HIDDEN', 1)->default('N');
	$columns->char('REACTIONS_ENABLED', 1)->default('N');
	$columns->varchar('BACKGROUND_ID', 50);
	$columns->varchar('EVENT_MODE', 10)->notNull()->default('WEBHOOK');
	$table->addPrimaryKey('BOT_ID');
	$table->addIndex('IX_IM_BOT_1', ['APP_ID']);
	$table->addIndex('IX_IM_BOT_2', ['CODE']);
});

$migration->table('b_im_bot_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('BOT_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_BC_1', ['BOT_ID', 'CHAT_ID']);
});

$migration->table('b_im_bot_token')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('TOKEN', 32);
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_EXPIRE');
	$columns->int('BOT_ID')->default('0');
	$columns->varchar('DIALOG_ID', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_BOT_TOKEN_1', ['DATE_EXPIRE', 'BOT_ID']);
	$table->addIndex('IX_IM_BOT_TOKEN_2', ['TOKEN']);
});

$migration->table('b_im_command')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('BOT_ID')->default('0');
	$columns->varchar('APP_ID', 128);
	$columns->varchar('COMMAND', 255)->notNull();
	$columns->char('COMMON', 1)->default('N');
	$columns->char('HIDDEN', 1)->default('N');
	$columns->char('EXTRANET_SUPPORT', 1)->default('N');
	$columns->char('SONET_SUPPORT', 1)->default('N');
	$columns->varchar('CLASS', 255);
	$columns->varchar('METHOD_COMMAND_ADD', 255);
	$columns->varchar('METHOD_LANG_GET', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_COMMAND_1', ['BOT_ID']);
});

$migration->table('b_im_command_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('COMMAND_ID')->notNull();
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->varchar('TITLE', 255);
	$columns->varchar('PARAMS', 255);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_IM_COMMAND_LANG', ['COMMAND_ID', 'LANGUAGE_ID']);
});

$migration->table('b_im_app')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('BOT_ID')->default('0');
	$columns->varchar('APP_ID', 128);
	$columns->varchar('CODE', 255)->notNull();
	$columns->varchar('HASH', 32);
	$columns->varchar('REGISTERED', 32)->default('N');
	$columns->int('ICON_FILE_ID');
	$columns->varchar('CONTEXT', 128);
	$columns->varchar('IFRAME', 255);
	$columns->int('IFRAME_WIDTH');
	$columns->int('IFRAME_HEIGHT');
	$columns->char('IFRAME_POPUP', 1)->default('N');
	$columns->varchar('JS', 255);
	$columns->char('HIDDEN', 1)->default('N');
	$columns->char('EXTRANET_SUPPORT', 1)->default('N');
	$columns->char('LIVECHAT_SUPPORT', 1)->default('N');
	$columns->varchar('CLASS', 255);
	$columns->varchar('METHOD_LANG_GET', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_APP_1', ['BOT_ID']);
});

$migration->table('b_im_app_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('APP_ID')->notNull();
	$columns->char('LANGUAGE_ID', 2)->notNull();
	$columns->varchar('TITLE', 255);
	$columns->varchar('DESCRIPTION', 255);
	$columns->varchar('COPYRIGHT', 255);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_APP_LANG', ['APP_ID', 'LANGUAGE_ID']);
});

$migration->table('b_im_alias')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('ALIAS', 255)->notNull();
	$columns->datetime('DATE_CREATE');
	$columns->varchar('ENTITY_TYPE', 255)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_IM_ALIAS', ['ALIAS']);
	$table->addIndex('IX_IM_ALIAS_3', ['ENTITY_ID', 'ENTITY_TYPE(100)']);
});

$migration->table('b_im_external_avatar')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('LINK_MD5', 32)->notNull();
	$columns->int('AVATAR_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IMOL_NA_1', ['LINK_MD5']);
});

$migration->table('b_im_no_relation_permission_disk')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID');
	$columns->int('USER_ID');
	$columns->datetime('ACTIVE_TO');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_USER_ID_CHAT_ID', ['USER_ID', 'CHAT_ID']);
});

$migration->table('b_im_call')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('TYPE');
	$columns->int('SCHEME');
	$columns->int('INITIATOR_ID');
	$columns->char('IS_PUBLIC', 1)->notNull()->default('N');
	$columns->varchar('PUBLIC_ID', 32);
	$columns->varchar('PROVIDER', 32);
	$columns->varchar('ENTITY_TYPE', 32);
	$columns->varchar('ENTITY_ID', 32);
	$columns->int('PARENT_ID');
	$columns->varchar('PARENT_UUID', 36);
	$columns->varchar('STATE', 50);
	$columns->datetime('START_DATE');
	$columns->datetime('END_DATE');
	$columns->int('CHAT_ID');
	$columns->varchar('LOG_URL', 2000);
	$columns->varchar('UUID', 36);
	$columns->varchar('SECRET_KEY', 10);
	$columns->varchar('ENDPOINT', 255);
	$columns->char('RECORD_AUDIO', 1)->notNull()->default('N');
	$columns->char('AI_ANALYZE', 1)->notNull()->default('N');
	$table->addUniqueIndex('IX_B_IM_CALL_PID', ['PUBLIC_ID']);
	$table->addIndex('IX_B_IM_CALL_ENT_ID_2', ['ENTITY_TYPE', 'ENTITY_ID', 'TYPE', 'PROVIDER', 'END_DATE']);
	$table->addIndex('IX_B_IM_CALL_CHAT_ID', ['CHAT_ID']);
	$table->addIndex('IX_IM_CALL_3', ['UUID']);
	$table->addIndex('IX_IM_CALL_STATE_START', ['STATE', 'START_DATE']);
});

$migration->table('b_im_call_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CALL_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('STATE', 50);
	$columns->datetime('FIRST_JOINED');
	$columns->datetime('LAST_SEEN');
	$columns->char('IS_MOBILE', 1);
	$columns->char('SHARED_SCREEN', 1);
	$columns->char('RECORDED', 1);
	$table->addPrimaryKeys(['CALL_ID', 'USER_ID']);
});

$migration->table('b_im_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID')->default('0');
	$columns->int('USER_ID')->default('0');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('AUTHOR_ID')->default('0');
	$columns->char('PERM_USER_PROMOTE', 1)->default('N');
	$columns->char('PERM_CHAT_INFO', 1)->default('N');
	$columns->char('PERM_USER_ADD', 1)->default('N');
	$columns->char('PERM_USER_REMOVE', 1)->default('N');
	$columns->char('PERM_MESSAGE_SEND', 1)->default('N');
	$columns->char('PERM_MESSAGE_EDIT', 1)->default('N');
	$columns->char('PERM_MESSAGE_DELETE', 1)->default('N');
	$columns->char('PERM_MESSAGE_RICH', 1)->default('N');
	$columns->char('PERM_MESSAGE_PIN', 1)->default('N');
	$columns->char('PERM_MESSAGE_POLL', 1)->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_PERM_1', ['CHAT_ID', 'USER_ID']);
});

$migration->table('b_im_permission_duration')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('PERMISSION_ID')->default('0');
	$columns->datetime('DATE_REMOVE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_PERM_DUR_1', ['PERMISSION_ID']);
	$table->addIndex('IX_IM_PERM_DUR_2', ['DATE_REMOVE']);
});

$migration->table('b_im_permission_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID')->default('0');
	$columns->int('USER_ID')->notNull();
	$columns->char('TEXT', 1)->default('N');
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_IM_PERM_LOG_1', ['CHAT_ID', 'USER_ID']);
	$table->addIndex('IX_IM_PERM_LOG_2', ['DATE_CREATE']);
});

$migration->table('b_im_block_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('BLOCK_DATE');
	$table->addPrimaryKey('ID');
});

$migration->table('b_im_conference')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ALIAS_ID')->notNull();
	$columns->text('PASSWORD');
	$columns->text('INVITATION');
	$columns->char('IS_BROADCAST', 1)->notNull()->default('N');
	$columns->datetime('CONFERENCE_START');
	$columns->datetime('CONFERENCE_END');
	$table->addPrimaryKey('ID');
});

$migration->table('b_im_conference_user_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('CONFERENCE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ROLE', 64);
	$table->addPrimaryKeys(['CONFERENCE_ID', 'USER_ID']);
});

$migration->table('b_im_option_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->autoincrement();
	$columns->varchar('NAME', 255);
	$columns->int('USER_ID')->unsigned();
	$columns->int('SORT')->unsigned()->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('CREATE_BY_ID')->unsigned()->notNull();
	$columns->datetime('DATE_MODIFY');
	$columns->int('MODIFY_BY_ID')->unsigned();
	$table->addPrimaryKey('ID');
});

$migration->table('b_im_option_state')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->unsigned()->notNull();
	$columns->varchar('NAME', 64)->notNull();
	$columns->varchar('VALUE', 255);
	$table->addPrimaryKeys(['GROUP_ID', 'NAME']);
});

$migration->table('b_im_option_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->autoincrement();
	$columns->int('GROUP_ID')->unsigned()->notNull();
	$columns->varchar('ACCESS_CODE', 100);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_B_IM_OPTION_ACCESS_1', ['GROUP_ID', 'ACCESS_CODE']);
});

$migration->table('b_im_option_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('NOTIFY_GROUP_ID')->unsigned()->notNull();
	$columns->int('GENERAL_GROUP_ID')->unsigned()->notNull();
	$table->addPrimaryKey('USER_ID');
});

$migration->table('b_im_message_uuid')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('UUID', 36)->notNull();
	$columns->int('MESSAGE_ID')->unsigned();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('UUID');
	$table->addIndex('UX_B_IM_MESSAGE_DATE_CREATE', ['DATE_CREATE']);
	$table->addIndex('UX_B_IM_MESSAGE_UUID_MESSAGE_ID', ['MESSAGE_ID']);
});

$migration->table('b_im_message_viewed')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_IM_MESS_VIEWED', ['USER_ID', 'CHAT_ID', 'MESSAGE_ID']);
	$table->addIndex('IX_IM_MESS_VIEWED_1', ['MESSAGE_ID', 'USER_ID', 'DATE_CREATE']);
	$table->addIndex('IX_IM_MESS_VIEWED_3', ['DATE_CREATE']);
	$table->addIndex('IX_IM_MESS_VIEWED_4', ['MESSAGE_ID']);
});

$migration->table('b_im_message_unread')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->char('IS_MUTED', 1)->notNull();
	$columns->char('CHAT_TYPE', 1)->notNull();
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$columns->int('PARENT_ID')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UX_IM_MESS_UNREAD', ['USER_ID', 'CHAT_ID', 'MESSAGE_ID']);
	$table->addIndex('IX_IM_MESS_UNREAD_1', ['DATE_CREATE']);
	$table->addIndex('IX_IM_MESS_UNREAD_2', ['USER_ID', 'CHAT_ID', 'CHAT_TYPE', 'IS_MUTED']);
	$table->addIndex('IX_IM_MESS_UNREAD_3', ['CHAT_ID', 'CHAT_TYPE', 'IS_MUTED']);
	$table->addIndex('IX_IM_MESS_UNREAD_4', ['CHAT_ID', 'USER_ID', 'MESSAGE_ID']);
	$table->addIndex('IX_IM_MESS_UNREAD_5', ['MESSAGE_ID', 'USER_ID']);
	$table->addIndex('IX_IM_MESS_UNREAD_6', ['CHAT_TYPE', 'MESSAGE_ID']);
	$table->addIndex('IX_IM_MESS_UNREAD_7', ['PARENT_ID', 'USER_ID']);
	$table->addIndex('IX_IM_MESS_UNREAD_8', ['USER_ID', 'CHAT_TYPE']);
});

$migration->table('b_im_link_url')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('MESSAGE_ID');
	$columns->int('CHAT_ID');
	$columns->varchar('URL', 2000);
	$columns->int('PREVIEW_URL_ID');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$columns->char('IS_INDEXED', 1)->notNull()->default('N');
	$table->addIndex('IX_B_IM_LINK_URL_1', ['CHAT_ID', 'AUTHOR_ID', 'DATE_CREATE', 'MESSAGE_ID']);
	$table->addIndex('IX_B_IM_LINK_URL_2', ['CHAT_ID', 'DATE_CREATE', 'MESSAGE_ID']);
	$table->addIndex('IX_B_IM_LINK_URL_3', ['MESSAGE_ID']);
	$table->addIndex('IX_B_IM_LINK_URL_4', ['IS_INDEXED']);
	$table->addIndex('IX_B_IM_LINK_URL_5', ['AUTHOR_ID']);
	$table->addIndex('IX_B_IM_LINK_URL_6', ['CHAT_ID', 'MESSAGE_ID']);
});

$migration->table('b_im_link_url_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('URL_ID')->notNull();
	$columns->text('SEARCH_CONTENT');
	$table->addPrimaryKey('URL_ID');
	$table->addFulltextIndex('IXF_IM_LINK_URL_1', ['SEARCH_CONTENT']);
});

$migration->table('b_im_link_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('MESSAGE_ID');
	$columns->int('CHAT_ID');
	$columns->varchar('SUBTYPE', 50);
	$columns->int('DISK_FILE_ID');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$table->addIndex('IX_B_IM_LINK_FILE_1', ['CHAT_ID', 'SUBTYPE', 'ID']);
	$table->addIndex('IX_B_IM_LINK_FILE_2', ['CHAT_ID', 'SUBTYPE', 'AUTHOR_ID', 'ID']);
	$table->addIndex('IX_B_IM_LINK_FILE_3', ['MESSAGE_ID', 'ID']);
	$table->addIndex('IX_B_IM_LINK_FILE_4', ['DISK_FILE_ID']);
	$table->addIndex('IX_B_IM_LINK_FILE_5', ['CHAT_ID', 'SUBTYPE', 'DATE_CREATE', 'ID']);
});

$migration->table('b_im_link_task')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('MESSAGE_ID');
	$columns->int('CHAT_ID');
	$columns->int('TASK_ID');
	$columns->int('AUTHOR_ID');
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_IM_LINK_TASK_1', ['CHAT_ID', 'TASK_ID']);
	$table->addIndex('IX_B_IM_LINK_TASK_2', ['MESSAGE_ID']);
	$table->addUniqueIndex('UIX_B_IM_LINK_TASK_1', ['TASK_ID']);
});

$migration->table('b_im_link_favorite')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('MESSAGE_ID');
	$columns->int('CHAT_ID');
	$columns->int('AUTHOR_ID');
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_IM_LINK_FAVORITE_1', ['CHAT_ID', 'AUTHOR_ID', 'ID']);
	$table->addUniqueIndex('UIX_B_IM_LINK_FAVORITE_1', ['MESSAGE_ID', 'AUTHOR_ID']);
});

$migration->table('b_im_link_pin')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_LINK_PIN_1', ['MESSAGE_ID', 'CHAT_ID']);
	$table->addIndex('IX_B_IM_LINK_PIN_1', ['CHAT_ID', 'ID']);
});

$migration->table('b_im_link_calendar')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('MESSAGE_ID');
	$columns->int('CHAT_ID');
	$columns->int('AUTHOR_ID');
	$columns->datetime('DATE_CREATE');
	$columns->int('CALENDAR_ID');
	$columns->varchar('CALENDAR_TITLE', 255);
	$columns->datetime('CALENDAR_DATE_FROM');
	$columns->datetime('CALENDAR_DATE_TO');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_LINK_CALENDAR_1', ['CALENDAR_ID']);
	$table->addIndex('IX_B_IM_LINK_CALENDAR_1', ['CHAT_ID', 'AUTHOR_ID', 'ID']);
	$table->addIndex('IX_B_IM_LINK_CALENDAR_2', ['CHAT_ID', 'DATE_CREATE', 'ID']);
	$table->addIndex('IX_B_IM_LINK_CALENDAR_3', ['CHAT_ID', 'CALENDAR_DATE_FROM', 'CALENDAR_DATE_TO', 'ID']);
	$table->addIndex('IX_B_IM_LINK_CALENDAR_4', ['CHAT_ID', 'ID']);
	$table->addIndex('IX_B_IM_LINK_CALENDAR_5', ['MESSAGE_ID']);
});

$migration->table('b_im_link_calendar_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull();
	$columns->text('SEARCH_CONTENT');
	$table->addPrimaryKey('ID');
	$table->addFulltextIndex('IXF_B_IM_LINK_CALENDAR_INDEX_1', ['SEARCH_CONTENT']);
});

$migration->table('b_im_link_reminder')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$columns->datetime('DATE_REMIND');
	$columns->char('IS_REMINDED', 1)->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_LINK_REMINDER_2', ['AUTHOR_ID', 'MESSAGE_ID']);
	$table->addIndex('IX_B_IM_LINK_REMINDER_1', ['DATE_REMIND', 'IS_REMINDED']);
	$table->addIndex('IX_B_IM_LINK_REMINDER_2', ['CHAT_ID', 'AUTHOR_ID', 'IS_REMINDED']);
	$table->addIndex('IX_B_IM_LINK_REMINDER_3', ['CHAT_ID', 'AUTHOR_ID', 'ID']);
});

$migration->table('b_im_file_temporary')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('DISK_FILE_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->varchar('SOURCE', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_FILE_TEMPORARY_1', ['DISK_FILE_ID']);
	$table->addIndex('IX_B_IM_FILE_TEMPORARY_1', ['DATE_CREATE', 'SOURCE']);
});

$migration->table('b_im_reaction')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('REACTION', 50)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_REACTION_1', ['MESSAGE_ID', 'REACTION', 'USER_ID']);
	$table->addIndex('IX_B_IM_REACTION_1', ['MESSAGE_ID', 'REACTION', 'ID']);
	$table->addIndex('IX_B_IM_REACTION_2', ['USER_ID', 'MESSAGE_ID', 'REACTION']);
	$table->addIndex('IX_B_IM_REACTION_3', ['MESSAGE_ID']);
	$table->addIndex('IX_B_IM_REACTION_4', ['CHAT_ID']);
});

$migration->table('b_im_message_disappearing')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_REMOVE')->notNull();
	$table->addUniqueIndex('UIX_B_IM_MESSAGE_DISAPPEARING_1', ['MESSAGE_ID']);
});

$migration->table('b_im_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50);
	$columns->int('ENTITY_ID');
	$columns->varchar('EVENT', 50)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_DELETE');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_LOG_1', ['USER_ID', 'ENTITY_TYPE', 'ENTITY_ID']);
	$table->addIndex('IX_B_IM_LOG_1', ['USER_ID', 'DATE_CREATE']);
});

$migration->table('b_im_last_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_LAST_MESSAGE_1', ['CHAT_ID', 'USER_ID']);
	$table->addIndex('IX_B_IM_LAST_MESSAGE_1', ['CHAT_ID', 'DATE_CREATE']);
});

$migration->table('b_im_chat_param')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('CHAT_ID')->notNull();
	$columns->varchar('PARAM_NAME', 100)->notNull();
	$columns->varchar('PARAM_VALUE', 100);
	$columns->text('PARAM_JSON');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_IM_CHAT_PARAM_1', ['CHAT_ID', 'PARAM_NAME']);
	$table->addIndex('IX_B_IM_CHAT_PARAM_2', ['PARAM_NAME', 'PARAM_VALUE(50)', 'CHAT_ID']);
});

$migration->table('b_im_hr_sync_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 25)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('DIRECTION', 100)->notNull();
	$columns->int('NODE_ID')->notNull();
	$columns->char('WITH_CHILD_NODES', 1)->notNull()->default('N');
	$columns->int('POINTER')->notNull()->default('0');
	$columns->varchar('STATUS', 100)->notNull()->default('');
	$columns->char('IS_LOCKED', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_UPDATE');
	$table->addIndex('IX_B_IM_HR_SYNC_QUEUE_1', ['ENTITY_TYPE(25)', 'ENTITY_ID']);
});

$migration->table('b_im_counter_overflow')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$table->addUniqueIndex('UIX_B_IM_COUNTER_OVERFLOW_1', ['CHAT_ID', 'USER_ID']);
	$table->addIndex('IX_B_IM_COUNTER_OVERFLOW_1', ['USER_ID', 'CHAT_ID']);
});

$migration->table('b_im_recent_init_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('STAGE', 100)->notNull()->default('');
	$columns->varchar('SOURCE', 100)->notNull()->default('');
	$columns->int('SOURCE_ID');
	$columns->varchar('POINTER', 255)->notNull()->default('');
	$columns->varchar('STATUS', 100)->notNull()->default('');
	$columns->char('IS_LOCKED', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_UPDATE');
});

$migration->table('b_im_anchor')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('MESSAGE_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->int('FROM_USER_ID')->notNull();
	$columns->varchar('TYPE', 100)->notNull();
	$columns->varchar('SUB_TYPE', 100);
	$table->addUniqueIndex('IX_B_IM_ANCHOR_1', ['MESSAGE_ID', 'TYPE', 'USER_ID', 'FROM_USER_ID']);
	$table->addIndex('IX_B_IM_ANCHOR_2', ['USER_ID', 'CHAT_ID']);
});

$migration->table('b_im_notify_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('TITLE', 255);
	$columns->datetime('DATE_CREATE');
	$columns->datetime('DATE_UPDATE');
	$table->addIndex('IX_IM_NOTIFY_GROUP_USER_ID', ['USER_ID']);
});

$migration->table('b_im_notify_group_condition')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->varchar('MODULE', 255)->notNull();
	$columns->varchar('EVENT', 255)->notNull()->default('');
	$columns->int('USER_ID')->notNull();
	$columns->datetime('DATE_CREATE');
	$table->addUniqueIndex('UX_IM_NOTIFY_GROUP_CONDITION_GROUP_ID_MODULE_EVENT', ['GROUP_ID', 'MODULE', 'EVENT']);
});

$migration->table('b_im_file_param')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('DISK_FILE_ID')->notNull();
	$columns->varchar('PARAM_NAME', 100)->notNull();
	$columns->varchar('PARAM_VALUE', 100);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_FILE_PARAM_1', ['DISK_FILE_ID', 'PARAM_NAME']);
});

$migration->table('b_im_file_transcription')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FILE_ID')->notNull();
	$columns->text('TEXT');
	$table->addUniqueIndex('UIX_B_IM_FILE_TRANSCRIPTION_1', ['FILE_ID']);
});

$migration->table('b_im_ai_transcribe_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FILE_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$table->addUniqueIndex('UIX_B_IM_AI_TRANSCRIBE_QUEUE_1', ['FILE_ID', 'CHAT_ID']);
});

$migration->table('b_im_sharing_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$columns->varchar('ENTITY_ID', 100)->notNull();
	$columns->varchar('CODE', 36)->notNull();
	$columns->int('AUTHOR_ID')->notNull()->default('0');
	$columns->varchar('TYPE', 20)->notNull()->default('CUSTOM');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_EXPIRE');
	$columns->char('IS_REVOKED', 1)->notNull()->default('N');
	$columns->int('MAX_USES');
	$columns->int('USES_COUNT')->notNull()->default('0');
	$columns->char('REQUIRE_APPROVAL', 1)->notNull()->default('N');
	$columns->varchar('NAME', 255);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_SHARING_LINK_1', ['CODE']);
	$table->addIndex('IX_B_IM_SHARING_LINK_1', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_im_sharing_link_member')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->autoincrement();
	$columns->int('SHARING_LINK_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull();
	$columns->varchar('ENTITY_ID', 100)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->char('BLOCKED', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_SHARING_LINK_MEMBER_1', ['SHARING_LINK_ID', 'USER_ID']);
	$table->addIndex('IX_B_IM_SHARING_LINK_MEMBER_1', ['USER_ID']);
	$table->addIndex('IX_B_IM_SHARING_LINK_MEMBER_2', ['ENTITY_ID', 'ENTITY_TYPE']);
});

$migration->table('b_im_event_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->bigInt('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('EVENT_TYPE', 50)->notNull();
	$columns->longText('EVENT_DATA')->notNull();
	$columns->datetime('DATE_CREATE')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_IM_EVENT_LOG_1', ['USER_ID']);
	$table->addIndex('IX_B_IM_EVENT_LOG_2', ['DATE_CREATE']);
});

$migration->table('b_im_sticker_recent')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('STICKER_ID')->notNull();
	$columns->int('PACK_ID')->notNull();
	$columns->varchar('PACK_TYPE', 50)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addUniqueIndex('UIX_B_IM_STICKER_RECENT_1', ['USER_ID', 'STICKER_ID', 'PACK_ID', 'PACK_TYPE']);
	$table->addIndex('IX_B_IM_STICKER_RECENT_1', ['USER_ID', 'DATE_CREATE']);
});

$migration->table('b_im_sticker')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PACK_ID')->notNull();
	$columns->int('FILE_ID')->notNull();
	$columns->varchar('TYPE', 50)->notNull();
	$table->addIndex('IX_B_IM_STICKER_1', ['PACK_ID']);
});

$migration->table('b_im_sticker_pack')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('AUTHOR_ID')->notNull();
	$columns->varchar('TYPE', 50)->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addIndex('IX_B_IM_STICKER_PACK_1', ['AUTHOR_ID']);
});

$migration->table('b_im_sticker_user_pack')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('PACK_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addUniqueIndex('UIX_B_IM_STICKER_USER_PACK_1', ['USER_ID', 'PACK_ID']);
	$table->addIndex('IX_B_IM_STICKER_USER_PACK_1', ['PACK_ID']);
});

$migration->table('b_im_folder')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('PARENT_CHAT_ID')->notNull()->default('0');
	$columns->varchar('TYPE', 20)->notNull()->default('personal');
	$columns->varchar('CODE', 50);
	$columns->varchar('TITLE', 255);
	$columns->int('SORT')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_B_IM_FOLDER_1', ['USER_ID', 'PARENT_CHAT_ID', 'SORT']);
	$table->addUniqueIndex('UIX_B_IM_FOLDER_2', ['USER_ID', 'PARENT_CHAT_ID', 'CODE']);
});

$migration->table('b_im_folder_chat')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('FOLDER_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_FOLDER_CHAT_1', ['FOLDER_ID', 'CHAT_ID']);
	$table->addIndex('IX_B_IM_FOLDER_CHAT_2', ['CHAT_ID']);
});

$migration->table('b_im_folder_pin')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('FOLDER_ID')->notNull();
	$columns->int('CHAT_ID')->notNull();
	$columns->int('PIN_SORT')->notNull()->default('0');
	$columns->int('USER_ID')->notNull();
	$columns->int('FOLDER_PARENT_ID')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('UIX_B_IM_FOLDER_PIN_1', ['FOLDER_ID', 'CHAT_ID']);
	$table->addIndex('IX_B_IM_FOLDER_PIN_2', ['CHAT_ID']);
	$table->addIndex('IX_B_IM_FOLDER_PIN_3', ['USER_ID', 'FOLDER_PARENT_ID']);
});
