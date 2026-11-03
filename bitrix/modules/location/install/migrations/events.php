<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event->register('ui', 'onUIFormInitialize', '\Bitrix\Location\Infrastructure\EventHandler', 'onUIFormInitialize');
