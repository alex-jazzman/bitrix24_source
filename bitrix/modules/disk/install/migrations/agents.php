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
;

if (IsModuleInstalled('bitrix24'))
{
	$agent->add('Bitrix\Disk\Infrastructure\Agent\SwitchOnlyOfficeServersTypeAgent::run();', 300, false);
}
