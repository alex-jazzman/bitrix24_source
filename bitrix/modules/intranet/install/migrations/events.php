<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();

$event
	->registerCompatible('search', 'OnReindex', 'CIntranetSearch', 'OnSearchReindex')
	->registerCompatible('search', 'OnSearchGetURL', 'CIntranetSearch', 'OnSearchGetURL')
	->registerCompatible('main', 'OnAfterUserUpdate', 'CIntranetSearch', 'OnUserUpdate')
	->registerCompatible('main', 'OnAfterUserAdd', 'CIntranetSearch', 'OnUserAdd')
	->registerCompatible('main', 'OnUserDelete', 'CIntranetSearch', 'OnUserDelete')
	->registerCompatible('search', 'OnSearchGetFileContent', 'CIntranetSearchConverters', 'OnSearchGetFileContent')
	->registerCompatible('search', 'BeforeIndex', 'CIntranetSearch', 'ExcludeBlogUser')
	->registerCompatible('main', 'OnAfterUserUpdate', 'CIntranetEventHandlers', 'UpdateActivity')
	->registerCompatible('main', 'OnUserDelete', 'CIntranetEventHandlers', 'OnUserDelete')
	->registerCompatible('iblock', 'OnAfterIBlockElementUpdate', 'CIntranetEventHandlers', 'UpdateActivityIBlock')
	->registerCompatible('iblock', 'OnAfterIBlockElementAdd', 'CIntranetEventHandlers', 'UpdateActivityIBlock')
	->registerCompatible('iblock', 'OnAfterIBlockElementDelete', 'CIntranetEventHandlers', 'OnAfterIBlockElementDelete')
	->registerCompatible('main', 'OnAfterUserAdd', 'CIntranetEventHandlers', 'OnAfterUserAdd')
	->registerCompatible('main', 'OnUserInitialize', 'CIntranetEventHandlers', 'OnAfterUserInitialize')
	->registerCompatible('main', 'OnAfterUserAuthorize', 'CIntranetInviteDialog', 'OnAfterUserAuthorize')
	->registerCompatible('main', 'OnAfterUserAuthorize', 'CIntranetEventHandlers', 'OnAfterUserAuthorize')
	->registerCompatible('forum', 'onAfterMessageAdd', 'CIntranetEventHandlers', 'onAfterForumMessageAdd')
	->registerCompatible('forum', 'onAfterMessageDelete', 'CIntranetEventHandlers', 'onAfterForumMessageDelete')
	->registerCompatible('main', 'OnAfterUserTypeAdd', 'CIntranetEventHandlers', 'OnAfterUserTypeAdd')
	->registerCompatible(
		'main',
		'OnBeforeUserRegister',
		\Bitrix\Intranet\Internal\Integration\Main\EventHandler\User\UserRegisterSiteGroups::class,
		'addEmployeeSiteGroups'
	)
	->registerCompatible('iblock', 'OnBeforeIBlockSectionUpdate', 'CIntranetEventHandlers', 'OnBeforeIBlockSectionUpdate')
	->registerCompatible('iblock', 'OnBeforeIBlockSectionAdd', 'CIntranetEventHandlers', 'OnBeforeIBlockSectionAdd')
	->registerCompatible('main', 'OnUserTypeBuildList', 'CUserTypeEmployee', 'GetUserTypeDescription')
	->registerCompatible('iblock', 'OnIBlockPropertyBuildList', 'CIBlockPropertyEmployee', 'GetUserTypeDescription')
	->registerCompatible('main', 'OnBeforeProlog', 'CIntranetEventHandlers', 'OnCreatePanel')
	->registerCompatible('main', 'OnBeforeUserUpdate', 'CIntranetEventHandlers', 'OnBeforeUserUpdate')
	->registerCompatible('main', 'OnAfterUserUpdate', 'CIntranetEventHandlers', 'OnAfterUserUpdate')
	->registerCompatible('socialservices', 'OnAfterSocServUserAdd', 'CIntranetEventHandlers', 'OnAfterSocServUserAdd')
	->registerCompatible('main', 'onUserDelete', 'CIntranetEventHandlers', 'ClearAllUsersCache')
	->registerCompatible('main', 'onAfterUserAdd', 'CIntranetEventHandlers', 'ClearAllUsersCache')
	->registerCompatible('main', 'OnAfterUserUpdate', 'CIntranetEventHandlers', 'ClearSingleUserCache')
	->registerCompatible('iblock', 'OnAfterIBlockSectionUpdate', 'CIntranetEventHandlers', 'ClearDepartmentCache')
	->registerCompatible(
		'socialnetwork',
		'OnFillSocNetAllowedSubscribeEntityTypes',
		'CIntranetEventHandlers',
		'OnFillSocNetAllowedSubscribeEntityTypes'
	)
	->registerCompatible('socialnetwork', 'OnFillSocNetLogEvents', 'CIntranetEventHandlers', 'OnFillSocNetLogEvents')
	->registerCompatible(
		'socialnetwork',
		'OnFillSocNetAllowedSubscribeEntityTypes',
		'CIntranetNotify',
		'OnFillSocNetAllowedSubscribeEntityTypes'
	)
	->registerCompatible('socialnetwork', 'OnFillSocNetLogEvents', 'CIntranetNotify', 'OnFillSocNetLogEvents')
	->registerCompatible('socialnetwork', 'OnSendMentionGetEntityFields', 'CIntranetNotify', 'OnSendMentionGetEntityFields')
	->registerCompatible('iblock', 'OnAfterIBlockElementAdd', 'CIntranetEventHandlers', 'SPRegisterUpdatedItem')
	->registerCompatible('iblock', 'OnAfterIBlockElementUpdate', 'CIntranetEventHandlers', 'SPRegisterUpdatedItem')
	->registerCompatible('main', 'OnAfterAddRatingRule', 'CRatingRulesIntranet', 'OnAfterAddRatingRule')
	->registerCompatible('main', 'OnAfterUpdateRatingRule', 'CRatingRulesIntranet', 'OnAfterUpdateRatingRule')
	->registerCompatible('main', 'OnGetRatingRuleObjects', 'CRatingRulesIntranet', 'OnGetRatingRuleObjects')
	->registerCompatible('main', 'OnGetRatingRuleConfigs', 'CRatingRulesIntranet', 'OnGetRatingRuleConfigs')
	->registerCompatible('main', 'OnAuthProvidersBuildList', 'CIntranetAuthProvider', 'GetProviders')
	->registerCompatible('iblock', 'OnAfterIBlockSectionDelete', 'CIntranetAuthProvider', 'OnAfterIBlockSectionDelete')
	->registerCompatible('search', 'OnSearchCheckPermissions', 'CIntranetAuthProvider', 'OnSearchCheckPermissions')
	->registerCompatible('crm', 'OnAfterCrmContactAdd', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onAfterCrmContactAddEvent')
	->registerCompatible('crm', 'OnAfterCrmCompanyAdd', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onAfterCrmCompanyAddEvent')
	->registerCompatible('crm', 'OnAfterCrmLeadAdd', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onAfterCrmLeadAddEvent')
	->registerCompatible('crm', 'OnAfterCrmDealAdd', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onAfterCrmDealAddEvent')
	->registerCompatible('crm', 'OnAfterCrmAddEvent', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onAfterCrmAddEventEvent')
	->registerCompatible('sale', 'OnOrderAdd', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onOrderAddEvent')
	->registerCompatible('sale', 'OnOrderUpdate', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onOrderUpdateEvent')
	->registerCompatible('catalog', 'OnProductAdd', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onProductAddEvent')
	->registerCompatible('catalog', 'OnProductUpdate', '\Bitrix\Intranet\UStat\CrmEventHandler', 'onProductUpdateEvent')
	->registerCompatible('webdav', 'OnAfterDiskFileAdd', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFileAddEvent')
	->registerCompatible('webdav', 'OnAfterDiskFileUpdate', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFileUpdateEvent')
	->registerCompatible('webdav', 'OnAfterDiskFolderAdd', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFolderAddEvent')
	->registerCompatible('webdav', 'OnAfterDiskFolderUpdate', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFolderUpdateEvent')
	->registerCompatible('webdav', 'OnAfterDiskFirstUsageByDay', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFirstUsageByDayEvent')
	->registerCompatible('disk', 'OnAfterDiskFileAdd', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFileAddEvent')
	->registerCompatible('disk', 'OnAfterDiskFileUpdate', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFileUpdateEvent')
	->registerCompatible('disk', 'OnAfterDiskFolderAdd', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFolderAddEvent')
	->registerCompatible('disk', 'OnAfterDiskFolderUpdate', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFolderUpdateEvent')
	->registerCompatible('disk', 'OnAfterDiskFirstUsageByDay', '\Bitrix\Intranet\UStat\DiskEventHandler', 'onAfterDiskFirstUsageByDayEvent')
	->registerCompatible('im', 'OnAfterMessagesAdd', '\Bitrix\Intranet\UStat\ImEventHandler', 'onAfterMessagesAddEvent')
	->registerCompatible('im', 'OnCallStart', '\Bitrix\Intranet\UStat\ImEventHandler', 'onCallStartEvent')
	->registerCompatible('im', 'OnGetNotifySchema', '\Bitrix\Intranet\Integration\Im', 'onGetNotifySchema')
	->registerCompatible('main', 'OnAddRatingVote', '\Bitrix\Intranet\UStat\LikesEventHandler', 'onAddRatingVoteEvent')
	->registerCompatible('mobileapp', 'OnMobileInit', '\Bitrix\Intranet\UStat\MobileEventHandler', 'onMobileInitEvent')
	->registerCompatible('blog', 'OnPostAdd', '\Bitrix\Intranet\UStat\SocnetEventHandler', 'onPostAddEvent')
	->registerCompatible('blog', 'OnCommentAdd', '\Bitrix\Intranet\UStat\SocnetEventHandler', 'onCommentAddEvent')
	->registerCompatible('tasks', 'OnTaskAdd', '\Bitrix\Intranet\UStat\TasksEventHandler', 'onTaskAddEvent')
	->registerCompatible('tasks', 'OnTaskUpdate', '\Bitrix\Intranet\UStat\TasksEventHandler', 'onTaskUpdateEvent')
	->registerCompatible('tasks', 'OnTaskElapsedTimeAdd', '\Bitrix\Intranet\UStat\TasksEventHandler', 'onTaskElapsedTimeAddEvent')
	->registerCompatible('tasks', 'OnAfterCommentAdd', '\Bitrix\Intranet\UStat\TasksEventHandler', 'onAfterCommentAddEvent')
	->registerCompatible('iblock', 'OnModuleUnInstall', 'CIntranetEventHandlers', 'OnIBlockModuleUnInstall')
	->registerCompatible('rest', 'OnRestServiceBuildDescription', 'CIntranetRestService', 'OnRestServiceBuildDescription')
	->registerCompatible('rest', 'OnRestAppInstall', 'CIntranetEventHandlers', 'onRestAppInstall')
	->registerCompatible('rest', 'OnRestAppDelete', 'CIntranetEventHandlers', 'onRestAppDelete')
	->register('humanresources', 'OnMemberAdded', '\Bitrix\Intranet\Integration\HumanResources\EventHandler', 'onMemberChanges')
	->register('humanresources', 'OnMemberUpdated', '\Bitrix\Intranet\Integration\HumanResources\EventHandler', 'onMemberChanges')
	->register('humanresources', 'OnMemberDeleted', '\Bitrix\Intranet\Integration\HumanResources\EventHandler', 'onMemberChanges')
	->register('humanresources', 'OnNodeUpdated', '\Bitrix\Intranet\Integration\HumanResources\EventHandler', 'onNodeUpdated')
	->register('humanresources', 'OnNodeDeleted', '\Bitrix\Intranet\Integration\HumanResources\EventHandler', 'onNodeDeleted')
	->register('main', 'onApplicationScopeError', '\Bitrix\Intranet\PublicApplication', 'onApplicationScopeError')
	->register(
		'socialservices',
		'\Bitrix\Socialservices\User::' . \Bitrix\Main\Entity\DataManager::EVENT_ON_AFTER_ADD,
		'CIntranetEventHandlers',
		'OnAfterSocServUserAdd'
	)
	->register('security', 'onOtpRequired', '\Bitrix\Intranet\Integration\Security', 'onOtpRequired')
	->registerCompatible(
		'main',
		'onUserOnlineStatusGetCustomOfflineStatus',
		'\Bitrix\Intranet\UserAbsence',
		'onUserOnlineStatusGetCustomOfflineStatus'
	)
	->registerCompatible('iblock', 'OnAfterIBlockElementAdd', '\Bitrix\Intranet\Absence\Event', 'onAfterIblockElementAdd')
	->registerCompatible('iblock', 'OnAfterIBlockElementUpdate', '\Bitrix\Intranet\Absence\Event', 'onAfterIblockElementUpdate')
	->registerCompatible('iblock', 'OnAfterIBlockElementDelete', '\Bitrix\Intranet\Absence\Event', 'onAfterIblockElementDelete')
	->registerCompatible('iblock', 'OnAfterIBlockSectionUpdate', '\Bitrix\Intranet\Integration\Main', 'onAfterIblockSectionUpdate')
	->register(
		'socialnetwork',
		'onLogCommentIndexGetContent',
		'\Bitrix\Intranet\Integration\Socialnetwork\LogComment',
		'onIndexGetContent'
	)
	->register(
		'main',
		'OnUISelectorGetProviderByEntityType',
		'\Bitrix\Intranet\Integration\Main\UISelector\Handler',
		'OnUISelectorGetProviderByEntityType'
	)
	->register(
		'main',
		'OnUISelectorActionProcessAjax',
		'\Bitrix\Intranet\Integration\Main\UISelector\Handler',
		'OnUISelectorActionProcessAjax'
	)
	->register('rest', 'OnRestApplicationConfigurationEntity', '\Bitrix\Intranet\Integration\Rest\Configuration\Controller', 'getEntityList')
	->register('rest', 'OnRestApplicationConfigurationExport', '\Bitrix\Intranet\Integration\Rest\Configuration\Controller', 'onExport')
	->register('rest', 'OnRestApplicationConfigurationImport', '\Bitrix\Intranet\Integration\Rest\Configuration\Controller', 'onImport')
	->register('rest', 'onAfterPlacementAdd::LEFT_MENU', '\Bitrix\Intranet\Integration\Rest\EventHandler', 'onRegisterPlacementLeftMenu')
	->register('rest', 'onAfterPlacementDelete::LEFT_MENU', '\Bitrix\Intranet\Integration\Rest\EventHandler', 'onUnRegisterPlacementLeftMenu')
	->register('tasks', 'onTaskUpdate', '\Bitrix\Intranet\Integration\Tasks', 'onTaskUpdate')
	->register('calendar', 'OnAfterCalendarEntryUpdate', '\Bitrix\Intranet\Integration\Calendar', 'onCalendarEventUpdate')
	->register('calendar', 'OnAfterCalendarEventDelete', '\Bitrix\Intranet\Integration\Calendar', 'OnCalendarEventDelete')
	->register('ui', 'OnSidepanelBelowPage', 'Bitrix\Intranet\UI\Sidepanel\EventHandler', 'onBelowPage')
	->register('crm', 'OnCrmEntityDetailsFrameBelowPage', 'Bitrix\Intranet\UI\Sidepanel\EventHandler', 'onBelowPage')
	->register('main', 'MainSenderSmtpLimitDecrease', 'Bitrix\Intranet\Integration\Main\EventHandler', 'onSenderSmtpLimitDecrease')
	->register('main', 'OnBuildFilterFactoryMethods', '\Bitrix\Intranet\User\Filter\FactoryIntranet', 'onBuildFilterFactoryMethods')
	->register('socialnetwork', 'OnSocNetUserToGroupAdd', \Bitrix\Intranet\Invitation::class, 'onSocNetUserToGroupAddHandler')
	->register('socialnetwork', 'OnSocNetUserToGroupUpdate', \Bitrix\Intranet\Invitation::class, 'onSocNetUserToGroupUpdateHandler')
	->register('socialnetwork', 'OnAfterSocNetUserToGroupDelete', \Bitrix\Intranet\Invitation::class, 'onSocNetUserToGroupDeleteHandler')
	->register('socialservices', 'OnUserInitialize', 'CIntranetEventHandlers', 'OnAfterUserInitialize')
	->register('timeman', 'OnAfterTMDayStart', \Bitrix\Intranet\Integration\Timeman\Worktime::class, 'OnAfterTMDayStart')
	->register('timeman', 'OnAfterTMDayEnd', \Bitrix\Intranet\Integration\Timeman\Worktime::class, 'OnAfterTMDayEnd')
	->register('timeman', 'OnAfterTMDayPause', \Bitrix\Intranet\Integration\Timeman\Worktime::class, 'OnAfterTMDayPause')
	->register('timeman', 'OnAfterTMDayContinue', \Bitrix\Intranet\Integration\Timeman\Worktime::class, 'OnAfterTMDayContinue')
	->register('pull', 'OnGetDependentModule', \Bitrix\Intranet\Integration\Timeman\Worktime::class, 'OnGetDependentModule')
;

$mode = $migration->context()->getDatabaseUpdateMode();

if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	RegisterModuleDependences('main', 'OnAfterAddRating', 'intranet', 'CRatingsComponentsIntranet', 'OnAfterAddRating', 200);
	RegisterModuleDependences('main', 'OnAfterUpdateRating', 'intranet', 'CRatingsComponentsIntranet', 'OnAfterUpdateRating', 200);
	RegisterModuleDependences('main', 'OnSetRatingsConfigs', 'intranet', 'CRatingsComponentsIntranet', 'OnSetRatingConfigs', 200);
	RegisterModuleDependences('main', 'OnGetRatingsConfigs', 'intranet', 'CRatingsComponentsIntranet', 'OnGetRatingConfigs', 200);
	RegisterModuleDependences('main', 'OnGetRatingsObjects', 'intranet', 'CRatingsComponentsIntranet', 'OnGetRatingObject', 200);

	RegisterModuleDependences(
		'main',
		'OnApplicationsBuildList',
		'main',
		'\Bitrix\Intranet\OutlookApplication',
		'OnApplicationsBuildList',
		100,
		'modules/intranet/lib/outlookapplication.php'
	);
	RegisterModuleDependences(
		'main',
		'OnApplicationsBuildList',
		'main',
		'\Bitrix\Intranet\PublicApplication',
		'OnApplicationsBuildList',
		100,
		'modules/intranet/lib/publicapplication.php'
	);

	$eventManager = \Bitrix\Main\EventManager::getInstance();
	$eventManager->registerEventHandler(
		'intranet',
		'onUserInvited',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onUserInvitedHandler',
		50
	);
	$eventManager->registerEventHandler(
		'main',
		'OnUserInitialize',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onUserInitializeHandler',
		50
	);
	$eventManager->registerEventHandler(
		'main',
		'OnAfterUserAuthorize',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onAfterUserAuthorizeHandler',
		50
	);
	$eventManager->registerEventHandler(
		'main',
		'OnBeforeUserDelete',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onBeforeUserDeleteHandler',
		50
	);
	$eventManager->registerEventHandler(
		'intranet',
		'OnRegisterUser',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onRegisterUser',
		50
	);
	$eventManager->registerEventHandler(
		'main',
		'OnAfterSetUserGroup',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onAfterSetUserGroupHandler',
		50
	);
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	UnRegisterModuleDependences('main', 'OnAfterAddRating', 'intranet', 'CRatingsComponentsIntranet', 'OnAfterAddRating');
	UnRegisterModuleDependences('main', 'OnAfterUpdateRating', 'intranet', 'CRatingsComponentsIntranet', 'OnAfterUpdateRating');
	UnRegisterModuleDependences('main', 'OnSetRatingsConfigs', 'intranet', 'CRatingsComponentsIntranet', 'OnSetRatingConfigs');
	UnRegisterModuleDependences('main', 'OnGetRatingsConfigs', 'intranet', 'CRatingsComponentsIntranet', 'OnGetRatingConfigs');
	UnRegisterModuleDependences('main', 'OnGetRatingsObjects', 'intranet', 'CRatingsComponentsIntranet', 'OnGetRatingObject');

	UnRegisterModuleDependences(
		'main',
		'OnApplicationsBuildList',
		'main',
		'\Bitrix\Intranet\OutlookApplication',
		'OnApplicationsBuildList',
		'modules/intranet/lib/outlookapplication.php'
	);
	UnRegisterModuleDependences(
		'main',
		'OnApplicationsBuildList',
		'main',
		'\Bitrix\Intranet\PublicApplication',
		'OnApplicationsBuildList',
		'modules/intranet/lib/publicapplication.php'
	);

	$eventManager = \Bitrix\Main\EventManager::getInstance();
	$eventManager->unRegisterEventHandler(
		'intranet',
		'onUserInvited',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onUserInvitedHandler'
	);
	$eventManager->unRegisterEventHandler(
		'main',
		'OnUserInitialize',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onUserInitializeHandler'
	);
	$eventManager->unRegisterEventHandler(
		'main',
		'OnAfterUserAuthorize',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onAfterUserAuthorizeHandler'
	);
	$eventManager->unRegisterEventHandler(
		'main',
		'OnBeforeUserDelete',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onBeforeUserDeleteHandler'
	);
	$eventManager->unRegisterEventHandler(
		'intranet',
		'OnRegisterUser',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onRegisterUser'
	);
	$eventManager->unRegisterEventHandler(
		'main',
		'OnAfterSetUserGroup',
		'intranet',
		\Bitrix\Intranet\Invitation::class,
		'onAfterSetUserGroupHandler'
	);
}
