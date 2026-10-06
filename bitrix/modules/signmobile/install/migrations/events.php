<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register('mobileapp', 'onJNComponentWorkspaceGet', \Bitrix\SignMobile\Workspace::class, 'getPath')
	->register('mobile', 'onBeforeTabsGet', \Bitrix\SignMobile\SignTab::class, 'onBeforeTabsGet')
	->register('mobile', 'onMobileMenuStructureBuilt', 'Bitrix\SignMobile\MobileMenuManager', 'onMobileMenuStructureBuilt')
;
