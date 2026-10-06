<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->registerCompatible('rest', 'OnRestServiceBuildDescription', 'CMailRestService', 'OnRestServiceBuildDescription')
	->registerCompatible('main', 'OnAfterUserUpdate', 'CMail', 'onUserUpdate')
	->registerCompatible('main', 'OnAfterUserDelete', 'CMail', 'onUserDelete')
	->registerCompatible('main', 'OnBeforeSiteUpdate', 'Bitrix\Mail\User', 'handleSiteUpdate')
	->register('main', 'OnAfterSetOption_server_name', 'Bitrix\Mail\User', 'handleServerNameUpdate')
	->registerCompatible('main', 'OnUserTypeBuildList', 'Bitrix\Mail\MessageUserType', 'getUserTypeDescription')
	->registerCompatible('main', 'OnMailEventMailRead', 'Bitrix\Mail\Helper\MessageEventManager', 'onMailEventMailRead')
	->register('main', 'OnUISelectorGetProviderByEntityType', '\Bitrix\Mail\Integration\Main\UISelector\Handler', 'OnUISelectorGetProviderByEntityType')
	->register('main', 'OnUISelectorFillLastDestination', '\Bitrix\Mail\Integration\Main\UISelector\Handler', 'OnUISelectorFillLastDestination')
	->register('mail', 'onMailMessageNew', '\Bitrix\Mail\Integration\Calendar\ICal\ICalMailEventManager', 'onMailMessageNew')
	->registerCompatible('im', 'OnGetNotifySchema', '\Bitrix\Mail\Integration\Im\Notification', 'getSchema')
	->register('mobile', 'onRequestSyncMail', '\Bitrix\Mail\Integration\SyncRequest', 'onRequestSyncMail')
	->register('calendar', 'OnAfterCalendarEventDelete', '\Bitrix\Mail\Integration\Calendar\ICal\ICalMailEventManager', 'onUnbindEvent')
	->register('ai', 'onTuningLoad', '\Bitrix\Mail\Integration\AI\EventHandler', 'onTuningLoad')
	->register('ai', 'onContextGetMessages', '\Bitrix\Mail\Integration\AI\Controller', 'onContextGetMessages')
	->register('humanresources', 'OnMemberUpdated', '\Bitrix\Mail\Integration\HumanResources\StructureEventHandler', 'onMemberUpdated')
	->register('humanresources', 'OnMemberAdded', '\Bitrix\Mail\Integration\HumanResources\StructureEventHandler', 'onMemberAdded')
	->register('humanresources', 'OnMemberDeleted', '\Bitrix\Mail\Integration\HumanResources\StructureEventHandler', 'onMemberDeleted')
	->registerCompatible('pull', 'OnGetDependentModule', '\Bitrix\Mail\MailPullSchema', 'OnGetDependentModule')
	->registerCompatible('tasks', 'OnTaskDelete', '\Bitrix\Mail\Integration\Intranet\Secretary', 'onTaskDelete')
	->register('mail', 'onMailMessageNew', '\Bitrix\Mail\Integration\AI\MessageClassifier', 'onMailMessageNew')
	->register('mail', 'onMailMessageBodySynced', '\Bitrix\Mail\Integration\AI\MessageClassifier', 'onMailMessageBodySynced')
	->register('ai', 'onQueueJobExecute', '\Bitrix\Mail\Integration\AI\MessageClassifier', 'onQueueJobExecute')
;
