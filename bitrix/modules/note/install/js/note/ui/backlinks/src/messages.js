import { Loc } from 'main.core';

type BacklinksMessages = {
	loading: string,
	backlinksChipTitle: string,
	backlinksTitle: string,
	backlinksEmpty: string,
	backlinksMoreHint: string,
	backlinksLoadMore: string,
	backlinksLoadError: string,
	backlinksRetry: string,
};

// Owned by this extension: the widget builds this itself (see its `messages` prop default), so a
// host that only places the chip in a line does not carry these keys.
export function createBacklinksMessages(): BacklinksMessages
{
	return {
		loading: Loc.getMessage('NOTE_UI_BACKLINKS_LOADING'),
		backlinksChipTitle: Loc.getMessage('NOTE_UI_BACKLINKS_CHIP_TITLE'),
		backlinksTitle: Loc.getMessage('NOTE_UI_BACKLINKS_TITLE'),
		backlinksEmpty: Loc.getMessage('NOTE_UI_BACKLINKS_EMPTY'),
		backlinksMoreHint: Loc.getMessage('NOTE_UI_BACKLINKS_MORE_HINT'),
		backlinksLoadMore: Loc.getMessage('NOTE_UI_BACKLINKS_LOAD_MORE'),
		backlinksLoadError: Loc.getMessage('NOTE_UI_BACKLINKS_LOAD_ERROR'),
		backlinksRetry: Loc.getMessage('NOTE_UI_BACKLINKS_RETRY'),
	};
}
