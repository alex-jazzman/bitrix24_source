<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();

$mode = $migration->context()->getDatabaseUpdateMode();

if (
	$mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall
	|| !\Bitrix\Main\ModuleManager::isModuleInstalled('oauth')
)
{
	$event->register('rest', 'onRestCheckAuth', '\Bitrix\Rest\OAuth\Auth', 'onRestCheckAuth');
}

$event
	->register('rest', 'OnRestServiceBuildDescription', 'CBitrixRestEntity', 'OnRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\Rest\Api\User', 'onRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\Rest\Api\Placement', 'onRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\Rest\Api\Event', 'onRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\Rest\Api\UserFieldType', 'onRestServiceBuildDescription')
	->register('rest', 'onFindMethodDescription', '\Bitrix\Rest\Engine\RestManager', 'onFindMethodDescription')
	->register('im', 'OnAfterConfirmNotify', '\Bitrix\Rest\NotifyIm', 'receive')
	->register('rest', '\Bitrix\Rest\APAuth\Password::OnDelete', '\Bitrix\Rest\APAuth\PermissionTable', 'onPasswordDelete')
	->register('perfmon', 'OnGetTableSchema', 'rest', 'OnGetTableSchema')
	->register('rest', 'OnRestApplicationConfigurationImport', '\Bitrix\Rest\Configuration\AppConfiguration', 'onEventImportController')
	->register('rest', 'OnRestApplicationConfigurationExport', '\Bitrix\Rest\Configuration\AppConfiguration', 'onEventExportController')
	->register('rest', 'OnRestApplicationConfigurationClear', '\Bitrix\Rest\Configuration\AppConfiguration', 'onEventClearController')
	->register('rest', 'OnRestApplicationConfigurationEntity', '\Bitrix\Rest\Configuration\AppConfiguration', 'getEntityList')
	->register('rest', 'OnRestApplicationConfigurationGetManifest', '\Bitrix\Rest\Configuration\AppConfiguration', 'getManifestList')
	->register('main', 'OnAfterSetOption_~mp24_paid_date', '\Bitrix\Rest\Marketplace\Client', 'onChangeSubscriptionDate')
	->register('main', 'OnAfterSetOption_~mp24_paid_date', '\Bitrix\Rest\Integration\Main\EventHandler', 'onSubscriptionChange')
	->register('rest', 'onRestCheckAuth', '\Bitrix\Rest\APAuth\Auth', 'onRestCheckAuth')
	->register('rest', 'onRestCheckAuth', '\Bitrix\Rest\SessionAuth\Auth', 'onRestCheckAuth')
	->register('main', 'OnAfterRegisterModule', '\Bitrix\Rest\Engine\ScopeManager', 'onChangeRegisterModule')
	->register('main', 'OnAfterUnRegisterModule', '\Bitrix\Rest\Engine\ScopeManager', 'onChangeRegisterModule')
	->register('main', 'OnAfterRegisterModule', '\Bitrix\Rest\Marketplace\TagTable', 'onAfterRegisterModule')
	->register('main', 'OnAfterUnRegisterModule', '\Bitrix\Rest\Marketplace\TagTable', 'onAfterUnRegisterModule')
	->register('mobile', 'onMobileMenuStructureBuilt', 'Bitrix\Rest\MobileMenuManager', 'onMobileMenuStructureBuilt')
	->registerCompatible('im', 'OnGetNotifySchema', \Bitrix\Rest\Integration\Im\NotifySchema::class, 'onGetNotifySchema')
;

if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	\Bitrix\Main\EventManager::getInstance()->registerEventHandler('main', 'OnBeforeProlog', 'rest', 'CRestEventHandlers', 'OnBeforeProlog', 49);
	\Bitrix\Main\EventManager::getInstance()->registerEventHandler('main', 'OnApplicationsBuildList', 'main', '\Bitrix\Rest\APAuth\Application', 'onApplicationsBuildList', 100, 'modules/rest/lib/apauth/application.php');
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	\Bitrix\Main\EventManager::getInstance()->unRegisterEventHandler('main', 'OnBeforeProlog', 'rest', 'CRestEventHandlers', 'OnBeforeProlog');
	\Bitrix\Main\EventManager::getInstance()->unRegisterEventHandler('main', 'OnApplicationsBuildList', 'main', '\Bitrix\Rest\APAuth\Application', 'onApplicationsBuildList', 'modules/rest/lib/apauth/application.php');
}
