<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register('mobileapp', 'onJNComponentWorkspaceGet', \Bitrix\ImMobile\Workspace::class, 'getPath')
	->register('rest', 'OnRestServiceBuildDescription', \Bitrix\ImMobile\Marketplace\Placement::class, 'onRestServiceBuildDescription')
;
