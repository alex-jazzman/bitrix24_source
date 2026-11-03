<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->agent()->add(
	[\Bitrix\Vibecodeconnector\Infrastructure\Agent\AppChatMaintenanceAgent::class, 'run'],
	60,
);
