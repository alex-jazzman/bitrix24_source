import { Type, Reflection, Event, Loc, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button, AirButtonStyle } from 'ui.buttons';

import { Avatar } from 'mail.avatar';
import { getMigrationState } from 'mail.migration-state';
// The screen loads `mail.messagegrid` only where it builds the old grid, and the name below is read
// only there as well. It is imported rather than asked for on demand because the screen calls into the
// singleton in the `BX.ready` handler right after the one that creates it, and an extension asked for
// at that point would arrive after the call.
import { MessageGrid } from 'mail.messagegrid';

import { Counters } from './src/js/counters.es6';
import { LeftMenu } from './src/js/leftmenu.es6';
import { List } from './src/js/list.es6';
import { ProgressBar } from './src/js/progressbar.es6';

const namespaceMailHome = Reflection.namespace('BX.Mail.Home');

/**
 * The list of messages is drawn by `mail.client.message-grid`, and that extension answers for the grid
 * of the screen by itself: it publishes the facade under `BX.Mail.Home.Grid` and keeps the rows in a
 * state of its own. Everything below that reaches into the grid of the platform belongs to the other
 * path - the delegated listeners of the old singleton sit on the very wrapper the application mounts
 * inside, and beside it every click on a star would be answered twice.
 */
const legacyGrid = () => Loc.getMessage('MAIL_MESSAGE_GRID_VUE_ENABLED') !== 'Y';

EventEmitter.subscribe('SidePanel.Slider:onMessage', (event) => {
	const [messageEvent] = event.getCompatData();
	if (messageEvent.getEventId() === 'mail-mailbox-config-success')
	{
		BXMailMailbox.sync(namespaceMailHome.ProgressBar, Loc.getMessage('MAIL_MESSAGE_FILTER_ID'), false, true);
	}
	if (messageEvent.getEventId() === 'mail-mailbox-config-dirs-success')
	{
		window.location.reload();
	}
});

let sliderPage;
let progressBar;
let errorBox;
let syncButtonWrapper;
let sortButtonWrapper;
let currentFolderSortMode = 'default';

const MIGRATION_BLOCKED_ERROR_CODE = 'MAILBOX_MIGRATION_ACTION_BLOCKED';

function hasErrorCode(error, code)
{
	const errors = Type.isArray(error?.errors) ? error.errors : [error];

	return errors.some((item) => item?.code === code);
}

export function changeFolderSortMode({
	mailboxId,
	mode,
	getCurrentMode,
	applyMode,
	closeMenu,
	request,
	notify,
})
{
	const previousMode = getCurrentMode();
	closeMenu();

	if (mailboxId > 0 && getMigrationState(mailboxId).isActive())
	{
		notify(Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE'));

		return Promise.resolve(false);
	}

	applyMode(mode);

	return request('mail.mailboxsettings.saveFolderSortMode', {
		data: { mailboxId, mode },
	}).then(() => true).catch((error) => {
		notify(Loc.getMessage(
			hasErrorCode(error, MIGRATION_BLOCKED_ERROR_CODE)
				? 'MAIL_MIGRATION_ACTION_UNAVAILABLE'
				: 'MAIL_FOLDER_SORT_MODE_SAVE_ERROR',
		));

		// A later switch to another mode superseded this request: keep the
		// newer choice instead of rolling back to the stale mode.
		if (getCurrentMode() === mode)
		{
			applyMode(previousMode);
		}

		return false;
	});
}

let selectedIdsForRecovery = {};

/** Puts back the rows the reader had selected before the platform grid reloaded its table. */
function subscribeToSelectionRecovery()
{
	EventEmitter.subscribe('BX.Main.Grid:onBeforeReload', (event) => {
		const [grid] = event.getCompatData();
		if (grid !== {} && grid !== undefined && Loc.getMessage('MAIL_MESSAGE_GRID_ID') === grid.getId())
		{
			selectedIdsForRecovery = grid.getRows().getSelectedIds();
		}
	});

	EventEmitter.subscribe('Grid::updated', (event) => {
		const [grid] = event.getCompatData();

		if (grid !== {} && grid !== undefined && Loc.getMessage('MAIL_MESSAGE_GRID_ID') === grid.getId())
		{
			let rowsWereSelected = false;
			namespaceMailHome.Grid.getRows().map((row) => {
				if (Type.isFunction(selectedIdsForRecovery.indexOf) && selectedIdsForRecovery.includes(row.getId()) && row.isShown())
				{
					row.select();
					rowsWereSelected = true;
				}
			});
			selectedIdsForRecovery = {};

			if (rowsWereSelected)
			{
				setTimeout(
					() => {
						if (grid.getRows().getSelected().length > 0)
						{
							EventEmitter.emit(window, 'Grid::thereSelectedRows');
						}
					},
					0,
				);
			}
		}
	});
}

Event.ready(() => {
	currentFolderSortMode = Loc.getMessage('MAIL_FOLDER_SORT_MODE') || 'default';

	syncButtonWrapper = document.querySelector('[data-role="mail-msg-sync-button-wrapper"]');

	const syncButton = new Button({
		className: 'mail-msg-sync-button',
		useAirDesign: true,
		style: AirButtonStyle.OUTLINE,
		icon: 'o-refresh',
		props: {
			title: Loc.getMessage('MAIL_MESSAGE_SYNC_BTN_HINT'),
		},
		onclick() {
			if (Loc.getMessage('MAIL_IS_ALL_MAIL_MODE') === 'Y')
			{
				namespaceMailHome.ProgressBar.show();
				BX.ajax.runAction('mail.mailboxconnecting.syncAllUserMailboxes', {})
					.finally(() => {
						namespaceMailHome.ProgressBar.hide();
						namespaceMailHome.Grid.reloadTable();
					});
				return;
			}
			BXMailMailbox.sync(namespaceMailHome.ProgressBar, Loc.getMessage('MAIL_MESSAGE_FILTER_ID'), false, true);
		},
	});

	syncButtonWrapper?.replaceChildren(syncButton.getContainer());

	sortButtonWrapper = document.querySelector('[data-role="mail-folder-sort-button-wrapper"]');

	// Reflect the active sort mode on the button (a drag switches it to 'manual').
	EventEmitter.subscribe('BX.Mail.FolderSort:onChange', (event) => {
		const mode = event.data?.mode;
		if (!mode)
		{
			return;
		}

		currentFolderSortMode = mode;
		if (sortButtonWrapper)
		{
			sortButtonWrapper.dataset.sortMode = mode;
		}
	});

	const sortButton = new Button({
		className: 'mail-folder-sort-button',
		useAirDesign: true,
		style: AirButtonStyle.OUTLINE,
		icon: 'o-folder',
		props: {
			title: Loc.getMessage('MAIL_FOLDER_SORT_BTN_HINT'),
		},
		onclick() {
			const sortMenuId = 'mail-folder-sort-menu';

			const sortModes = [
				{ id: 'default', text: Loc.getMessage('MAIL_FOLDER_SORT_DEFAULT') },
				{ id: 'alpha_asc', text: Loc.getMessage('MAIL_FOLDER_SORT_ALPHA_ASC') },
				{ id: 'alpha_desc', text: Loc.getMessage('MAIL_FOLDER_SORT_ALPHA_DESC') },
			];

			if (Loc.getMessage('MAIL_FOLDER_MANUAL_SORTING_AVAILABLE') === 'Y')
			{
				sortModes.push({ id: 'manual', text: Loc.getMessage('MAIL_FOLDER_SORT_MANUAL') });
			}

			const menuItems = [
				{
					delimiter: true,
					html: `<span>${Loc.getMessage('MAIL_FOLDER_SORT_BTN_HINT')}</span>`,
				},
				...sortModes.map((mode) => ({
					text: mode.text,
					dataset: { testId: `mail_sort-menu__item_${mode.id}` },
					className: currentFolderSortMode === mode.id ? 'menu-popup-item-accept' : '',
					onclick() {
						const mailboxId = parseInt(Loc.getMessage('MAIL_MAILBOX_ID'), 10);
						void changeFolderSortMode({
							mailboxId,
							mode: mode.id,
							getCurrentMode: () => currentFolderSortMode,
							applyMode: (nextMode) => {
								currentFolderSortMode = nextMode;
								if (sortButtonWrapper)
								{
									sortButtonWrapper.dataset.sortMode = nextMode;
								}
								EventEmitter.emit('BX.Mail.FolderSort:onChange', { mode: nextMode });
							},
							closeMenu: () => BX.Main.MenuManager.destroy(sortMenuId),
							request: (...args) => BX.ajax.runAction(...args),
							notify: (content) => BX.UI?.Notification?.Center?.notify({ content }),
						});
					},
				})),
			];

			const popup = BX.Main.MenuManager.create(
				sortMenuId,
				sortButton.getContainer(),
				menuItems,
				{
					events: {
						onPopupFirstShow: () => {
							popup.getMenuItems().forEach((menuItem) => {
								BX.Event.bind(menuItem.getContainer(), 'click', () => {
									popup.close();
								});
							});
						},
					},
				},
			);

			const menuContainer = popup.getMenuContainer?.();
			if (menuContainer)
			{
				Dom.attr(menuContainer, 'data-test-id', 'mail_sync-panel__sort-menu');
			}
			popup.popupWindow.isShown() ? popup.close() : popup.show();
		},
	});

	if (sortButtonWrapper)
	{
		sortButtonWrapper.replaceChildren(sortButton.getContainer());

		if (currentFolderSortMode !== 'default')
		{
			sortButtonWrapper.dataset.sortMode = currentFolderSortMode;
			EventEmitter.emit('BX.Mail.FolderSort:onChange', { mode: currentFolderSortMode });
		}

		if (Loc.getMessage('MAIL_NEED_SHOW_FOLDER_SORT_GUIDE') === 'Y')
		{
			(new BX.Mail.MailGuide({
				id: 'mail-folder-sort-guide',
				title: Loc.getMessage('MAIL_FOLDER_SORT_GUIDE_TITLE'),
				description: Loc.getMessage('MAIL_FOLDER_SORT_GUIDE_DESCRIPTION'),
				bindElement: sortButton.getContainer(),
				addHighlighter: true,
				showImage: false,
				userOptionName: 'folder_sort_guide_shown',
			})).show();
		}
	}

	if (legacyGrid())
	{
		subscribeToSelectionRecovery();
	}

	Avatar.replaceTagsWithAvatars({
		className: 'mail-ui-avatar',
	});

	sliderPage = document.getElementsByClassName('ui-slider-page')[0];
	progressBar = document.querySelector('[data-role="mail-progress-bar"]');
	if (sliderPage && progressBar)
	{
		sliderPage.insertBefore(progressBar, sliderPage.firstChild);
		errorBox = document.querySelector('[data-role="error-box"]');

		namespaceMailHome.ProgressBar = new ProgressBar(progressBar);

		namespaceMailHome.ProgressBar.setSyncButton(syncButton);
		namespaceMailHome.ProgressBar.setErrorBoxNode(document.querySelector('[data-role="error-box"]'));
		namespaceMailHome.ProgressBar.setErrorTextNode(document.querySelector('[data-role="error-box-text"]'));
		namespaceMailHome.ProgressBar.setErrorHintNode(document.querySelector('[data-role="error-box-hint"]'));
		namespaceMailHome.ProgressBar.setErrorTitleNode(document.querySelector('[data-role="error-box-title"]'));
	}
});

BX.ready(() => {
	namespaceMailHome.Counters = new Counters('dirs', Loc.getMessage('DEFAULT_DIR'));
	namespaceMailHome.mailboxCounters = new Counters('mailboxCounters');
	if (legacyGrid())
	{
		namespaceMailHome.Grid = new MessageGrid(Loc.getMessage('MAILBOX_IS_SYNC_AVAILABILITY'));
	}
});
namespaceMailHome.LeftMenu = LeftMenu;

const namespaceClientMessage = Reflection.namespace('BX.Mail.Client.Message');
namespaceClientMessage.List = List;

const LimitHelpers = {
	showLimitSlider(code)
	{
		const activeFeaturePromoter = BX.UI.FeaturePromotersRegistry.getPromoter({
			code,
		});
		activeFeaturePromoter.show();
	},
};

namespaceClientMessage.LimitHelpers = LimitHelpers;
