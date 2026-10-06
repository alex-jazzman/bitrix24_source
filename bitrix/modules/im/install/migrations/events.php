<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event->registerCompatible('main', 'OnAddRatingVote', 'CIMEvent', 'OnAddRatingVote');
$event->registerCompatible('main', 'OnChangeRatingVote', 'CIMEvent', 'OnAddRatingVote');
$event->registerCompatible('main', 'OnCancelRatingVote', 'CIMEvent', 'OnCancelRatingVote');
$event->registerCompatible('main', 'OnAfterUserAdd', 'CIMEvent', 'OnAfterUserAdd');
$event->registerCompatible('main', 'OnAfterUserUpdate', 'CIMEvent', 'OnAfterUserUpdate');
$event->registerCompatible('main', 'OnUserDelete', 'CIMEvent', 'OnUserDelete');
$event->registerCompatible('main', 'OnBeforeUserSendPassword', 'CIMEvent', 'OnBeforeUserSendPassword');
$event->registerCompatible('pull', 'OnGetDependentModule', 'CIMEvent', 'OnGetDependentModule');
$event->registerCompatible('perfmon', 'OnGetTableSchema', 'im', 'OnGetTableSchema');
$event->registerCompatible('im', 'OnGetNotifySchema', 'CIMNotifySchema', 'OnGetNotifySchema');
$event->registerCompatible('main', 'OnFileDelete', 'CIMEvent', 'OnFileDelete');
$event->registerCompatible('disk', 'onAfterDeleteFile', 'CIMDisk', 'OnAfterDeleteFile');
$event->registerCompatible('main', 'OnApplicationsBuildList', 'DesktopApplication', 'OnApplicationsBuildList');
$event->registerCompatible('main', 'OnUserOnlineStatusGetCustomOnlineStatus', 'CIMStatus', 'OnUserOnlineStatusGetCustomStatus');
$event->registerCompatible('main', 'OnUserOnlineStatusGetCustomOfflineStatus', 'CIMStatus', 'OnUserOnlineStatusGetCustomStatus');
$event->registerCompatible('rest', 'OnRestServiceBuildDescription', 'CIMRestService', 'OnRestServiceBuildDescription');
$event->registerCompatible('rest', 'OnRestAppDelete', 'CIMRestService', 'OnRestAppDelete');
$event->registerCompatible('main', 'OnAuthProvidersBuildList', '\Bitrix\Im\Access\ChatAuthProvider', 'getProviders');
$event->registerCompatible('main', 'OnAfterUserUpdate', '\Bitrix\Im\Configuration\EventHandler', 'onAfterUserUpdate');
$event->registerCompatible('main', 'OnAfterUserDelete', '\Bitrix\Im\Configuration\EventHandler', 'onAfterUserDelete');
$event->registerCompatible('main', 'OnAfterUserAdd', '\Bitrix\Im\Configuration\EventHandler', 'onAfterUserAdd');

$event->register('pull', 'onGetMobileCounter', '\Bitrix\Im\Counter', 'onGetMobileCounter');
$event->register('pull', 'onGetMobileCounterTypes', '\Bitrix\Im\Counter', 'onGetMobileCounterTypes');
$event->register('calendar', 'OnAfterCalendarEntryUpdate', '\Bitrix\Im\V2\Service\Messenger', 'updateCalendar');
$event->register('calendar', 'OnAfterCalendarEventDelete', '\Bitrix\Im\V2\Service\Messenger', 'unregisterCalendar');
$event->register('im', 'OnAfterMessagesAdd', '\Bitrix\Im\V2\Message\Delete\DisappearService', 'checkDisappearing');
$event->register('ai', 'onTuningLoad', '\Bitrix\Im\V2\Integration\AI\Restriction', 'onTuningLoad');
$event->register('humanresources', 'OnRelationAdded', '\Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService', 'onRelationAdded');
$event->register('humanresources', 'OnRelationDeleted', '\Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService', 'onRelationDeleted');
$event->register('humanresources', 'OnRelationPartDeleted', '\Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService', 'onRelationPartDeleted');
$event->register('humanresources', 'OnMemberAdded', '\Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService', 'onMemberAdded');
$event->register('humanresources', 'OnMemberDeleted', '\Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService', 'onMemberDeleted');
$event->register('intranet', 'onLicenseHasChanged', '\Bitrix\Im\V2\TariffLimit\Limit', 'onLicenseHasChanged');
$event->register('humanresources', 'OnMemberUpdated', '\Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService', 'onMemberUpdated');
$event->register('main', 'OnAfterSetOption_isAutoDeleteMessagesEnabled', '\Bitrix\Im\V2\Message\Delete\DisappearService', 'onAutoDeleteOptionChanged');
$event->register('main', 'OnAfterSetOption_chat_with_guests_available', '\Bitrix\Im\V2\Guest\GuestLinkService', 'onChatWithGuestsOptionChanged');
$event->register('ai', 'onQueueJobExecute', '\Bitrix\Im\V2\Integration\AI\QueueManager', 'onQueueJobExecute');
$event->register('ai', 'onQueueJobFail', '\Bitrix\Im\V2\Integration\AI\QueueManager', 'onQueueJobFail');
$event->register('socialnetwork', 'onContentViewed', '\Bitrix\Im\V2\Integration\Socialnetwork\EventHandler\ContentViewedHandler', 'onContentViewed');
$event->register('socialnetwork', 'onSpaceLiveFeedReadAll', '\Bitrix\Im\V2\Integration\Socialnetwork\EventHandler\LiveFeedReadAllHandler', 'onSpaceLiveFeedReadAll');
$event->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\Im\V2\Marketplace\Placement', 'onRestServiceBuildDescription');
$event->register('main', 'onApplicationScopeError', '\Bitrix\Im\V2\Guest\Auth\GuestApplication', 'onApplicationScopeError');
