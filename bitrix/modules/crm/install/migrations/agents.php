<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('\Bitrix\Crm\Agent\Recyclebin\RecyclebinAgent::run();', 3600,);

$agent->add('Bitrix\\Crm\\Agent\\Duplicate\\Automatic\\LeadDuplicateIndexRebuildAgent::run();', 3600);
$agent->add('Bitrix\\Crm\\Agent\\Duplicate\\Automatic\\ContactDuplicateIndexRebuildAgent::run();', 3600);
$agent->add('Bitrix\\Crm\\Agent\\Duplicate\\Automatic\\CompanyDuplicateIndexRebuildAgent::run();', 3600);

$agent->add("\\Bitrix\\Crm\\Service\\Factory\\SmartInvoice::createTypeIfNotExists();", 3600);
$agent->add("\\Bitrix\\Crm\\Service\\Factory\\SmartDocument::createTypeIfNotExists();", 3600);
$agent->add("\\Bitrix\\Crm\\Service\\Factory\\SmartB2eDocument::createTypeIfNotExists();", 3600);

$agent->add('\Bitrix\Crm\Integration\Sign\Access::installDefaultRoles();', 60);

\Bitrix\Crm\Update\Entity\ContactId::bindOnCrmModuleInstallIfNeeded();

$agent->add('\Bitrix\Crm\Reservation\Agent\ReservedProductCleaner::runAgent();', 86400);
$agent->add('Bitrix\Crm\Agent\Activity\CompleteOldActivities::run();', 86400);
$agent->add('Bitrix\Crm\Agent\Activity\LightCounterAgent::run();', 60);

\Bitrix\Crm\Update\RemoveDuplicatingMultifieldsStepper::bindOnCrmModuleInstall();

\Bitrix\Crm\Update\Timeline\BindCreatedBackfillStepper::bindOnCrmModuleInstall();

$agent->add("Bitrix\\Crm\\Agent\\Activity\\PingAgent::run();", 60);
$agent->add('Bitrix\Crm\Agent\Badge\RemoveOldEntityBadgesAgent::run();', 60);
$agent->add('Bitrix\Crm\Agent\Duplicate\DedupeCacheCleanerAgent::run();', 3600 * 24);
/**
 * @see \Bitrix\Crm\Agent\RepeatSale\OnlyCalcSchedulerAgent
 */
$agent->add('Bitrix\Crm\Agent\RepeatSale\OnlyCalcSchedulerAgent::run();', 3600);
/**
 * @see \Bitrix\Crm\Agent\RepeatSale\JobExecutorAgent
 */
$agent->add('Bitrix\Crm\Agent\RepeatSale\JobExecutorAgent::run();', 60);
/**
 * @see \Bitrix\Crm\Agent\Copilot\AiQueueBufferAgent
 */
$agent->add('Bitrix\Crm\Agent\Copilot\AiQueueBufferAgent::run();', 60 * 10);
/**
 * @see \Bitrix\Crm\Agent\Copilot\CallScriptMaintenanceAgent
 */
$agent->add('Bitrix\Crm\Agent\Copilot\CallScriptMaintenanceAgent::run();', 604800);
/**
 * @see \Bitrix\Crm\Agent\Copilot\CallScoringV2BootstrapAgent
 */
$agent->add('Bitrix\Crm\Agent\Copilot\CallScoringV2BootstrapAgent::run();', 86400);
/**
 * @see \Bitrix\Crm\V2\Internal\Integration\AiAssistant\Trigger\Install\TriggerSyncAgent
 */
$agent->add([\Bitrix\Crm\V2\Internal\Integration\AiAssistant\Trigger\Install\TriggerSyncAgent::class, 'run'], 1200);

// One-time rollout of the RepeatSale "subscription seen" marker: on portals that already have a
// subscription, mark it as seen so the first onSubscriptionRenew does not misfire as a
// "first appearance" and enable all AI scenarios on an already configured portal.
if (\Bitrix\Main\Loader::includeModule('crm'))
{
	$seenMarker = new \Bitrix\Crm\RepeatSale\Segment\SubscriptionSeenMarker();
	if (
		!$seenMarker->isSet()
		&& (new \Bitrix\Crm\Integration\Rest\Marketplace\Client())->isSubscriptionUsed()
	)
	{
		$seenMarker->set();
	}
}
