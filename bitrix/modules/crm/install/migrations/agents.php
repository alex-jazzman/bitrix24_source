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
