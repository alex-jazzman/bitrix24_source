<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$agent = $migration->agent();

if ($migration->context()->isBox())
{
	$agent->add([\Bitrix\Intranet\Infrastructure\Agent\IntegratorUpdateAgent::class, 'run'], 86400);
}

$agent->add('\\Bitrix\\Intranet\\UStat\\UStat::recountHourlyCompanyActivity();', 60, false);
$agent->add('\\Bitrix\\Intranet\\UStat\\UStat::recount();', 3600, false);

if (!file_exists($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/bitrix24'))
{
	$agent->add('CIntranetSharepoint::AgentLists();', 500, false);
	$agent->add('CIntranetSharepoint::AgentQueue();', 300, false);
	$agent->add('CIntranetSharepoint::AgentUpdate();', 3600, false);
}
