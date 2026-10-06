<?php
$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();
$mode = $migration->context()->getDatabaseUpdateMode();

$isAlreadyConverted = !isModuleInstalled('webdav');
if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall || $isAlreadyConverted)
{
	$event
		->registerCompatible('main', 'OnAfterUserAdd', '\Bitrix\Disk\SocialnetworkHandlers', 'onAfterUserAdd')
		->registerCompatible('main', 'onUserDelete', '\Bitrix\Disk\SocialnetworkHandlers', 'onUserDelete')
		->registerCompatible('main', 'OnAfterUserUpdate', '\Bitrix\Disk\SocialnetworkHandlers', 'onAfterUserUpdate')
		->registerCompatible('search', 'OnReindex', '\Bitrix\Disk\Search\IndexManager', 'onSearchReindex')
		->registerCompatible('search', 'OnSearchGetURL', '\Bitrix\Disk\Search\IndexManager', 'onSearchGetUrl')
		->registerCompatible('socialnetwork', 'OnSocNetFeaturesAdd', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetFeaturesAdd')
		->registerCompatible('socialnetwork', 'OnSocNetFeaturesUpdate', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetFeaturesUpdate')
		->registerCompatible('socialnetwork', 'OnSocNetUserToGroupAdd', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetUserToGroupAdd')
		->registerCompatible('socialnetwork', 'OnSocNetUserToGroupUpdate', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetUserToGroupUpdate')
		->registerCompatible('socialnetwork', 'OnSocNetUserToGroupDelete', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetUserToGroupDelete')
		->registerCompatible('socialnetwork', 'OnBeforeSocNetGroupDelete', '\Bitrix\Disk\SocialnetworkHandlers', 'onBeforeSocNetGroupDelete')
		->registerCompatible('socialnetwork', 'OnSocNetGroupDelete', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetGroupDelete')
		->registerCompatible('socialnetwork', 'OnSocNetGroupAdd', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetGroupAdd')
		->registerCompatible('socialnetwork', 'OnSocNetGroupUpdate', '\Bitrix\Disk\SocialnetworkHandlers', 'onSocNetGroupUpdate')
		->registerCompatible('socialnetwork', 'OnAfterFetchDiskUfEntity', '\Bitrix\Disk\SocialnetworkHandlers', 'onAfterFetchDiskUfEntity')
		->registerCompatible('im', 'OnBeforeConfirmNotify', '\Bitrix\Disk\Sharing', 'OnBeforeConfirmNotify')
		->registerCompatible('im', 'OnGetNotifySchema', '\Bitrix\Disk\Integration\NotifySchema', 'onGetNotifySchema')
		->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\Disk\Rest\RestManager', 'onRestServiceBuildDescription')
		->registerCompatible('rest', 'onRestGetModule', '\Bitrix\Disk\Rest\RestManager', 'onRestGetModule')
		->registerCompatible('rest', 'OnRestAppDelete', '\Bitrix\Disk\Rest\RestManager', 'onRestAppDelete')
	;
}

$event
	->registerCompatible('main', 'OnUserTypeBuildList', 'Bitrix\Disk\Uf\FileUserType', 'GetUserTypeDescription')
	->registerCompatible('main', 'OnUserTypeBuildList', 'Bitrix\Disk\Uf\VersionUserType', 'GetUserTypeDescription')
	->registerCompatible('iblock', 'OnBeforeIBlockDelete', 'disk', 'OnBeforeIBlockDelete')
	->registerCompatible('perfmon', 'OnGetTableSchema', 'disk', 'OnGetTableSchema')
	->registerCompatible('iblock', 'OnIBlockPropertyBuildList', '\Bitrix\Disk\Integration\FileDiskProperty', 'GetUserTypeDescription')
	->registerCompatible('disk', 'onAfterDeleteStorage', '\Bitrix\Disk\Integration\Volume', 'onStorageDelete')
	->registerCompatible('main', 'onUserDelete', '\Bitrix\Disk\Integration\Volume', 'onUserDelete')
	->register('main', 'onFileTransformationComplete', '\Bitrix\Disk\Integration\TransformerManager', 'resetCacheInUfAfterTransformation')
	->register('disk', 'OnRetrievingUserRights', '\Bitrix\Disk\Integration\Collab\CollabHandlers', 'onRetrievingUserRights')
	->register('disk', 'OnPreloadUserRights', '\Bitrix\Disk\Integration\Collab\CollabHandlers', 'onPreloadUserRights')
	->register('main', 'onPreviewRendererBuildList', \Bitrix\Disk\Document\DocumentHandlersManager::class, 'additionalPreviewManagersList')
	->register('disk', 'OnSaveSessionInRestrictionLog', '\Bitrix\Disk\Document\OnlyOffice\Handlers\AvailableDocumentSessionCountNotifier', 'handleSessionCountChanges')
	->register('disk', 'OnDeleteSessionsFromRestrictionLog', '\Bitrix\Disk\Document\OnlyOffice\Handlers\AvailableDocumentSessionCountNotifier', 'handleSessionCountChanges')
	->register('baas', 'onServiceBalanceChanged', '\Bitrix\Disk\Document\OnlyOffice\Handlers\AvailableDocumentSessionCountNotifier', 'handleBalanceChanges')
	->register('bizproc', 'onGetDocumentType', \Bitrix\Disk\Internal\Integration\Bizproc\EventHandlers\OnGetDocumentType\GetDocumentTypes::class, 'onGetDocumentType')
	->register('main', 'OnAfterUserLogout', \Bitrix\Disk\Internal\Integration\Main\EventHandlers\OnAfterUserLogoutEventHandler::class, 'handle')
	->register('disk', 'deletingCustomServer', '\Bitrix\Disk\Internal\EventHandlers\RestrictDeleteCustomServerHandler', 'handle')
;

if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	RegisterModuleDependences("main", "OnAfterRegisterModule", "main", "disk", "installUserFields", 100, "/modules/disk/install/index.php");
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	UnRegisterModuleDependences("main", "OnAfterRegisterModule", "main", "disk", "installUserFields", "/modules/disk/install/index.php");
}
