<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();

$event
	->registerCompatible(
		'main',
		'OnBeforeUserUpdate',
		\Bitrix\Vibecodeconnector\Internal\Integration\Main\EventHandler\UserEventHandler::class,
		'onBeforeUserUpdate',
	)
	->registerCompatible(
		'main',
		'OnAfterUserUpdate',
		\Bitrix\Vibecodeconnector\Internal\Integration\Main\EventHandler\UserEventHandler::class,
		'onAfterUserUpdate',
	)
	->registerCompatible(
		'main',
		'OnAfterSetUserGroup',
		\Bitrix\Vibecodeconnector\Internal\Integration\Main\EventHandler\UserEventHandler::class,
		'onAfterSetUserGroup',
	)
	->registerCompatible(
		'main',
		'OnAfterUserDelete',
		\Bitrix\Vibecodeconnector\Internal\Integration\Main\EventHandler\UserEventHandler::class,
		'onAfterUserDelete',
	)
;

$mode = $migration->context()->getDatabaseUpdateMode();

if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	RegisterModuleDependences(
		'main',
		'OnEpilog',
		'vibecodeconnector',
		\Bitrix\Vibecodeconnector\Infrastructure\Integration\Main\EventHandler::class,
		'onEpilog',
		101,
	);
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	UnRegisterModuleDependences(
		'main',
		'OnEpilog',
		'vibecodeconnector',
		\Bitrix\Vibecodeconnector\Infrastructure\Integration\Main\EventHandler::class,
		'onEpilog',
	);
}
