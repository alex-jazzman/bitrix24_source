<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent
	->add('\Bitrix\BIConnector\LogTable::cleanUpAgent();', 86400)
	->add('\Bitrix\BIConnector\Integration\Superset\Agent::createDefaultRoles();', 86400)
	->add('\Bitrix\BIConnector\Integration\Superset\Agent::actualizeSystemDashboards();', 86400)
;
