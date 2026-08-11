<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$agent = $migration->agent();

$agent->add("Bitrix\\Rest\\Marketplace\\Client::getNumUpdates();", 86400, false);
$agent->add("Bitrix\\Rest\\EventOfflineTable::cleanProcessAgent();", 86400, false);
$agent->add("Bitrix\\Rest\\LogTable::cleanUpAgent();", 86400, false);
$agent->add('\Bitrix\Rest\Configuration\Helper::sendStatisticAgent();', 86400, false);
$agent->add('\\Bitrix\\Rest\\UsageStatTable::sendAgent();', 3600, false);
$agent->add('\\Bitrix\\Rest\\UsageStatTable::cleanUpAgent();', 3600, false);
$agent->add('\Bitrix\Rest\Marketplace\Notification::checkAgent();', 86400, false);
$agent->add('\Bitrix\Rest\Marketplace\Immune::load();', 86400, false);
$agent->add('\Bitrix\Rest\Configuration\Structure::clearContentAgent();', 86400, false);
$agent->add('\Bitrix\Rest\Helper::recoveryAgents();', 604800, false);
