/**
 * @module mail/folder/selector/src/sections
 */
jn.define('mail/folder/selector/src/sections', (require, exports, module) => {
	const { FAVORITES } = require('mail/folder/virtual/src/keys');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');

	// The decisions of the folder selector that need neither the store nor the layout: which blocks are
	// drawn, in what order and which of them the user has collapsed. They live apart from the component
	// so that they can be exercised without the screen behind them.
	const SWITCH_MODE = 0;
	const COLLAPSED_SECTIONS_STORAGE_ID = 'mail/folder/selector';
	const COLLAPSED_SECTIONS_KEY = 'collapsedSections';
	const SECTION_FOLDERS = 'folders';
	const SECTION_COLLECTIONS = 'collections';
	const SECTION_LABELS = 'labels';

	let collapsedSectionsStorage = null;

	function isDraftsButtonVisible({ available, mode, hasCustomFoldersSource })
	{
		return available && mode === SWITCH_MODE && !hasCustomFoldersSource;
	}

	function isVirtualFolderVisible(folder, mode)
	{
		return mode === SWITCH_MODE || folder.type !== FAVORITES;
	}

	function isSystemFolderVisible(folder, mode, isMessageDeleteAvailable)
	{
		return mode === SWITCH_MODE
			|| isMessageDeleteAvailable
			|| !DefaultFolderType.isTrashFolder(folder.type)
		;
	}

	function applyFavoritesAvailability({
		favoritesFolder,
		currentVirtualFolderKey,
		isDisposed,
		onAvailable,
		onUnavailable,
	})
	{
		if (isDisposed)
		{
			return false;
		}
		if (favoritesFolder)
		{
			onAvailable(favoritesFolder);

			return true;
		}
		onUnavailable(currentVirtualFolderKey === FAVORITES);

		return false;
	}

	function buildDraftsNavigationItem({ title, selected = false })
	{
		return {
			id: 'mail-drafts-navigation',
			testId: 'mail-folder-selector-drafts-button',
			type: 'drafts',
			name: title,
			isDraftsNavigation: true,
			isSelected: selected,
			unreadCount: 0,
		};
	}

	/**
	 * Rows of the labels section, or an empty list when the section must not be drawn: another mode,
	 * a custom folders source, a switched-off domain or no labels at all. Every row keeps its labelId
	 * and gets a testId of its own; no create/rename/delete action lives here.
	 */
	function buildLabelSectionItems({ mode, hasCustomFoldersSource, labelsAvailable, labelFolders })
	{
		if (
			mode !== SWITCH_MODE
			|| hasCustomFoldersSource
			|| !labelsAvailable
			|| labelFolders.length === 0
		)
		{
			return [];
		}

		return labelFolders.map((folder) => {
			folder.testId = `mail-folder-selector-label-${folder.labelId}`;

			return folder;
		});
	}

	function buildFolderSections({
		virtualFolders,
		systemFolders,
		customFolders,
		labelsSection,
		favoritesNavigation,
		draftsNavigation,
	})
	{
		// Folders first, then the collections block (all mail, favorites, drafts), then labels.
		// Labels go last because their list grows up to the portal limit: with them in the middle
		// the navigation items below are pushed off the screen. The web menu orders them the same way.
		return [
			systemFolders,
			customFolders,
			virtualFolders,
			favoritesNavigation,
			draftsNavigation,
			labelsSection,
		].filter((section) => section !== null && section !== undefined);
	}

	function getCollapsedSectionsStorage()
	{
		if (collapsedSectionsStorage === null)
		{
			collapsedSectionsStorage = Application.storageById(COLLAPSED_SECTIONS_STORAGE_ID);
		}

		return collapsedSectionsStorage;
	}

	function isSectionCollapsed(collapsedSections, sectionId)
	{
		return Boolean(collapsedSections) && collapsedSections[sectionId] === true;
	}

	function toggleSectionCollapsed(collapsedSections, sectionId)
	{
		const next = { ...collapsedSections };

		if (next[sectionId] === true)
		{
			delete next[sectionId];
		}
		else
		{
			next[sectionId] = true;
		}

		return next;
	}

	function readCollapsedSections(storage = getCollapsedSectionsStorage())
	{
		const stored = storage.getObject(COLLAPSED_SECTIONS_KEY, {});

		// A value written by an older version, or a broken one, must not hide the folders for good.
		return stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
	}

	function writeCollapsedSections(collapsedSections, storage = getCollapsedSectionsStorage())
	{
		storage.setObject(COLLAPSED_SECTIONS_KEY, collapsedSections);
	}

	module.exports = {
		SWITCH_MODE,
		SECTION_FOLDERS,
		SECTION_COLLECTIONS,
		SECTION_LABELS,
		applyFavoritesAvailability,
		buildDraftsNavigationItem,
		buildFolderSections,
		buildLabelSectionItems,
		isDraftsButtonVisible,
		isSectionCollapsed,
		isSystemFolderVisible,
		isVirtualFolderVisible,
		readCollapsedSections,
		toggleSectionCollapsed,
		writeCollapsedSections,
	};
});
