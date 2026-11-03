<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event->register('mobileapp', 'onJNComponentWorkspaceGet', \Bitrix\TimemanMobile\Internal\Workspace::class, 'getPath');
