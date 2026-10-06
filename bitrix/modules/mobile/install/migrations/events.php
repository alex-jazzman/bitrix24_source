<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();

$event
	->register('pull', 'ShouldMessageBeSent', 'CMobileEvent', 'shouldSendNotification')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\Mobile\Rest', 'onRestServiceBuildDescription')
	->register('mobile', 'onOneTimeHashRemoved', '\Bitrix\Mobile\Deeplink', 'onOneTimeHashRemoved')
	->register('pull', 'OnGetDependentModule', 'CMobileEvent', 'PullOnGetDependentModule')
	->register('pull', 'onPushTokenUniqueHashGet', '\Bitrix\Mobile\Push\EventHandler', 'onPushTokenUniqueHashGet')
	->register(
		'main',
		'onApplicationScopeError',
		'\Bitrix\Mobile\Auth\MobileGuestApplication',
		'onApplicationScopeError',
	)
	->register('mobileapp', 'onJNComponentWorkspaceGet', 'CMobileEvent', 'getJNWorkspace')
	->register('mobile', 'onMobileMenuStructureBuilt', 'CMobileEvent', 'onMobileMenuBuilt')
	->register('main', 'onKernelCheckInstallFilesMappingGet', 'CMobileEvent', 'getKernelCheckPath')
	->register('mobileapp', 'onBeforeComponentContentGet', 'CMobileEvent', 'onBeforeComponentContentGet')
	->register(
		'mobileapp',
		'onBuildEnvVariable',
		\Bitrix\Mobile\Internal\Integration\Mobileapp\EventHandler\OnBuildEnvVariable::class,
		'handle',
	)
;

$mode = $migration->context()->getDatabaseUpdateMode();
$eventManager = \Bitrix\Main\EventManager::getInstance();

if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	$eventManager->registerEventHandler(
		'main',
		'OnApplicationsBuildList',
		'mobile',
		'MobileApplication',
		'OnApplicationsBuildList',
		100,
		'modules/mobile/classes/general/mobile_event.php',
	);
	$eventManager->registerEventHandler(
		'main',
		'OnApplicationsBuildList',
		'mobile',
		'\Bitrix\Mobile\Auth\MobileGuestApplication',
		'onApplicationsBuildList',
		100,
		'modules/mobile/lib/Auth/MobileGuestApplication.php',
	);
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	$eventManager->unRegisterEventHandler(
		'main',
		'OnApplicationsBuildList',
		'mobile',
		'MobileApplication',
		'OnApplicationsBuildList',
		'modules/mobile/classes/general/mobile_event.php',
	);
	$eventManager->unRegisterEventHandler(
		'main',
		'OnApplicationsBuildList',
		'mobile',
		'\Bitrix\Mobile\Auth\MobileGuestApplication',
		'onApplicationsBuildList',
		'modules/mobile/lib/Auth/MobileGuestApplication.php',
	);
}
