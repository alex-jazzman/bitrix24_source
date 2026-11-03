/**
 * @module mail/simple-list/items/conversation/src/conversation-content
 */
jn.define('mail/simple-list/items/conversation/src/conversation-content', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Text, Text4, Text5, Text6 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Moment } = require('utils/date');
	const { Haptics } = require('haptics');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Avatar } = require('mail/message/elements/avatar');
	const { connect } = require('mail/statemanager/redux/connect');
	const {
		selectById,
		selectIsConversationExpanded,
	} = require('mail/statemanager/redux/slices/conversations/selector');
	const { buildConversationRowViewModel } = require('mail/simple-list/items/conversation/src/conversation-view-model');
	const {
		createConversationToggleHandlers,
	} = require('mail/simple-list/items/conversation/src/conversation-interaction');

	const AVATAR_SIZE = 40;

	/**
	 * Collapsed conversation row. Props: {@link ConversationContentProps}.
	 */
	class ConversationContent extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.onToggleExpand = this.onToggleExpand.bind(this);
			this.toggleHandlers = createConversationToggleHandlers(this.onToggleExpand);
		}

		/**
		 * @return {ConversationRowViewModel|null}
		 */
		get viewModel()
		{
			return buildConversationRowViewModel(this.props.item, {
				emptySubject: Loc.getMessage('MAILMOBILE_CONVERSATION_EMPTY_SUBJECT'),
				noParticipants: Loc.getMessage('MAILMOBILE_CONVERSATION_NO_PARTICIPANTS'),
			});
		}

		get isExpanded()
		{
			return this.props.isExpanded === true;
		}

		render()
		{
			const vm = this.viewModel;
			if (vm === null)
			{
				return null;
			}

			return View(
				{
					testId: vm.testId,
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.renderContent(vm),
				vm.incomplete && this.renderIncomplete(vm),
				this.border(),
			);
		}

		renderContent(vm)
		{
			return View(
				{
					onClick: this.toggleHandlers.contentOnClick,
					onLongClick: this.props.onLongClick,
					style: {
						paddingLeft: Indent.XL3.toNumber(),
						paddingTop: Indent.M.toNumber(),
						paddingBottom: Indent.XL2.toNumber(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'flex-start',
						},
					},
					Avatar({
						fullName: vm.avatarName,
						email: vm.avatarEmail,
						size: AVATAR_SIZE,
					}),
					View(
						{
							style: {
								flex: 1,
								marginLeft: Indent.XL.toNumber(),
								flexDirection: 'column',
								alignItems: 'flex-start',
							},
						},
						this.renderParticipants(vm),
						this.renderSubject(vm),
						this.renderPreview(vm),
					),
					View(
						{
							style: {
								alignItems: 'flex-end',
							},
						},
						this.renderDate(vm),
						this.renderMeta(vm),
					),
					this.renderExpandControl(vm),
				),
			);
		}

		renderParticipants(vm)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						height: 20,
						overflow: 'hidden',
						marginBottom: Indent.XS.toNumber(),
					},
				},
				this.unreadMarker(vm),
				Text4({
					testId: `${vm.testId}-participants`,
					numberOfLines: 1,
					ellipsize: 'end',
					accent: vm.hasUnread,
					style: {
						alignSelf: 'center',
						flexShrink: 2,
					},
					text: vm.participants,
				}),
			);
		}

		renderSubject(vm)
		{
			return View(
				{
					style: {
						height: 20,
						overflow: 'hidden',
					},
				},
				Text4({
					testId: `${vm.testId}-subject`,
					numberOfLines: 1,
					ellipsize: 'end',
					accent: vm.hasUnread,
					style: {
						alignSelf: 'center',
						marginBottom: Indent.XS2.toNumber(),
					},
					text: vm.subject,
				}),
			);
		}

		renderPreview(vm)
		{
			return Text4({
				testId: `${vm.testId}-preview`,
				numberOfLines: 1,
				ellipsize: 'end',
				color: Color.base3,
				text: vm.preview,
			});
		}

		unreadMarker(vm)
		{
			if (!vm.hasUnread)
			{
				return View();
			}

			return Text({
				style: {
					marginTop: Indent.M.toNumber(),
					marginBottom: Indent.M.toNumber(),
					marginRight: Indent.S.toNumber(),
					width: 6,
					height: 6,
					backgroundColor: Color.accentMainPrimary.toHex(),
					borderRadius: 100,
				},
				text: '',
			});
		}

		renderDate(vm)
		{
			const moment = Moment.createFromTimestamp(vm.timestamp);
			const text = moment.format((momentInstance) => (momentInstance.isToday ? 'HH:mm' : 'DD MMM'));

			return Text5({
				testId: `${vm.testId}-date`,
				numberOfLines: 1,
				ellipsize: 'end',
				color: Color.base4,
				style: {
					marginRight: Indent.XL3.toNumber(),
					marginTop: Indent.XS2.toNumber(),
					maxWidth: 120,
					textAlign: 'center',
					alignSelf: 'flex-end',
				},
				text,
			});
		}

		renderMeta(vm)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: Indent.XS.toNumber(),
						marginRight: Indent.XL3.toNumber(),
					},
				},
				vm.hasDraft && IconView({
					testId: `${vm.testId}-draft`,
					icon: Icon.EDIT,
					size: 16,
					color: Color.base4,
					style: {
						marginRight: vm.isChain ? Indent.XS.toNumber() : 0,
					},
				}),
				vm.isChain && this.renderCount(vm),
			);
		}

		renderCount(vm)
		{
			return View(
				{
					testId: `${vm.testId}-count`,
					style: {
						minWidth: 20,
						height: 18,
						paddingLeft: Indent.XS.toNumber(),
						paddingRight: Indent.XS.toNumber(),
						borderRadius: 100,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: vm.hasUnread
							? Color.accentMainPrimary.toHex()
							: Color.bgSeparatorPrimary.toHex(),
					},
				},
				Text6({
					numberOfLines: 1,
					accent: true,
					color: vm.hasUnread ? Color.baseWhiteFixed : Color.base2,
					text: String(vm.messageCount),
				}),
			);
		}

		renderExpandControl(vm)
		{
			if (!vm.isChain)
			{
				return null;
			}

			return View(
				{
					testId: vm.expandTestId,
					style: {
						justifyContent: 'center',
						alignItems: 'center',
						paddingLeft: Indent.S.toNumber(),
						paddingRight: Indent.XL2.toNumber(),
						alignSelf: 'stretch',
					},
					onClick: this.toggleHandlers.expandOnClick,
				},
				IconView({
					icon: this.isExpanded ? Icon.CHEVRON_DOWN : Icon.CHEVRON_TO_THE_RIGHT,
					size: 20,
					color: Color.base4,
				}),
			);
		}

		renderIncomplete(vm)
		{
			return View(
				{
					testId: `${vm.testId}-incomplete`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginLeft: Indent.XL3.toNumber() + AVATAR_SIZE + Indent.XL.toNumber(),
						marginRight: Indent.XL.toNumber(),
						marginBottom: Indent.M.toNumber(),
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
				vm.retryAvailable && Text5({
					testId: `${vm.testId}-retry`,
					color: Color.accentMainLink,
					accent: true,
					style: {
						marginLeft: Indent.S.toNumber(),
					},
					text: Loc.getMessage('MAILMOBILE_CONVERSATION_RETRY'),
					onClick: () => this.onRetry(vm),
				}),
			);
		}

		border()
		{
			return View({
				style: {
					width: '80%',
					height: 1,
					borderTopWidth: 1,
					borderTopColor: Color.bgSeparatorSecondary.toHex(),
					marginLeft: Indent.XL.toNumber(),
					marginRight: Indent.XL.toNumber(),
					alignSelf: 'flex-end',
				},
			});
		}

		onToggleExpand()
		{
			Haptics.impactLight();
			this.props.onToggleExpand?.(this.props.id);
		}

		onRetry(vm)
		{
			this.props.onRetry?.(vm.id);
		}
	}

	const mapStateToProps = (state, ownProps) => ({
		item: selectById(state, ownProps.id),
		isExpanded: selectIsConversationExpanded(state, ownProps.id),
	});

	module.exports = {
		ConversationContent,
		ConversationContentView: connect(mapStateToProps)(ConversationContent),
	};
});
