<?php

use Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode;

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();

$event
	->register('iblock', 'OnBeforeIBlockSectionUpdate', \Bitrix\HumanResources\Compatibility\Event\NodeEventHandler::class, 'onBeforeIBlockSectionUpdate')
	->register('iblock', 'OnAfterIBlockSectionAdd', \Bitrix\HumanResources\Compatibility\Event\NodeEventHandler::class, 'onAfterIBlockSectionAdd')
	->register('iblock', 'OnBeforeIBlockSectionDelete', \Bitrix\HumanResources\Compatibility\Event\NodeEventHandler::class, 'onBeforeIBlockSectionDelete')
	->register('main', 'OnAfterUserUpdate', \Bitrix\HumanResources\Compatibility\Event\UserEventHandler::class, 'onAfterUserUpdate')
	->register('main', 'OnAfterUserDelete', \Bitrix\HumanResources\Compatibility\Event\UserEventHandler::class, 'onAfterUserDelete')
	->register('main', 'OnAuthProvidersBuildList', '\Bitrix\HumanResources\Access\AuthProvider\StructureAuthProvider', 'getProviders')
	->register('humanresources', 'OnMemberAdded', \Bitrix\HumanResources\Compatibility\Event\NewToOldEventHandler::class, 'onMemberAdded')
	->register('humanresources', 'OnMemberDeleted', \Bitrix\HumanResources\Compatibility\Event\NewToOldEventHandler::class, 'onMemberDeleted')
	->register('humanresources', 'OnMemberUpdated', \Bitrix\HumanResources\Compatibility\Event\NewToOldEventHandler::class, 'onMemberUpdated')
	->register('humanresources', 'OnNodeAdded', \Bitrix\HumanResources\Compatibility\Event\NewToOldEventHandler::class, 'onNodeAdded')
	->register('humanresources', 'OnNodeUpdated', \Bitrix\HumanResources\Compatibility\Event\NewToOldEventHandler::class, 'onNodeUpdated')
	->register('humanresources', 'OnNodeDeleted', \Bitrix\HumanResources\Compatibility\Event\NewToOldEventHandler::class, 'onNodeDeleted')
	->register('humanresources', 'OnHumanResourcesHcmLinkJobIsDone', \Bitrix\HumanResources\Compatibility\Event\HcmLink\JobEventHandler::class, 'onUpdateDoneJob')
	->register('rest', 'OnRestServiceBuildDescription', \Bitrix\HumanResources\Marketplace\Rest\HcmLink::class, 'onRestServiceBuildDescription')
;

// OnAfterUserAdd was registered with sort=9 (early order). The new register() does not accept sort,
// so keep the previous order via the legacy API, guarded by the database update mode.
$mode = $migration->context()->getDatabaseUpdateMode();

if ($mode === DatabaseUpdateMode::ModuleInstall)
{
	\Bitrix\Main\EventManager::getInstance()->registerEventHandler('main', 'OnAfterUserAdd', 'humanresources', \Bitrix\HumanResources\Compatibility\Event\UserEventHandler::class, 'onAfterUserAdd', 9);
}
elseif ($mode === DatabaseUpdateMode::ModuleUninstall)
{
	\Bitrix\Main\EventManager::getInstance()->unregisterEventHandler('main', 'OnAfterUserAdd', 'humanresources', \Bitrix\HumanResources\Compatibility\Event\UserEventHandler::class, 'onAfterUserAdd');
}
