<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent
	->add('CMailbox::CleanUp();', 60 * 60 * 24, false)
	->add('Bitrix\Mail\Internal\Agent\DraftCleanupAgent::run();', 3600, false)
	->add('Bitrix\Mail\Internal\Agent\MigrationOperationAgent::run();', 60, false)
	->add('Bitrix\Mail\Access\Install\AccessInstaller::install();', 60, false, 600)
;

// Installing over data left by a previous installation can find the one-shot CRM filter repair still
// running: it reschedules itself under a name carrying its cursor, which the exact-name check inside
// AddAgent() would miss. Match by name mask to cover both forms.
if (!\CAgent::GetList([], ['NAME' => 'Bitrix\Mail\Helper::repairCrmImapFilterAgent(%'])->Fetch())
{
	$agent->add('Bitrix\Mail\Helper::repairCrmImapFilterAgent();', 60, false, 600);
}

// The same name mask reason as above: this one carries the cursor of its walk over the mailbox ids
if (!\CAgent::GetList([], ['NAME' => 'Bitrix\Mail\Internal\Agent\DeletedMailboxCleanupAgent::run(%'])->Fetch())
{
	$agent->add('Bitrix\Mail\Internal\Agent\DeletedMailboxCleanupAgent::run(0);', 3600, false);
}
