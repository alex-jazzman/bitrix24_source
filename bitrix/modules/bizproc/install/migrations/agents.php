<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();
$option = \Bitrix\Main\UpdateSystem\Migration::getInstance()->option();

$agent->add('Bitrix\Bizproc\Infrastructure\Agent\SyncAiAgentNodesAgent::runAgent();', 86400, true);
$agent->add('Bitrix\Bizproc\Install\Agent\CreateRobotVersionIndex::run();', 60);
$agent->add([\Bitrix\Bizproc\Infrastructure\Agent\LastValuesCleanupAgent::class, 'runAgent'], 86400);
$agent->add('Bitrix\Bizproc\Infrastructure\Agent\ClearStuckPauseWorkflowAgent::run();', 86400);
// on an update the option is written by ResumeMessageItemIdStepper, a fresh portal has nothing to backfill
$option->set('bizproc', 'clear_stuck_pause_agent_active', 'Y');
// ManagedSystemAiAgentCleanupAgent::PERIOD_SECONDS; the literal keeps the class out of the migration hit
$agent->add([\Bitrix\Bizproc\Infrastructure\Agent\ManagedSystemAiAgentCleanupAgent::class, 'runAgent'], 300);
