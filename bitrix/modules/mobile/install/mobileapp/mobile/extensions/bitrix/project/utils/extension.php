<?php

use Bitrix\Intranet\Settings\Tools\ToolsManager;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\Loader;

$isCalendarToolAvailable = (
	!Loader::includeModule('intranet')
	|| ToolsManager::getInstance()->checkAvailabilityByToolId('calendar')
);

$isCalendarMobileAvailable = (
	$isCalendarToolAvailable
	&& Loader::includeModule('calendar')
	&& Loader::includeModule('calendarmobile')
);

return [
	'isTasksMobileInstalled' => ModuleManager::isModuleInstalled('tasksmobile'),
	'isCalendarMobileAvailable' => $isCalendarMobileAvailable,
];
