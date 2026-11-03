<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register(
		'mobileapp',
		'onJNComponentWorkspaceGet',
		\Bitrix\IntranetMobile\Workspace::class,
		'getPath',
	)
	->register(
		'main',
		'OnAfterUserAuthorize',
		'\Bitrix\IntranetMobile\Integration\Main\Event',
		'onAfterUserAuthorizeHandler',
	)
	->register(
		'mobile',
		'onMobileMenuStructureBuilt',
		'Bitrix\IntranetMobile\MobileMenuManager',
		'onMobileMenuStructureBuilt',
	)
;
