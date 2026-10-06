<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register(
		'mobileapp',
		'onJNComponentWorkspaceGet',
		\Bitrix\TasksMobile\Workspace::class,
		'getPath',
	)
	->register(
		'mobile',
		'onTariffRestrictionsCollect',
		\Bitrix\TasksMobile\Provider\TariffPlanRestrictionProvider::class,
		'getTariffPlanRestrictions',
	)
	->register(
		'mobile',
		'onMobileMenuStructureBuilt',
		'Bitrix\TasksMobile\MobileMenuManager',
		'onMobileMenuStructureBuilt',
	)
;
