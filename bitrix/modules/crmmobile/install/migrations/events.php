<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register(
		'mobileapp',
		'onJNComponentWorkspaceGet',
		\Bitrix\CrmMobile\Workspace::class,
		'getPath',
	)
	->register(
		'pull',
		'onGetMobileCounter',
		\Bitrix\CrmMobile\Integration\Pull\Counter::class,
		'onGetMobileCounter',
	)
	->register(
		'pull',
		'onGetMobileCounterTypes',
		\Bitrix\CrmMobile\Integration\Pull\Counter::class,
		'onGetMobileCounterTypes',
	)
	// the installer stored this handler as a plain string, and unregister matches the stored
	// class name byte for byte — ::class would resolve to a different string and leave a duplicate
	->register(
		'mobile',
		'onMobileMenuStructureBuilt',
		'Bitrix\CrmMobile\MobileMenuManager',
		'onMobileMenuStructureBuilt',
	)
;
