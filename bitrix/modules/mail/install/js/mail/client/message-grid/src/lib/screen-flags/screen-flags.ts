import { Loc } from 'main.core';

/**
 * Flags the screen broadcasts for everything on it at once (`template.php`, the `BX.message` block).
 * They belong to the page rather than to a row, so no record of a row carries them.
 */
export function isListImprovementsEnabled(): boolean
{
	return Loc.getMessage('MAIL_LIST_IMPROVEMENTS_ENABLED') === 'Y';
}

export function isArchiveDownloadAvailable(): boolean
{
	return Loc.getMessage('MAIL_LIST_ARCHIVE_DOWNLOAD_AVAILABLE') === 'Y';
}

/** Not a `Y` flag as the neighbours are: the screen renders a bool of PHP, so it arrives as `1`. */
export function isMailboxAvailable(): boolean
{
	return Loc.getMessage('MAILBOX_IS_SYNC_AVAILABILITY') === '1';
}

/**
 * The screen was opened on a first synchronization of the mailbox. Only there does the list stand behind
 * a loader and only there does it answer an empty result with a stub of its own.
 */
export function isSyncStubOffered(): boolean
{
	return Loc.getMessage('MAIL_MESSAGE_GRID_SYNC_STUB') === 'Y';
}
