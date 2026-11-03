<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register('mobileapp', 'onJNComponentWorkspaceGet', \Bitrix\ListsMobile\Workspace::class, 'getPath')
;
