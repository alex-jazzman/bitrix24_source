/**
 * @module mail/message-grid/navigation/src/header
 */
jn.define('mail/message-grid/navigation/src/header', (require, exports, module) => {
	const { selectCurrentFolder, selectCurrentFolderCounter, selectCurrentVirtualFolderKey } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectSelectedCount } = require('mail/statemanager/redux/slices/messages/selector');
	const { stringToColor } = require('mail/message/elements/avatar');
	const { MobileFeature } = require('im/messenger/lib/feature');
	const {
		getNameByKey: getVirtualFolderNameByKey,
		getCounterByKey: getVirtualFolderCounterByKey,
	} = require('mail/folder/virtual');
	const store = require('statemanager/redux/store');
	const { Loc } = require('loc');

	class MessageGridHeader
	{
		constructor({
			parentWidget,
			panel = null,
			actionMenu = null,
			multiSelectMenu = null,
			tabs = null,
			getRightButtons = () => [],
			getLeftButtons = () => [],
			setFloatingButtonVisibility = () => {},
		} = {})
		{
			this.parentWidget = parentWidget;
			this.panel = panel;
			this.actionMenu = actionMenu;
			this.multiSelectMenu = multiSelectMenu;
			this.tabs = tabs;
			this.getRightButtons = getRightButtons;
			this.getLeftButtons = getLeftButtons;
			this.setFloatingButtonVisibility = setFloatingButtonVisibility;
		}

		setInitialTitle()
		{
			this.parentWidget.setTitle({
				text: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TITLE'),
				type: 'section',
			});
		}

		applyMode(isRegularMode)
		{
			let rightButtons = [];

			if (MobileFeature.isNativeBottomPanelApiSupported())
			{
				if (isRegularMode)
				{
					this.setFloatingButtonVisibility(true);
					this.panel?.hide();
				}
				else
				{
					this.setFloatingButtonVisibility(false);
					this.panel?.show();
				}

				rightButtons = isRegularMode
					? this.getRightButtons()
					: [this.actionMenu?.getCancelButton()].filter(Boolean)
				;
			}
			else
			{
				const leftButtons = isRegularMode
					? this.getLeftButtons()
					: [this.multiSelectMenu?.getChanelButton()].filter(Boolean)
				;
				rightButtons = isRegularMode
					? this.getRightButtons()
					: [this.multiSelectMenu?.getMenuButton()].filter(Boolean)
				;

				this.parentWidget.setLeftButtons(leftButtons);
			}

			this.updateTitle(isRegularMode);
			this.parentWidget.setRightButtons(rightButtons);
		}

		updateTitle(isRegularMode)
		{
			const currentState = store.getState();
			const virtualFolderKey = selectCurrentVirtualFolderKey(currentState);
			const unreadCounter = virtualFolderKey !== null
				? getVirtualFolderCounterByKey(virtualFolderKey, currentState)
				: selectCurrentFolderCounter(currentState)
			;
			this.tabs?.updateUnreadCounter(unreadCounter);
			this.parentWidget.setTitle(this.#getTitleParams(currentState, isRegularMode));
		}

		#getTitleParams(currentState, isRegularMode)
		{
			const currentFolder = selectCurrentFolder(currentState);
			const currentMailbox = selectCurrentMailbox(currentState);
			const virtualFolderKey = selectCurrentVirtualFolderKey(currentState);
			const titleText = virtualFolderKey !== null
				? getVirtualFolderNameByKey(virtualFolderKey)
				: currentFolder?.name ?? Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TITLE')
			;
			const avatar = this.#getAvatar(currentMailbox);

			if (MobileFeature.isNativeBottomPanelApiSupported())
			{
				return {
					text: titleText,
					type: 'section',
					avatar,
				};
			}

			return {
				text: isRegularMode ? titleText : this.#getMultiSelectModeTitle(currentState),
				avatar: isRegularMode ? avatar : null,
				type: isRegularMode ? 'section' : 'wizard',
			};
		}

		#getAvatar(currentMailbox)
		{
			if (!currentMailbox)
			{
				return null;
			}

			const backgroundColor = stringToColor(currentMailbox.email);

			return {
				title: currentMailbox.userName,
				backgroundColor,
				placeholder: {
					backgroundColor,
				},
				hideOutline: true,
			};
		}

		#getMultiSelectModeTitle(currentState)
		{
			const selectedCount = selectSelectedCount(currentState);

			return Loc.getMessage(
				this.#getPluralizationKey(selectedCount),
				{ '#COUNT#': selectedCount },
			);
		}

		#getPluralizationKey(count)
		{
			const lastDigit = count % 10;
			const lastTwoDigits = count % 100;

			if (lastTwoDigits >= 11 && lastTwoDigits <= 14)
			{
				return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_1';
			}

			if (lastDigit === 1)
			{
				return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_2';
			}

			if (lastDigit >= 2 && lastDigit <= 4)
			{
				return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_5';
			}

			return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_1';
		}
	}

	module.exports = { MessageGridHeader };
});
