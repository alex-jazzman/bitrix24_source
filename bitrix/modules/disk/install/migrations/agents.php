<?php
$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent
	->add('Bitrix\\Disk\\ExternalLink::removeExpiredWithTypeAuto();', 86400, false)
	->add('Bitrix\\Disk\\Bitrix24Disk\\UploadFileManager::removeIrrelevant();', 1800, false)
	->add('Bitrix\\Disk\\Internals\\Cleaner::deleteShowSession(3, 2);', 3600, false)
	->add('Bitrix\\Disk\\Internals\\Cleaner::deleteRightSetupSession();', 86400, false)
	->add('Bitrix\\Disk\\Internals\\Cleaner::emptyOldDeletedLogEntries();', 2592000, false)
	->add('Bitrix\\Disk\\Internals\\Rights\\Healer::restartSetupSession();', 3600, false)
	->add('Bitrix\\Disk\\Internals\\Rights\\Healer::markBadSetupSession();', 86400, false)
	->add('Bitrix\\Disk\\Search\\Reindex\\ExtendedIndex::processWithStatusExtended();', 1800, false)
	->add('Bitrix\\Disk\\Internals\\Cleaner::deleteVersionsByTtlAgent(3);', 7200, false)
	->add('Bitrix\\Disk\\Internals\\Cleaner::deleteTrashCanFilesByTtlAgent(3);', 8000, false)
	->add('Bitrix\\Disk\\Internals\\Cleaner::deleteTrashCanEmptyFolderByTtlAgent(3);', 8000, false)
	->add('Bitrix\\Disk\\Internals\\Cleaner::releaseObjectLocksAgent();', 7200, false)
	->add('Bitrix\\Disk\\Document\\OnlyOffice\\RestrictionManager::deleteOldOrPendingAgent();', 3600, false)
	->add('Bitrix\\Disk\\Document\\Vibeoffice\\Webhook\\DeliveryTable::deleteOldDeliveriesAgent();', 86400, false)
	->add('Bitrix\\Disk\\Document\\Flipchart\\Comment\\AttachmentService::cleanupExpiredAgent();', 3600, false)
	->add('Bitrix\Disk\Internal\Agent\UploadCleanupMarkerAgent::run();', 900, false)
	// The aging of the interaction set. One tick is bounded by a budget of its own, so the interval is
	// what drains a backlog rather than what measures the window: the window is counted in days, and an
	// interval of a day would drain the first pass over an old portal across weeks.
	->add('Bitrix\\Disk\\Infrastructure\\Agent\\Sync\\InteractionAgingAgent::run();', 3600, false)
	// The cleanup of the journal and of the snapshots beside it. One tick is bounded by a budget of its
	// own, so the interval decides how much a portal gets through in a day and never how old a row is
	// when it goes: the age is the retention the portal publishes.
	->add('Bitrix\\Disk\\Infrastructure\\Agent\\Sync\\JournalCleanupAgent::run();', 3600, false)
	// The reconciliation of what the journal never heard about. The interval is bounded from above by
	// the two days an orphan snapshot of the codes of a root is kept: a tick reaching a finished
	// recalculation later than that would publish its record without the codes it was meant to reach.
	->add('Bitrix\\Disk\\Infrastructure\\Agent\\Sync\\CompletenessAgent::run();', 3600, false)
	->add([\Bitrix\Disk\Infrastructure\Agent\InterruptedOnlyOfficeSessionAgent::class, 'run'], 300, false)
;

if (IsModuleInstalled('bitrix24'))
{
	$agent->add('Bitrix\Disk\Infrastructure\Agent\SwitchOnlyOfficeServersTypeAgent::run();', 300, false);
}
