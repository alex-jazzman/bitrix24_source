/**
 * @module im/messenger/controller/folder/lib/ui/folder-form/view
 */
jn.define('im/messenger/controller/folder/lib/ui/folder-form/view', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('im/messenger/loc');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { FolderLoadableButton } = require('im/messenger/controller/folder/lib/ui/loadable-button');
	const { FolderChatItem } = require('im/messenger/controller/folder/lib/ui/folder-form/chat-item');
	const { MessengerIcon, IconType } = require('im/messenger/assets/icon');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const MAX_CHATS_PER_FOLDER = 50;

	/**
	 * @class FolderFormView
	 *
	 * @param {object} props
	 * @param {string} props.submitText - footer button text ('Create' / 'Save')
	 * @param {string} [props.headerIconSvg] - SVG string for header graphic; if not set, uses PNG via headerIconType
	 * @param {string} [props.headerIconType] - IconType key for MessengerIcon PNG (e.g. 'createFolder')
	 * @param {boolean} [props.showRemoveChats=true] - show remove buttons on chat items
	 * @param {string} [props.initialTitle=''] - initial folder title
	 * @param {string[]} [props.initialChatIds=[]] - initial dialogIds
	 * @param {number} [props.maxTitleLength=30] - title length limit
	 * @param {Function} props.onSubmit - ({ title, chatIds }) => void
	 * @param {Function} props.onAddChats - (currentChatIds, callback) => void
	 * @param {object} props.layoutWidget
	 * @param {Function} [props.submitButtonRef] - (FolderLoadableButton) => void — called with the submit button ref
	 */
	class FolderFormView extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			// `savedTitle` / `savedChatIds` — baseline against which `isSubmitEnabled`
			// computes the diff. Starts from initial props, moves forward via
			// `markSaved()` after a successful REST. Kept in state (not as instance
			// fields) so updating the baseline triggers a re-render — needed for the
			// keyboardButton inside BoxFooter, whose `disabled` prop is recomputed
			// only on parent render.
			this.state = {
				title: props.initialTitle || '',
				chatIds: [...(props.initialChatIds || [])],
				savedTitle: (props.initialTitle || '').trim(),
				savedChatIds: [...(props.initialChatIds || [])],
			};

			this.titleInputRef = null;
			this.submitButton = null;
		}

		componentDidMount()
		{
			super.componentDidMount();
			this.props.formViewRef?.(this);
		}

		// JaNative wraps this form in BoxFooter → DialogFooter, and parent
		// componentDidUpdate races against child remount inside that pipeline.
		// Use a setState callback to push the enabled state once render is complete
		// and the new button ref is bound (mirrors sticker editor's pattern).
		#syncSubmitEnabled = () => {
			this.submitButton?.setEnabled(this.isSubmitEnabled);
		};

		/**
		 * Move the saved baseline to the current state — call after a successful
		 * REST round-trip. Triggers a re-render so the submit button reflects
		 * the new "no pending changes" state via `isSubmitEnabled`.
		 */
		markSaved()
		{
			this.setState({
				savedTitle: this.state.title.trim(),
				savedChatIds: [...this.state.chatIds],
			}, this.#syncSubmitEnabled);
		}

		get isSubmitEnabled()
		{
			const title = this.state.title.trim();
			if (title.length === 0)
			{
				return false;
			}

			if (title !== this.state.savedTitle)
			{
				return true;
			}

			return !this.#chatIdsEqual(this.state.chatIds, this.state.savedChatIds);
		}

		#chatIdsEqual(a, b)
		{
			if (a.length !== b.length)
			{
				return false;
			}
			const setA = new Set(a.map((id) => String(id)));

			return b.every((id) => setA.has(String(id)));
		}

		get maxChatCount()
		{
			return this.props.maxChatCount || MAX_CHATS_PER_FOLDER;
		}

		render()
		{
			return Box(
				{
					testId: 'folder-form-box',
					withScroll: false,
					footer: this.renderFooter(),
					resizableByKeyboard: true,
					onClick: () => this.titleInputRef?.blur({ hideKeyboard: true }),
				},
				this.renderHeader(),
				this.renderSectionHeader(),
				this.renderChatListView(),
			);
		}

		renderHeader()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						paddingHorizontal: 18,
						paddingTop: 10,
						paddingBottom: 18,
					},
				},
				this.renderHeaderIcon(),
				View(
					{
						style: {
							flex: 1,
							marginLeft: 12,
							height: 56,
							paddingTop: 14,
						},
					},
					View(
						{
							style: {
								height: 42,
								borderWidth: 1,
								borderColor: Theme.colors.base5,
								borderRadius: 11,
								justifyContent: 'center',
								paddingHorizontal: 12,
							},
						},
						TextInput({
							ref: (ref) => {
								this.titleInputRef = ref;
							},
							style: {
								fontSize: 17,
								color: Theme.colors.base1,
							},
							value: this.state.title,
							maxLength: this.props.maxTitleLength || 30,
							placeholder: Loc.getMessage('IMMOBILE_FOLDER_FORM_TITLE_PLACEHOLDER'),
							placeholderTextColor: Theme.colors.base4,
							onChangeText: (text) => {
								this.setState({ title: text }, this.#syncSubmitEnabled);
							},
						}),
					),
				),
			);
		}

		renderHeaderIcon()
		{
			const iconType = this.props.headerIconType || IconType.folderCreate;

			return View(
				{
					style: {
						width: 78,
						height: 78,
					},
				},
				Image({
					style: {
						width: 78,
						height: 78,
					},
					uri: MessengerIcon.getByType(iconType),
					resizeMode: 'contain',
				}),
			);
		}

		renderSectionHeader()
		{
			return View(
				{
					style: {
						paddingHorizontal: 18,
						height: 38,
						justifyContent: 'center',
					},
				},
				Text({
					style: {
						fontSize: 15,
						lineHeight: 18,
						color: Theme.colors.base4,
					},
					text: Loc.getMessage('IMMOBILE_FOLDER_FORM_SECTION_HEADER'),
				}),
			);
		}

		renderAddButton()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						paddingHorizontal: 18,
						paddingTop: 14,
						paddingBottom: 15,
						alignItems: 'center',
					},
					onClick: () => this.handleAddChats(),
				},
				View(
					{
						style: {
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: Color.accentSoftBlue2.toHex(),
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					IconView({
						icon: Icon.PLUS,
						size: 24,
						color: Color.accentMainPrimary,
					}),
				),
				View(
					{
						style: {
							flex: 1,
							marginLeft: 12,
						},
					},
					Text({
						style: {
							fontSize: 17,
							color: Theme.colors.base1,
						},
						text: Loc.getMessage('IMMOBILE_FOLDER_FORM_ADD_BUTTON'),
					}),
				),
			);
		}

		handleAddChats()
		{
			if (this.state.chatIds.length >= this.maxChatCount)
			{
				this.showChatLimitToast();

				return;
			}

			this.props.onAddChats?.(this.state.chatIds, (dialogIds) => {
				const selectedDialogIds = Type.isArray(dialogIds) ? dialogIds : [];
				const nextDialogIds = selectedDialogIds.slice(0, this.maxChatCount);
				if (selectedDialogIds.length > this.maxChatCount)
				{
					this.showChatLimitToast();
				}

				this.setState({ chatIds: nextDialogIds }, this.#syncSubmitEnabled);
			});
		}

		showChatLimitToast()
		{
			Notification.showErrorToast(
				{
					message: Loc.getMessage('IMMOBILE_FOLDER_FORM_ERROR_CHATS_LIMIT'),
				},
				this.props.layoutWidget,
			);
		}

		handleRemoveChat(dialogId)
		{
			this.setState({
				chatIds: this.state.chatIds.filter((id) => id !== dialogId),
			}, this.#syncSubmitEnabled);
		}

		renderChatListView()
		{
			const items = [
				{ id: '__add__', key: '__add__', type: 'add' },
				...this.state.chatIds.map((dialogId) => ({
					id: dialogId,
					key: String(dialogId),
					type: 'chat',
					dialogId,
				})),
			];

			return ListView({
				style: {
					flex: 1,
				},
				data: [{ items }],
				renderItem: (item) => {
					if (item.type === 'add')
					{
						return this.renderAddButton();
					}

					return new FolderChatItem({
						dialogId: item.dialogId,
						showRemove: this.props.showRemoveChats !== false,
						onRemove: (id) => this.handleRemoveChat(id),
					});
				},
			});
		}

		renderFooter()
		{
			const onClick = () => {
				this.props.onSubmit?.({
					title: this.state.title,
					chatIds: this.state.chatIds,
				});
			};

			return BoxFooter(
				{
					testId: 'folder-form-footer',
					keyboardButton: {
						testId: 'folder-form-submit-keyboard-button',
						text: this.props.submitText,
						color: Color.baseWhiteFixed,
						disabled: !this.isSubmitEnabled,
						onClick,
					},
				},
				new FolderLoadableButton({
					testId: 'folder-form-submit-button',
					text: this.props.submitText,
					enabled: this.isSubmitEnabled,
					ref: (btn) => {
						this.submitButton = btn;
						this.props.submitButtonRef?.(btn);
					},
					onClick,
				}),
			);
		}
	}

	module.exports = { FolderFormView };
});
