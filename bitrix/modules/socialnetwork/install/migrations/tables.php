<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_sonet_group_subject')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->int('SORT')->notNull()->default('100');
});

$migration->table('b_sonet_group_subject_site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('SUBJECT_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$table->addPrimaryKeys(['SUBJECT_ID', 'SITE_ID']);
});

$migration->table('b_sonet_group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('SITE_ID', 2)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->text('DESCRIPTION');
	$columns->text('GOAL');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('VISIBLE', 1)->notNull()->default('Y');
	$columns->char('OPENED', 1)->notNull()->default('N');
	$columns->int('SUBJECT_ID')->notNull();
	$columns->int('OWNER_ID')->notNull();
	$columns->varchar('KEYWORDS', 255);
	$columns->int('IMAGE_ID');
	$columns->varchar('AVATAR_TYPE', 50);
	$columns->int('NUMBER_OF_MEMBERS')->notNull()->default('0');
	$columns->int('NUMBER_OF_MODERATORS')->notNull()->default('0');
	$columns->char('INITIATE_PERMS', 1)->notNull()->default('K');
	$columns->datetime('DATE_ACTIVITY')->notNull();
	$columns->char('CLOSED', 1)->notNull()->default('N');
	$columns->char('SPAM_PERMS', 1)->notNull()->default('K');
	$columns->char('PROJECT', 1)->notNull()->default('N');
	$columns->datetime('PROJECT_DATE_START');
	$columns->datetime('PROJECT_DATE_FINISH');
	$columns->mediumText('SEARCH_INDEX');
	$columns->char('LANDING', 1);
	$columns->int('SCRUM_OWNER_ID');
	$columns->int('SCRUM_MASTER_ID');
	$columns->int('SCRUM_SPRINT_DURATION');
	$columns->char('SCRUM_TASK_RESPONSIBLE', 1);
	$columns->varchar('TYPE', 10);
	$table->addIndex('IX_SONET_GROUP_1', ['OWNER_ID']);
	$table->addFulltextIndex('IXF_SONET_GROUP', ['SEARCH_INDEX']);
});

$migration->table('b_sonet_group_tag')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$table->addPrimaryKeys(['GROUP_ID', 'NAME']);
	$table->addIndex('IX_SONET_GROUP_TAG_2', ['NAME']);
});

$migration->table('b_sonet_group_site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('GROUP_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$table->addPrimaryKeys(['GROUP_ID', 'SITE_ID']);
});

$migration->table('b_sonet_user2group')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->char('ROLE', 1)->notNull()->default('U');
	$columns->char('AUTO_MEMBER', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->char('INITIATED_BY_TYPE', 1)->notNull()->default('U');
	$columns->int('INITIATED_BY_USER_ID')->notNull();
	$columns->text('MESSAGE');
	$table->addUniqueIndex('IX_SONET_USER2GROUP_1', ['USER_ID', 'GROUP_ID']);
	$table->addIndex('IX_SONET_USER2GROUP_2', ['USER_ID', 'GROUP_ID', 'ROLE']);
	$table->addIndex('IX_SONET_USER2GROUP_3', ['GROUP_ID', 'USER_ID', 'ROLE']);
	$table->addIndex('IX_SONET_USER2GROUP_4', ['USER_ID', 'ROLE']);
	$table->addIndex('IX_SONET_USER2GROUP_5', ['GROUP_ID', 'ROLE', 'DATE_CREATE', 'USER_ID']);
});

$migration->table('b_sonet_features')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->char('ENTITY_TYPE', 1)->notNull()->default('G');
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('FEATURE', 50)->notNull();
	$columns->varchar('FEATURE_NAME', 250);
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('BASE', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$table->addUniqueIndex('IX_SONET_GROUP_FEATURES_1', ['ENTITY_TYPE', 'ENTITY_ID', 'FEATURE']);
	$table->addUniqueIndex('IX_SONET_GROUP_FEATURES_2', ['ENTITY_TYPE', 'FEATURE', 'ACTIVE', 'ENTITY_ID']);
});

$migration->table('b_sonet_features2perms')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FEATURE_ID')->notNull();
	$columns->varchar('OPERATION_ID', 50)->notNull();
	$columns->char('ROLE', 1)->notNull();
	$table->addUniqueIndex('IX_SONET_GROUP_FEATURES2PERMS_1', ['FEATURE_ID', 'OPERATION_ID']);
	$table->addIndex('IX_SONET_GROUP_FEATURES2PERMS_2', ['FEATURE_ID', 'ROLE', 'OPERATION_ID']);
});

$migration->table('b_sonet_user_relations')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FIRST_USER_ID')->notNull();
	$columns->int('SECOND_USER_ID')->notNull();
	$columns->char('RELATION', 1)->notNull()->default('N');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_UPDATE')->notNull();
	$columns->text('MESSAGE');
	$columns->char('INITIATED_BY', 1)->notNull()->default('F');
	$table->addUniqueIndex('IX_SONET_RELATIONS_1', ['FIRST_USER_ID', 'SECOND_USER_ID']);
	$table->addIndex('IX_SONET_RELATIONS_2', ['FIRST_USER_ID', 'SECOND_USER_ID', 'RELATION']);
	$table->addIndex('IX_SONET_RELATIONS_3', ['SECOND_USER_ID']);
});

$migration->table('b_sonet_messages')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('FROM_USER_ID')->notNull();
	$columns->int('TO_USER_ID')->notNull();
	$columns->varchar('TITLE', 250);
	$columns->text('MESSAGE');
	$columns->datetime('DATE_CREATE')->notNull();
	$columns->datetime('DATE_VIEW');
	$columns->char('MESSAGE_TYPE', 1)->notNull()->default('P');
	$columns->char('FROM_DELETED', 1)->notNull()->default('N');
	$columns->char('TO_DELETED', 1)->notNull()->default('N');
	$columns->char('SEND_MAIL', 1)->notNull()->default('N');
	$columns->varchar('EMAIL_TEMPLATE', 250);
	$columns->char('IS_LOG', 1);
	$table->addIndex('IX_SONET_MESSAGES_1', ['FROM_USER_ID']);
	$table->addIndex('IX_SONET_MESSAGES_2', ['TO_USER_ID']);
});

$migration->table('b_sonet_smile')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->smallInt('ID')->notNull()->autoincrement();
	$columns->char('SMILE_TYPE', 1)->notNull()->default('S');
	$columns->varchar('TYPING', 100);
	$columns->varchar('IMAGE', 128)->notNull();
	$columns->varchar('DESCRIPTION', 50);
	$columns->char('CLICKABLE', 1)->notNull()->default('Y');
	$columns->int('SORT')->notNull()->default('150');
	$columns->int('IMAGE_WIDTH')->notNull()->default('0');
	$columns->int('IMAGE_HEIGHT')->notNull()->default('0');
	$table->addPrimaryKey('ID');
});

$migration->table('b_sonet_smile_lang')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('SMILE_ID')->notNull()->default('0');
	$columns->char('LID', 2)->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_SONET_SMILE_K', ['SMILE_ID', 'LID']);
});

$migration->table('b_sonet_user_perms')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('OPERATION_ID', 50)->notNull();
	$columns->char('RELATION_TYPE', 1)->notNull();
	$table->addUniqueIndex('IX_SONET_USER_PERMS_2', ['USER_ID', 'OPERATION_ID']);
});

$migration->table('b_sonet_user_events')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('EVENT_ID', 50)->notNull();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->char('SITE_ID', 2)->notNull();
	$table->addUniqueIndex('IX_SONET_USER_PERMS_2', ['USER_ID', 'EVENT_ID']);
});

$migration->table('b_sonet_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 50)->notNull()->default('G');
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('EVENT_ID', 50)->notNull();
	$columns->int('USER_ID');
	$columns->datetime('LOG_DATE')->notNull();
	$columns->char('SITE_ID', 2);
	$columns->varchar('TITLE_TEMPLATE', 250);
	$columns->varchar('TITLE', 250)->notNull();
	$columns->mediumText('MESSAGE');
	$columns->text('TEXT_MESSAGE');
	$columns->varchar('URL', 500);
	$columns->varchar('MODULE_ID', 50);
	$columns->varchar('CALLBACK_FUNC', 250);
	$columns->varchar('EXTERNAL_ID', 250);
	$columns->text('PARAMS');
	$columns->int('TMP_ID');
	$columns->int('SOURCE_ID');
	$columns->datetime('LOG_UPDATE')->notNull();
	$columns->int('COMMENTS_COUNT');
	$columns->char('ENABLE_COMMENTS', 1)->default('Y');
	$columns->varchar('RATING_TYPE_ID', 50);
	$columns->int('RATING_ENTITY_ID');
	$columns->varchar('SOURCE_TYPE', 50);
	$columns->char('TRANSFORM', 1);
	$columns->char('INACTIVE', 1);
	$table->addIndex('IX_SONET_LOG_1', ['ENTITY_TYPE', 'ENTITY_ID', 'EVENT_ID']);
	$table->addIndex('IX_SONET_LOG_2', ['USER_ID', 'LOG_DATE', 'EVENT_ID']);
	$table->addIndex('IX_SONET_LOG_3', ['SOURCE_ID']);
	$table->addIndex('IX_SONET_LOG_4', ['LOG_UPDATE']);
	$table->addIndex('IX_SONET_LOG_5', ['USER_ID', 'ENTITY_TYPE', 'LOG_UPDATE']);
	$table->addIndex('IX_SONET_LOG_6', ['MODULE_ID']);
	$table->addIndex('IX_SONET_LOG_7', ['ENTITY_ID', 'EVENT_ID']);
	$table->addIndex('IX_SONET_LOG_8', ['RATING_ENTITY_ID', 'RATING_TYPE_ID']);
	$table->addIndex('IX_SONET_LOG_9', ['EXTERNAL_ID']);
});

$migration->table('b_sonet_log_site')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOG_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull();
	$table->addPrimaryKeys(['LOG_ID', 'SITE_ID']);
});

$migration->table('b_sonet_log_comment')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('LOG_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull()->default('G');
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('EVENT_ID', 50)->notNull();
	$columns->int('USER_ID');
	$columns->datetime('LOG_DATE')->notNull();
	$columns->text('MESSAGE');
	$columns->text('TEXT_MESSAGE');
	$columns->varchar('MODULE_ID', 50);
	$columns->int('SOURCE_ID');
	$columns->varchar('URL', 500);
	$columns->varchar('RATING_TYPE_ID', 50);
	$columns->int('RATING_ENTITY_ID');
	$columns->text('SHARE_DEST');
	$table->addIndex('IX_SONET_LOG_COMMENT_1', ['ENTITY_TYPE', 'ENTITY_ID', 'EVENT_ID']);
	$table->addIndex('IX_SONET_LOG_COMMENT_2', ['USER_ID', 'LOG_DATE', 'EVENT_ID']);
	$table->addIndex('IX_SONET_LOG_COMMENT_3', ['LOG_ID']);
	$table->addIndex('IX_SONET_LOG_COMMENT_4', ['SOURCE_ID']);
	$table->addIndex('IX_SONET_LOG_COMMENT_5', ['RATING_TYPE_ID', 'RATING_ENTITY_ID']);
});

$migration->table('b_sonet_log_events')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 50)->notNull()->default('G');
	$columns->int('ENTITY_ID')->notNull();
	$columns->char('ENTITY_CB', 1)->notNull()->default('N');
	$columns->char('ENTITY_MY', 1)->notNull()->default('N');
	$columns->varchar('EVENT_ID', 50)->notNull();
	$columns->char('SITE_ID', 2);
	$columns->char('MAIL_EVENT', 1)->notNull()->default('N');
	$columns->char('TRANSPORT', 1)->notNull()->default('N');
	$columns->char('VISIBLE', 1)->notNull()->default('Y');
	$table->addIndex('IX_SONET_LOG_EVENTS_2', ['ENTITY_TYPE', 'ENTITY_ID', 'EVENT_ID']);
	$table->addUniqueIndex('IX_SONET_LOG_EVENTS_3', ['USER_ID', 'ENTITY_TYPE', 'ENTITY_ID', 'ENTITY_CB', 'ENTITY_MY', 'EVENT_ID', 'SITE_ID']);
	$table->addIndex('IX_SONET_LOG_EVENTS_4', ['USER_ID', 'ENTITY_CB', 'ENTITY_ID']);
	$table->addIndex('IX_SONET_LOG_EVENTS_5', ['USER_ID', 'ENTITY_MY', 'ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_sonet_event_user_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->varchar('ENTITY_TYPE', 50)->notNull()->default('G');
	$columns->int('ENTITY_ID')->notNull();
	$columns->varchar('EVENT_ID', 50)->notNull();
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->int('USER_IM_ID')->notNull()->default('0');
	$columns->char('USER_ANONYMOUS', 1)->notNull()->default('N');
	$table->addPrimaryKeys(['ENTITY_TYPE', 'ENTITY_ID', 'EVENT_ID', 'USER_ID', 'USER_IM_ID']);
	$table->addIndex('IX_SONET_EVENT_USER_VIEW_1', ['USER_ID', 'EVENT_ID', 'ENTITY_TYPE', 'USER_ANONYMOUS']);
	$table->addIndex('IX_SONET_EVENT_USER_VIEW_2', ['ENTITY_TYPE', 'EVENT_ID']);
});

$migration->table('b_sonet_log_right')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('LOG_ID')->notNull();
	$columns->varchar('GROUP_CODE', 50)->notNull();
	$columns->datetime('LOG_UPDATE');
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_b_sonet_log_right_group_code', ['LOG_ID', 'GROUP_CODE']);
	$table->addIndex('ix_b_sonet_log_right_group_log', ['GROUP_CODE', 'LOG_ID']);
	$table->addIndex('ix_b_sonet_log_right_logupdate', ['LOG_UPDATE']);
});

$migration->table('b_sonet_log_counter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull()->default('**');
	$columns->varchar('CODE', 50)->notNull()->default('**');
	$columns->int('CNT')->notNull()->default('0');
	$columns->datetime('LAST_DATE');
	$columns->int('PAGE_SIZE');
	$columns->datetime('PAGE_LAST_DATE_1');
	$table->addPrimaryKeys(['USER_ID', 'SITE_ID', 'CODE']);
});

$migration->table('b_sonet_log_page')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->char('SITE_ID', 2)->notNull()->default('**');
	$columns->varchar('GROUP_CODE', 50)->notNull()->default('**');
	$columns->int('PAGE_SIZE')->notNull();
	$columns->int('PAGE_NUM')->notNull()->default('1');
	$columns->datetime('PAGE_LAST_DATE');
	$columns->int('TRAFFIC_AVG');
	$columns->int('TRAFFIC_CNT');
	$columns->datetime('TRAFFIC_LAST_DATE');
	$table->addPrimaryKeys(['USER_ID', 'SITE_ID', 'GROUP_CODE', 'PAGE_SIZE', 'PAGE_NUM']);
});

$migration->table('b_sonet_log_follow')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('CODE', 50)->notNull()->default('**');
	$columns->int('REF_ID')->notNull();
	$columns->char('TYPE', 1)->notNull()->default('Y');
	$columns->datetime('FOLLOW_DATE');
	$columns->char('BY_WF', 1);
	$table->addPrimaryKeys(['USER_ID', 'CODE']);
	$table->addIndex('IX_SONET_FOLLOW_1', ['USER_ID', 'REF_ID']);
	$table->addIndex('IX_SONET_FOLLOW_2', ['USER_ID', 'CODE', 'TYPE', 'FOLLOW_DATE']);
	$table->addIndex('IX_SONET_FOLLOW_3', ['CODE', 'TYPE', 'USER_ID']);
});

$migration->table('b_sonet_log_subscribe')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('LOG_ID')->notNull();
	$columns->char('TYPE', 3)->notNull();
	$columns->datetime('END_DATE');
	$table->addPrimaryKeys(['USER_ID', 'LOG_ID', 'TYPE']);
	$table->addIndex('IX_SONET_LOG_SUBSCRIBE_1', ['LOG_ID']);
});

$migration->table('b_sonet_log_smartfilter')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->char('TYPE', 1)->notNull()->default('N');
	$table->addPrimaryKey('USER_ID');
});

$migration->table('b_sonet_log_favorites')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('LOG_ID')->notNull();
	$table->addPrimaryKeys(['USER_ID', 'LOG_ID']);
	$table->addIndex('IX_SONET_LOG_FAVORITES_1', ['LOG_ID']);
});

$migration->table('b_sonet_log_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('EVENT_ID', 50)->notNull();
	$columns->char('TYPE', 1)->notNull()->default('Y');
	$table->addPrimaryKeys(['USER_ID', 'EVENT_ID']);
});

$migration->table('b_sonet_subscription')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('CODE', 50)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_SONET_SUBSCRIPTION_1', ['USER_ID', 'CODE']);
});

$migration->table('b_sonet_group_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->datetime('DATE_VIEW');
	$table->addPrimaryKeys(['USER_ID', 'GROUP_ID']);
});

$migration->table('b_sonet_group_favorites')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->datetime('DATE_ADD');
	$table->addPrimaryKeys(['USER_ID', 'GROUP_ID']);
});

$migration->table('b_sonet_group_pin')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->varchar('CONTEXT', 100);
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('IX_SONET_GROUP_PIN_1', ['USER_ID', 'GROUP_ID', 'CONTEXT']);
});

$migration->table('b_sonet_log_index')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOG_ID')->notNull();
	$columns->varchar('ITEM_TYPE', 10)->notNull()->default('L');
	$columns->int('ITEM_ID')->notNull();
	$columns->text('CONTENT');
	$columns->datetime('LOG_UPDATE');
	$columns->datetime('DATE_CREATE');
	$table->addPrimaryKeys(['ITEM_TYPE', 'ITEM_ID']);
	$table->addIndex('IX_SONET_LOG_INDEX_1', ['LOG_ID']);
	$table->addIndex('IX_SONET_LOG_INDEX_2', ['LOG_UPDATE']);
	$table->addIndex('IX_SONET_LOG_INDEX_3', ['DATE_CREATE']);
	$table->addFulltextIndex('IXF_SONET_LOG_INDEX', ['CONTENT']);
});

$migration->table('b_sonet_user_content_view')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('RATING_TYPE_ID', 50)->notNull();
	$columns->int('RATING_ENTITY_ID')->notNull();
	$columns->varchar('CONTENT_ID', 50)->notNull();
	$columns->datetime('DATE_VIEW');
	$table->addPrimaryKeys(['USER_ID', 'RATING_TYPE_ID', 'RATING_ENTITY_ID']);
	$table->addIndex('IX_SONET_USER_CONTENT_VIEW_1', ['CONTENT_ID']);
	$table->addIndex('IX_SONET_USER_CONTENT_VIEW_2', ['RATING_TYPE_ID', 'RATING_ENTITY_ID']);
});

$migration->table('b_sonet_log_im_message')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOG_ID')->notNull();
	$columns->int('IM_CHAT_ID')->notNull();
	$columns->int('IM_MESSAGE_ID')->notNull();
	$columns->int('GROUP_ID')->notNull();
	$columns->datetime('DATE_CREATE')->notNull();
	$table->addPrimaryKeys(['LOG_ID', 'IM_CHAT_ID']);
	$table->addUniqueIndex('UX_SONET_LOG_IM_MSG', ['IM_MESSAGE_ID']);
	$table->addIndex('IX_SONET_LOG_IM_CHAT_LOG', ['IM_CHAT_ID', 'LOG_ID']);
	$table->addIndex('IX_SONET_LOG_IM_CHAT_MSG', ['IM_CHAT_ID', 'IM_MESSAGE_ID']);
	$table->addIndex('IX_SONET_LOG_IM_GROUP', ['GROUP_ID']);
});

$migration->table('b_sonet_log_tag')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOG_ID')->notNull();
	$columns->varchar('ITEM_TYPE', 10)->notNull()->default('L');
	$columns->int('ITEM_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$table->addPrimaryKeys(['ITEM_TYPE', 'ITEM_ID', 'NAME']);
	$table->addIndex('IX_SONET_LOG_TAG_1', ['LOG_ID']);
	$table->addIndex('IX_SONET_LOG_TAG_2', ['NAME']);
});

$migration->table('b_sonet_user_tag')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$table->addPrimaryKeys(['USER_ID', 'NAME']);
	$table->addIndex('IX_SONET_USER_TAG_1', ['NAME']);
});

$migration->table('b_sonet_user_welltory')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->tinyInt('STRESS')->notNull();
	$columns->varchar('STRESS_TYPE', 100);
	$columns->varchar('STRESS_COMMENT', 255);
	$columns->datetime('DATE_MEASURE')->notNull();
	$columns->varchar('HASH', 100);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SONET_USER_STRESSLEVEL_1', ['USER_ID', 'DATE_MEASURE']);
});

$migration->table('b_sonet_user_welltory_disclaimer')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('DATE_SIGNED')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_SONET_USER_STRESSLEVEL_DISCLAIMER_1', ['USER_ID']);
});

$migration->table('b_sonet_log_pinned')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('LOG_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->datetime('PINNED_DATE');
	$table->addPrimaryKeys(['LOG_ID', 'USER_ID']);
	$table->addIndex('IX_SONET_LOG_PINNED_1', ['PINNED_DATE']);
});

$migration->table('b_sonet_space_composition')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('SPACE_ID')->unsigned()->notNull();
	$columns->text('SETTINGS')->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_sonet_space_composition_user_id_space_id', ['USER_ID', 'SPACE_ID']);
});

$migration->table('b_sonet_scorer')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull()->default('0');
	$columns->int('SONET_LOG_ID')->notNull()->default('0');
	$columns->int('GROUP_ID')->notNull()->default('0');
	$columns->varchar('TYPE', 64)->notNull()->default('0');
	$columns->int('VALUE')->notNull()->default('0');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_sonet_scorer_group', ['GROUP_ID']);
	$table->addIndex('ix_sonet_scorer_utype', ['USER_ID', 'TYPE', 'SONET_LOG_ID']);
});

$migration->table('b_sonet_scorer_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('TYPE', 32)->notNull()->default('');
	$columns->int('SONET_LOG_ID')->notNull();
	$columns->datetime('DATETIME')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_sonet_scorer_queue', ['USER_ID', 'TYPE']);
});

$migration->table('b_sonet_scorer_event')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('HID', 64)->notNull();
	$columns->varchar('TYPE', 64)->notNull();
	$columns->mediumText('DATA')->notNull();
	$columns->mediumText('LOG_DATA');
	$columns->datetime('CREATED')->notNull()->defaultCurrentTimestamp();
	$columns->datetime('PROCESSED')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('HID', ['HID']);
	$table->addIndex('PROCESSED', ['PROCESSED']);
});

$migration->table('b_sonet_space_user_recent_activity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('SPACE_ID')->unsigned()->notNull();
	$columns->varchar('TYPE_ID', 32)->notNull();
	$columns->int('ENTITY_ID')->unsigned();
	$columns->datetime('DATETIME')->notNull();
	$columns->int('SECONDARY_ENTITY_ID')->unsigned();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_sonet_space_recent_activity_datetime', ['DATETIME']);
	$table->addIndex('ix_sonet_space_user_recent_activity_user_id_space_id', ['USER_ID', 'SPACE_ID']);
	$table->addUniqueIndex('ix_sonet_space_user_recent_activity_key', ['SPACE_ID', 'TYPE_ID', 'ENTITY_ID', 'USER_ID']);
});

$migration->table('b_sonet_space_user_latest_activity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('SPACE_ID')->unsigned()->notNull();
	$columns->int('ACTIVITY_ID')->unsigned()->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_sonet_space_user_latest_activity_user_id_space_id', ['USER_ID', 'SPACE_ID']);
});

$migration->table('b_sonet_space_live_watch')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->timestamp('DATETIME')->notNull();
	$table->addPrimaryKey('USER_ID');
	$table->addIndex('ix_b_sonet_live_watch_date', ['datetime']);
});

$migration->table('b_sonet_event_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('USER_ID')->unsigned()->notNull();
	$columns->int('EVENT_ID')->unsigned()->notNull();
	$columns->int('PRIORITY')->unsigned()->notNull();
	$columns->timestamp('DATETIME')->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_sonet_event_queue_datetime', ['DATETIME']);
	$table->addIndex('ix_sonet_event_queue_priority', ['PRIORITY']);
});

$migration->table('b_sonet_collab_option')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('COLLAB_ID')->notNull();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('VALUE', 255)->notNull();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_sonet_collab_option_collab_name', ['COLLAB_ID', 'NAME']);
});

$migration->table('b_sonet_collab_last_activity')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('USER_ID')->notNull();
	$columns->int('COLLAB_ID')->notNull();
	$columns->datetime('ACTIVITY_DATE');
	$table->addPrimaryKey('USER_ID');
});

$migration->table('b_sonet_collab_log')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('COLLAB_ID')->notNull();
	$columns->datetime('DATETIME')->notNull();
	$columns->varchar('TYPE', 255);
	$columns->int('USER_ID')->notNull();
	$columns->varchar('ENTITY_TYPE', 255);
	$columns->int('ENTITY_ID');
	$columns->text('DATA');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_sonet_collab_log_collab_id_user_id', ['COLLAB_ID', 'USER_ID']);
	$table->addIndex('ix_sonet_collab_log_collab_id_datetime', ['COLLAB_ID', 'DATETIME']);
	$table->addIndex('ix_sonet_collab_log_entity', ['ENTITY_TYPE', 'ENTITY_ID']);
});

$migration->table('b_sonet_collab_note')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('COLLAB_ID')->notNull();
	$columns->int('COLLECTION_ID')->notNull();
	$columns->int('CREATED_BY')->notNull();
	$columns->datetime('CREATED_AT')->notNull()->defaultCurrentTimestamp();
	$table->addPrimaryKey('ID');
	$table->addUniqueIndex('ix_sonet_collab_note_uniq', ['COLLAB_ID']);
});

$migration->table('b_sonet_onboarding_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$columns = $table->addColumn();
	$columns->int('COLLAB_ID')->notNull();
	$columns->int('USER_ID')->notNull();
	$columns->varchar('TYPE', 150)->notNull();
	$columns->datetime('CREATED_DATE')->defaultCurrentTimestamp();
	$columns->datetime('NEXT_EXECUTION')->notNull();
	$columns->datetime('PROCESSED_DATE');
	$columns->tinyInt('IS_PROCESSED')->default('0');
	$table->addUniqueIndex('ix_b_sonet_onboarding_queue_collab_user_type', ['COLLAB_ID', 'USER_ID', 'TYPE']);
	$table->addIndex('ix_b_sonet_onboarding_queue_execution_processed', ['NEXT_EXECUTION', 'IS_PROCESSED']);
	$table->addIndex('ix_b_sonet_onboarding_queue_collab_type_execution', ['COLLAB_ID', 'TYPE', 'NEXT_EXECUTION']);
});

