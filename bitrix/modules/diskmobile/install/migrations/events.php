<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register(
		'mobileapp',
		'onJNComponentWorkspaceGet',
		\Bitrix\DiskMobile\Workspace::class,
		'getPath',
	)
	->register(
		'mobile',
		'onTariffRestrictionsCollect',
		\Bitrix\DiskMobile\Provider\TariffPlanRestrictionProvider::class,
		'getTariffPlanRestrictions',
	)
;
