import { Type, Reflection, Event, Loc, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button, AirButtonStyle } from 'ui.buttons';

import { Avatar } from 'mail.avatar';
import { MessageGrid } from 'mail.messagegrid';

import { Counters } from './src/js/counters.es6';
import { LeftMenu } from './src/js/leftmenu.es6';
import { List } from './src/js/list.es6';
import { ProgressBar } from './src/js/progressbar.es6';

const namespaceMailHome = Reflection.namespace('BX.Mail.Home');

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

let selectedIdsForRecovery = {};

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

	syncButtonWrapper.replaceChildren(syncButton.getContainer());

	sortButtonWrapper = document.querySelector('[data-role="mail-folder-sort-button-wrapper"]');

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
						currentFolderSortMode = mode.id;
						sortButtonWrapper.dataset.sortMode = mode.id;
						BX.Main.MenuManager.destroy(sortMenuId);
						EventEmitter.emit('BX.Mail.FolderSort:onChange', { mode: mode.id });
						BX.ajax.runAction('mail.mailboxsettings.saveFolderSortMode', {
							data: {
								mailboxId: parseInt(Loc.getMessage('MAIL_MAILBOX_ID'), 10),
								mode: mode.id,
							},
						}).catch((response) => {
							console.error('Failed to save folder sort mode', response);
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
						EventEmitter.emit(window, 'Grid::thereSelectedRows');
					},
					0,
				);
			}
		}
	});

	Avatar.replaceTagsWithAvatars({
		className: 'mail-ui-avatar',
	});

	sliderPage = document.getElementsByClassName('ui-slider-page')[0];
	progressBar = document.querySelector('[data-role="mail-progress-bar"]');
	sliderPage.insertBefore(progressBar, sliderPage.firstChild);
	errorBox = document.querySelector('[data-role="error-box"]');

	namespaceMailHome.ProgressBar = new ProgressBar(progressBar);

	namespaceMailHome.ProgressBar.setSyncButton(syncButton);
	namespaceMailHome.ProgressBar.setErrorBoxNode(document.querySelector('[data-role="error-box"]'));
	namespaceMailHome.ProgressBar.setErrorTextNode(document.querySelector('[data-role="error-box-text"]'));
	namespaceMailHome.ProgressBar.setErrorHintNode(document.querySelector('[data-role="error-box-hint"]'));
	namespaceMailHome.ProgressBar.setErrorTitleNode(document.querySelector('[data-role="error-box-title"]'));
});

BX.ready(() => {
	namespaceMailHome.Counters = new Counters('dirs', Loc.getMessage('DEFAULT_DIR'));
	namespaceMailHome.mailboxCounters = new Counters('mailboxCounters');
	namespaceMailHome.Grid = new MessageGrid(Loc.getMessage('MAILBOX_IS_SYNC_AVAILABILITY'));
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
