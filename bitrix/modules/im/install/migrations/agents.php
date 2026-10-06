<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('CIMMail::MailNotifyAgent();', 600);
$agent->add('CIMMail::MailMessageAgent();', 600);
$agent->add('CIMDisk::RemoveTmpFileAgent();', 43200);
$agent->add('Bitrix\Im\Notify::cleanNotifyAgent();', 7200);
$agent->add('Bitrix\Im\Bot::deleteExpiredTokenAgent();', 86400);
$agent->add('Bitrix\Im\Disk\NoRelationPermission::cleaningAgent();', 3600);
$agent->add('Bitrix\Im\Message\Uuid::cleanOldRecords();', 86400);
$agent->add('Bitrix\Im\V2\Link\Reminder\ReminderService::remindAgent();', 60);
$agent->add('Bitrix\Im\V2\Link\File\TemporaryFileService::cleanAgent();', 3600);
$agent->add('Bitrix\Im\Update\MessageDisappearing::disappearMessagesAgent();', 60);
$agent->add('Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService::syncRelationAgent();', 300);
$agent->add('Bitrix\Im\V2\Integration\HumanResources\Sync\SyncService::syncMemberAgent();', 300);
$agent->add('Bitrix\Im\V2\Recent\Initializer::executeAgent();', 300);
$agent->add('Bitrix\Im\V2\Message\CounterService\CounterServiceAgent::cleanGhostCountersAgent();', 300);
$agent->add('Bitrix\Im\V2\EventLog\EventService::cleanAgent();', 3600);
$agent->add('Bitrix\Im\V2\Guest\CleanupService::cleanInactiveGuestsAgent();', 60);

$agent->add('CIMChat::InstallGeneralChat(true);', 120, false, 120);
$agent->add('Bitrix\Im\V2\Chat\GeneralChannel::installAgent();', 120, false, 120);
$agent->add("Bitrix\Im\V2\Sync\Agent\FiredUsersAgent::execute('2023-01-01', '', 0);", 300, false, 600);
