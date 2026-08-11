<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register('mobileapp', 'onJNComponentWorkspaceGet', \Bitrix\BizprocMobile\Workspace::class, 'getPath')
	->register('mobile', 'onBeforeTabsGet', \Bitrix\BizprocMobile\BizpocTab::class, 'onBeforeTabsGet')
;
