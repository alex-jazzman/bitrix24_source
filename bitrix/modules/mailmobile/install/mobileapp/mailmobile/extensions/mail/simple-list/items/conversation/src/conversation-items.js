/**
 * @module mail/simple-list/items/conversation/src/conversation-items
 */
jn.define('mail/simple-list/items/conversation/src/conversation-items', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Text5, Text6 } = require('ui-system/typography/text');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const {
		MessageContent,
		MessageContentView,
	} = require('mail/simple-list/items/message-redux/src/message-content');
	const { connect } = require('mail/statemanager/redux/connect');
	const { ConversationItemKind } = require('mail/statemanager/redux/slices/conversations/src/state');
	const {
		buildConversationItemViewModel,
		buildConversationItemsWindow,
		CONVERSATION_ITEMS_WINDOW_SIZE,
		CONVERSATION_LOAD_MORE_TEST_ID_PREFIX,
	} = require('mail/simple-list/items/conversation/src/conversation-loader');
	const {
		buildConversationChildContainerStyle,
	} = require('mail/simple-list/items/conversation/src/conversation-view-model');
	const {
		selectIsConversationExpanded,
		selectConversationChildren,
		selectConversationChildRecords,
		selectConversationCursor,
		selectConversationLoading,
		selectConversationIncomplete,
		selectConversationRetryAvailable,
		selectConversationRemainingCount,
	} = require('mail/statemanager/redux/slices/conversations/selector');
	const { selectAll: selectAllFolders } = require('mail/statemanager/redux/slices/folders/selector');
	const {
		selectIsMultiSelectMode,
		selectSelectedIds,
	} = require('mail/statemanager/redux/slices/messages/selector');

	const NESTED_INDENT = Indent.XL4.toNumber();

	const folderTypeLabels = () => ({
		inbox: Loc.getMessage('MAILMOBILE_CONVERSATION_ITEM_FOLDER_INBOX'),
		sent: Loc.getMessage('MAILMOBILE_CONVERSATION_ITEM_FOLDER_SENT'),
		drafts: Loc.getMessage('MAILMOBILE_CONVERSATION_ITEM_FOLDER_DRAFTS'),
		spam: Loc.getMessage('MAILMOBILE_CONVERSATION_ITEM_FOLDER_SPAM'),
		trash: Loc.getMessage('MAILMOBILE_CONVERSATION_ITEM_FOLDER_TRASH'),
	});

	/**
	 * Expanded items of a conversation row. The rows reuse the message component (with its own
	 * checkbox and action menu), so only the affordances of the conversation itself live here: the
	 * folder or type label and the portion control. Props:
	 * {@link ConversationItemsProps}.
	 */
	class ConversationItems extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.state = { windowStart: 0 };
			this.advanceWindowAfterLoad = false;
		}

		componentDidUpdate(previousProps)
		{
			const previousIds = previousProps.childIds ?? [];
			const currentIds = this.props.childIds ?? [];
			let windowStart = this.state.windowStart;
			if (previousProps.id !== this.props.id)
			{
				windowStart = 0;
			}
			else if (this.advanceWindowAfterLoad && currentIds.length > previousIds.length)
			{
				windowStart = Math.max(0, currentIds.length - CONVERSATION_ITEMS_WINDOW_SIZE);
				this.advanceWindowAfterLoad = false;
			}
			else if (this.advanceWindowAfterLoad && previousProps.loading && !this.props.loading)
			{
				this.advanceWindowAfterLoad = false;
			}

			const normalizedStart = buildConversationItemsWindow(currentIds, windowStart).start;
			if (normalizedStart !== this.state.windowStart)
			{
				this.setState({ windowStart: normalizedStart });
			}
		}

		get id()
		{
			return this.props.id;
		}

		get isExpanded()
		{
			return this.props.isExpanded === true;
		}

		render()
		{
			if (!this.isExpanded || this.props.childIds.length === 0)
			{
				return null;
			}

			const window = buildConversationItemsWindow(this.props.childIds, this.state.windowStart);

			return View(
				{
					testId: `mail-conversation-items-${this.id}`,
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
						paddingBottom: Indent.XS.toNumber(),
					},
				},
				this.renderNewer(window),
				...window.childIds.map((childId) => this.renderChild(childId)),
				this.renderOlder(window),
				this.renderIncomplete(),
				!window.hasOlder && this.renderLoadMore(),
			);
		}

		renderNewer(window)
		{
			if (!window.hasNewer)
			{
				return null;
			}

			const count = Math.min(CONVERSATION_ITEMS_WINDOW_SIZE, window.hiddenNewerCount);

			return this.renderWindowControl(
				`mail-conversation-show-newer-${this.id}`,
				Loc.getMessagePlural('MAILMOBILE_CONVERSATION_SHOW_NEWER', count, { '#COUNT#': count }),
				this.onShowNewer,
			);
		}

		renderOlder(window)
		{
			if (!window.hasOlder)
			{
				return null;
			}

			const count = Math.min(CONVERSATION_ITEMS_WINDOW_SIZE, window.hiddenOlderCount);

			return this.renderWindowControl(
				`mail-conversation-show-older-${this.id}`,
				Loc.getMessagePlural('MAILMOBILE_CONVERSATION_LOAD_MORE', count, { '#COUNT#': count }),
				this.onShowOlder,
			);
		}

		renderWindowControl(testId, text, onClick)
		{
			return View(
				{
					testId,
					style: {
						paddingLeft: NESTED_INDENT,
						paddingTop: Indent.M.toNumber(),
						paddingBottom: Indent.M.toNumber(),
					},
					onClick,
				},
				Text5({
					accent: true,
					color: Color.accentMainLink,
					text,
				}),
			);
		}

		renderChild(childId)
		{
			const record = this.props.records[childId];
			if (!record)
			{
				return null;
			}

			const vm = buildConversationItemViewModel(
				record,
				{
					folderTypeLabels: folderTypeLabels(),
					folderNamesByPath: this.props.folderNamesByPath,
				},
				{
					isMultiSelectMode: this.props.isMultiSelectMode,
					selectedIds: this.props.selectedIds,
				},
			);

			return View(
				{
					testId: vm.testId,
					key: vm.id,
					style: buildConversationChildContainerStyle({
						isSelected: vm.isSelected,
						paddingLeft: NESTED_INDENT,
						selectedBackgroundColor: Color.accentSoftBlue2.toHex(),
						defaultBackgroundColor: Color.bgContentPrimary.toHex(),
					}),
				},
				this.renderChildMeta(vm),
				this.renderChildBody(record),
			);
		}

		renderChildMeta(vm)
		{
			if (vm.folderLabel === '')
			{
				return null;
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingTop: Indent.XS.toNumber(),
						paddingRight: Indent.XL3.toNumber(),
					},
				},
				Text6({
					testId: `${vm.testId}-folder`,
					numberOfLines: 1,
					ellipsize: 'end',
					color: Color.base4,
					text: vm.folderLabel,
				}),
			);
		}

		renderChildBody(record)
		{
			if (record.kind === ConversationItemKind.DRAFT)
			{
				if (!record.draft)
				{
					return null;
				}

				return new MessageContent({
					item: record.draft,
					itemDetailOpenHandler: this.props.itemDetailOpenHandler,
				});
			}

			return MessageContentView({
				id: record.messageId,
				itemDetailOpenHandler: this.props.itemDetailOpenHandler,
			});
		}

		renderLoadMore()
		{
			if ((this.props.cursor ?? null) === null)
			{
				return null;
			}

			const remainingCount = this.props.remainingCount;

			return View(
				{
					testId: `${CONVERSATION_LOAD_MORE_TEST_ID_PREFIX}-${this.id}`,
					style: {
						paddingLeft: NESTED_INDENT,
						paddingTop: Indent.M.toNumber(),
						paddingBottom: Indent.M.toNumber(),
					},
					onClick: this.onLoadMore,
				},
				this.props.loading
					? Loader({
						style: {
							width: 20,
							height: 20,
							alignSelf: 'flex-start',
						},
						animating: true,
						size: 'small',
					})
					: Text5({
						accent: true,
						color: Color.accentMainLink,
						text: Loc.getMessagePlural(
							'MAILMOBILE_CONVERSATION_LOAD_MORE',
							remainingCount,
							{ '#COUNT#': remainingCount },
						),
					}),
			);
		}

		renderIncomplete()
		{
			if (!this.props.incomplete)
			{
				return null;
			}

			return View(
				{
					testId: `mail-conversation-items-${this.id}-incomplete`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingLeft: NESTED_INDENT,
						paddingRight: Indent.XL.toNumber(),
						paddingTop: Indent.XS.toNumber(),
						paddingBottom: Indent.XS.toNumber(),
					},
				},
				Text5({
					color: Color.base4,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
					text: Loc.getMessage('MAILMOBILE_CONVERSATION_INCOMPLETE'),
				}),
				this.props.retryAvailable && Text5({
					testId: `mail-conversation-items-${this.id}-retry`,
					color: Color.accentMainLink,
					accent: true,
					style: {
						marginLeft: Indent.S.toNumber(),
					},
					text: Loc.getMessage('MAILMOBILE_CONVERSATION_RETRY'),
					onClick: this.onRetry,
				}),
			);
		}

		onLoadMore = () => {
			Haptics.impactLight();
			if (this.props.onLoadMore)
			{
				this.advanceWindowAfterLoad = true;
				this.props.onLoadMore(this.id);
			}
		};

		onShowNewer = () => {
			this.setState(({ windowStart }) => ({
				windowStart: Math.max(0, windowStart - CONVERSATION_ITEMS_WINDOW_SIZE),
			}));
		};

		onShowOlder = () => {
			this.setState(({ windowStart }) => ({
				windowStart: buildConversationItemsWindow(
					this.props.childIds,
					windowStart + CONVERSATION_ITEMS_WINDOW_SIZE,
				).start,
			}));
		};

		onRetry = () => {
			this.props.onRetry?.(this.id);
		};
	}

	const mapStateToProps = (state, ownProps) => {
		const childIds = selectConversationChildren(state, ownProps.id);
		const folderNamesByPath = Object.fromEntries(
			selectAllFolders(state, true).map((folder) => [folder.path, folder.name]),
		);

		return {
			isExpanded: selectIsConversationExpanded(state, ownProps.id),
			childIds,
			records: selectConversationChildRecords(state, ownProps.id),
			cursor: selectConversationCursor(state, ownProps.id),
			loading: selectConversationLoading(state, ownProps.id),
			incomplete: selectConversationIncomplete(state, ownProps.id),
			retryAvailable: selectConversationRetryAvailable(state, ownProps.id),
			remainingCount: selectConversationRemainingCount(state, ownProps.id),
			folderNamesByPath,
			isMultiSelectMode: selectIsMultiSelectMode(state),
			selectedIds: selectSelectedIds(state),
		};
	};

	module.exports = {
		ConversationItems,
		mapStateToProps,
		ConversationItemsView: connect(mapStateToProps)(ConversationItems),
	};
});
