<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent
	->add('CMailbox::CleanUp();', 60 * 60 * 24, false)
	->add('Bitrix\Mail\Internal\Agent\DraftCleanupAgent::run();', 3600, false)
	->add('Bitrix\Mail\Internal\Agent\SignatureImageCleanupAgent::run();', 3600, false)
	->add('Bitrix\Mail\Internal\Agent\MigrationOperationAgent::run();', 60, false)
	->add('Bitrix\Mail\Access\Install\AccessInstaller::install();', 60, false, 600)
	->add('Bitrix\Mail\Agent\ScheduledMessageAgent::execute();', 60, false)
	->add('Bitrix\Mail\Agent\ScheduledMessageCleanupAgent::execute();', 5 * 60, false)
	->add('Bitrix\Mail\Helper::restoreVacationAutoReplyCheckIntervalAgent();', 3600, false)
;

// This agent carries the cursor of its walk over the mailbox ids in its name.
if (!\CAgent::GetList([], ['NAME' => 'Bitrix\Mail\Internal\Agent\DeletedMailboxCleanupAgent::run(%'])->Fetch())
{
	$agent->add('Bitrix\Mail\Internal\Agent\DeletedMailboxCleanupAgent::run(0);', 3600, false);
}

// Match the cursor in the agent name so a repeated migration cannot schedule a second collector.
if (!\CAgent::GetList([], ['NAME' => 'Bitrix\Mail\Internal\Agent\MailboxAvatarCleanupAgent::run(%'])->Fetch())
{
	$agent->add('Bitrix\Mail\Internal\Agent\MailboxAvatarCleanupAgent::run(0);', 3600, false);
}

if (!\CAgent::GetList([], ['NAME' => 'Bitrix\Mail\Internal\Agent\SenderAvatarCleanupAgent::run(%'])->Fetch())
{
	$agent->add('Bitrix\Mail\Internal\Agent\SenderAvatarCleanupAgent::run(0);', 3600, false);
}
