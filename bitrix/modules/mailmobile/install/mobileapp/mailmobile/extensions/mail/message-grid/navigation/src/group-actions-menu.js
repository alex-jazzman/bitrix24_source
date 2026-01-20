/**
 * @module mail/message-grid/navigation/src/group-actions-menu
 */

jn.define('mail/message-grid/navigation/src/group-actions-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { qrauth } = require('qrauth/utils');
	const { Indent, Color } = require('tokens');
	const { Icon, IconView } = require('ui-system/blocks/icon');

	const { DefaultFolderType } = require('mail/enum/default-folder-type');

	const {
		selectSelectedIds,
		selectSelectedCount,
		selectSelectedUidIds,
		selectIsMultiSelectMode,
	} = require('mail/statemanager/redux/slices/messages/selector');
	const {
		selectFoldersByType,
		selectById: selectFolderById,
	} = require('mail/statemanager/redux/slices/folders/selector');
	const { observeListChange } = require('mail/statemanager/redux/slices/messages/observers/stateful-list');
	const { moveToFolder, changeReadStatus } = require('mail/statemanager/redux/slices/messages/thunk');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { setMultiSelectMode } = require('mail/statemanager/redux/slices/messages');
	const { Selector: FolderSelector } = require('mail/folder/selector');

	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	/**
	 * @class MessageGridGroupActionsMenu
	 */
	class MessageGridGroupActionsMenu extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.parentWidget = props.parentWidget;
			this.panel = props.panel;
			this.moverLayout = null;
			this.state = {
				selectedMessagesCounter: selectSelectedCount(store.getState()),
				isMoverOpen: false,
			};
		}

		componentDidMount()
		{
			this.unsubscribeMailsObserver = observeListChange(
				store,
				this.#onSelectedMailsChange,
			);
		}

		componentWillUnmount()
		{
			if (this.unsubscribeMailsObserver)
			{
				this.unsubscribeMailsObserver();
			}
		}

		render()
		{
			return View(
				{
					style: {
						height: 145,
					},
				},
				this.renderCounter(),
				this.renderIcons(),
			);
		}

		renderCounter()
		{
			return View(
				{
					style: {
						height: 45,
						paddingBottom: Indent.XL.toNumber(),
						paddingLeft: Indent.XL3.toNumber(),
						paddingRight: Indent.XL3.toNumber(),
						paddingTop: Indent.XL.toNumber(),
					},
				},
				Text({
					style: {
						fontSize: 16,
						color: Color.base3.toHex(),
						fontWeight: '400',
					},
					text: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_GROUP_ACTIONS_MENU_COUNTER', {
						'#COUNT#': this.state.selectedMessagesCounter,
					}),
				}),
			);
		}

		renderIcons()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						height: 100,
						alignItems: 'center',
						paddingLeft: Indent.XL3.toNumber(),
						paddingRight: Indent.XL3.toNumber(),
						paddingBottom: Application.getPlatform() === 'ios' ? 40 : 50,
						justifyContent: 'space-between',
					},
				},
				this.renderIcon({
					icon: Icon.MAIL_COUNTER,
					messageCode: 'MAILMOBILE_ACTIONS_READ',
					onClickCallback: this.changeReadObjectStatus.bind(this, 1),
				}),
				this.renderIcon({
					icon: Icon.MOVE_TO,
					messageCode: 'MAILMOBILE_ACTIONS_IN_FOLDER',
					onClickCallback: this.openMover.bind(this),
				}),
				this.renderIcon({
					icon: Icon.ALERT_ACCENT,
					messageCode: 'MAILMOBILE_ACTIONS_IN_SPAM',
					onClickCallback: this.changeObjectFolder.bind(this, {
						folderSignature: DefaultFolderType.SPAM.value,
					}),
				}),
				this.renderIcon({
					icon: Icon.TRASHCAN,
					messageCode: 'MAILMOBILE_ACTIONS_REMOVE',
					color: Color.accentMainAlert,
					onClickCallback: this.changeObjectFolder.bind(this, {
						folderSignature: DefaultFolderType.TRASH.value,
					}),
				}),
			);
		}

		renderIcon(params = {})
		{
			const { icon, color = Color.base1, messageCode, onClickCallback } = params;

			return View(
				{
					style: {
						alignContent: 'center',
						alignItems: 'center',
						justifyContent: 'center',
						width: 70,
					},
					onClick: onClickCallback,
				},
				IconView({
					icon,
					color,
					size: 40,
				}),
				Text({
					style: {
						color: color.toHex(),
						fontSize: 12,
						fontWeight: '500',
					},
					text: Loc.getMessage(messageCode),
				}),
			);
		}

		getCancelButton()
		{
			return {
				name: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_CHANEL_BUTTON'),
				id: 'next',
				type: 'text',
				testId: 'multiselect-mode-chanel-button',
				color: Color.accentMainPrimaryalt.toHex(),
				callback: this.#onToggleMultiSelectMode,
			};
		}

		changeReadObjectStatus = (isRead) => {
			const objectIds = selectSelectedIds(store.getState());
			const objectUidIds = selectSelectedUidIds(store.getState());

			if (objectIds.length === 0)
			{
				return;
			}

			dispatch(changeReadStatus({ objectIds, objectUidIds, isRead }));
			this.#onToggleMultiSelectMode();
		};

		openMover()
		{
			if (this.state.isMoverOpen)
			{
				this.moverLayout.close();
				this.state.isMoverOpen = false;
			}
			else
			{
				this.panel.hide();
				this.parentWidget.openWidget(
					'layout',
					{
						...FolderSelector.FOLDER_LAYOUT_PROPERTIES_MOVE,
						onReady: (layoutWidget) => {
							this.moverLayout = layoutWidget;
							layoutWidget.showComponent(new FolderSelector({
								parentWidget: this.parentWidget,
								layoutWidget,
								mode: FolderSelector.MOVE_MODE,
								onSelect: this.changeObjectFolder.bind(this),
								customHiddenCallback: this.#onMoverHidden,
							}));
						},
					},
					this.parentWidget,
				);
				this.state.isMoverOpen = true;
			}
		}

		changeObjectFolder = (props) => {
			const {
				folderSignature = null,
				folder: folderToMove = null,
			} = props;

			if (folderToMove === null && DefaultFolderType.isDefined(folderSignature))
			{
				const defaultFolderToMove = selectFoldersByType(store.getState(), folderSignature, true);
				if (defaultFolderToMove.length === 0)
				{
					this.#onToggleMultiSelectMode();
					const mailboxId = selectCurrentMailboxId(store.getState());
					const title = (DefaultFolderType.TRASH.getValue() === folderSignature)
						? Loc.getMessage('MAILMOBILE_MESSAGE_GRID_GROUP_ACTIONS_FOLDERS_TRASH_BANNER_TITLE')
						: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_GROUP_ACTIONS_FOLDERS_SPAM_BANNER_TITLE')
					;
					qrauth.open({
						title,
						hintText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_GROUP_ACTIONS_FOLDERS_SETTINGS_BANNER_DESCRIPTION'),
						redirectUrl: `/mail/config/dirs?mailboxId=${mailboxId}`,
						showHint: true,
					});

					return;
				}
			}

			const objectIds = selectSelectedIds(store.getState());
			const objectUidIds = selectSelectedUidIds(store.getState());

			let resolvedFolderToMove = folderToMove;

			if (resolvedFolderToMove === null)
			{
				resolvedFolderToMove = Object.values(DefaultFolderType).some((type) => type.value === folderSignature)
					? selectFoldersByType(store.getState(), folderSignature, true)?.find(() => true)
					: selectFolderById(store.getState(), folderSignature, true)
				;
			}

			if (!resolvedFolderToMove || objectIds.length === 0)
			{
				return;
			}

			dispatch(moveToFolder({ objectIds, objectUidIds, folderPath: resolvedFolderToMove.path }));
			this.#onToggleMultiSelectMode();
		};

		#onToggleMultiSelectMode = () => {
			const currentState = store.getState();
			const isMultiSelectMode = selectIsMultiSelectMode(currentState);

			dispatch(setMultiSelectMode({ isMultiSelectMode: !isMultiSelectMode }));
		};

		#onSelectedMailsChange = ({ multiSelectMode, selectedIds }) => {
			if (
				(selectedIds.changed && !multiSelectMode.changed)
				|| multiSelectMode.changed
			)
			{
				this.setState({ selectedMessagesCounter: selectSelectedCount(store.getState()) });
			}
		};

		#onMoverHidden = () => {
			this.panel.show();
		};
	}

	module.exports = { MessageGridGroupActionsMenu };
});
