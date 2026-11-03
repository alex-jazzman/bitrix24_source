<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

// No leading backslash in a name: Migration\Agent::doAdd() rejects one outright in the developer
// mode, and CAgent tells rows apart by the exact name, so a second spelling of one call is a second
// live row and a doubled number of passes. The platform builds the name without it, and so does
// __CLASS__ inside an agent that re-registers itself.
$agent
	->add('Bitrix\BIConnector\LogTable::cleanUpAgent();', 86400)
	->add('Bitrix\BIConnector\Integration\Superset\Agent::createDefaultRoles();', 86400)
	->add('Bitrix\BIConnector\Integration\Superset\Agent::actualizeSystemDashboards();', 86400)
	->add('Bitrix\BIConnector\Access\Update\TableGroupBindingAgent::run();', 86400)
	->add('Bitrix\BIConnector\Access\Update\CrmContactLinkTableGroupBindingAgent::run();', 86400)
	->add([\Bitrix\BIConnector\Superset\Dashboard\ShareRetentionAgent::class, 'run'], 86400)
;
