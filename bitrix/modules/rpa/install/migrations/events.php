<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();
$mode = $migration->context()->getDatabaseUpdateMode();

$event
	->register('main', 'onGetUserFieldTypeFactory', '\Bitrix\Rpa\Driver', 'onGetTypeDataClassList')
	->register('pull', 'OnGetDependentModule', '\Bitrix\Rpa\Driver', 'onGetDependentModule', 800)
	->register('disk', 'onBuildAdditionalConnectorList', '\Bitrix\Rpa\Driver', 'onDiskBuildConnectorList')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\Rpa\Driver', 'onRestServiceBuildDescription')
	->registerCompatible('im', 'OnGetNotifySchema', \Bitrix\Rpa\Integration\Im\NotifySchema::class, 'onGetNotifySchema')
;

// handler lives in the installer class, migration event() can not register it
if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	RegisterModuleDependences('main', 'OnAfterRegisterModule', 'main', 'rpa', 'installUserFields', 200, '/modules/rpa/install/index.php');
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	UnRegisterModuleDependences('main', 'OnAfterRegisterModule', 'main', 'rpa', 'installUserFields', '/modules/rpa/install/index.php');
}
