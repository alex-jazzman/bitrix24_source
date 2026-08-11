<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('Bitrix\Bizproc\Infrastructure\Agent\StorageCleanupAgent::runAgent();', 86400);
$agent->add('Bitrix\Bizproc\Infrastructure\Agent\SyncAiAgentNodesAgent::runAgent();', 86400, true);
$agent->add('Bitrix\Bizproc\Install\Agent\CreateRobotVersionIndex::run();', 60);
