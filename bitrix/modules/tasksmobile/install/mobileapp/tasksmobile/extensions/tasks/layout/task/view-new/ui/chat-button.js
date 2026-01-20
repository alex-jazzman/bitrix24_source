/**
 * @module tasks/layout/task/view-new/ui/chat-button
 */
jn.define('tasks/layout/task/view-new/ui/chat-button', (require, exports, module) => {
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { Icon } = require('assets/icons');
	const { BadgeCounter, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const { PureComponent } = require('layout/pure-component');
	const { connect } = require('statemanager/redux/connect');
	const { selectByTaskIdOrGuid, selectIsMember } = require('tasks/statemanager/redux/slices/tasks');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Tourist } = require('tourist');

	const IMAGE_URI = makeLibraryImagePath('chat.png', 'graphic');

	class ChatButton extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.containerRef = null;
			this.btnRef = null;
			this.ahaMomentWasShown = false;

			this.state = {
				visible: true,
				unreadComments: Number(props.unreadComments || 0),
				isBadgeActive: Boolean(props.isBadgeActive),
			};

			this.show = this.show.bind(this);
			this.hide = this.hide.bind(this);
		}

		componentWillReceiveProps(props)
		{
			this.state = {
				...this.state,
				unreadComments: Number(props.unreadComments || 0),
				isBadgeActive: Boolean(props.isBadgeActive),
			};

			if (props.shouldShowAhaMoment && !this.ahaMomentWasShown)
			{
				this.#showAhaMoment(this.btnRef);
			}
		}

		componentDidMount()
		{
			Keyboard.on(Keyboard.Event.WillShow, this.hide);
			Keyboard.on(Keyboard.Event.WillHide, this.show);
		}

		componentWillUnmount()
		{
			Keyboard.off(Keyboard.Event.WillShow, this.hide);
			Keyboard.off(Keyboard.Event.WillHide, this.show);
		}

		show()
		{
			if (!this.state.visible)
			{
				this.containerRef?.animate({ opacity: 1, duration: 100 }, () => this.setState({ visible: true }));
			}
		}

		hide()
		{
			if (this.state.visible)
			{
				this.containerRef?.animate({ opacity: 0, duration: 300 }, () => this.setState({ visible: false }));
			}
		}

		render()
		{
			return View(
				{
					testId: `${this.props.testId}_Container`,
					style: {
						flex: 1,
						alignSelf: 'center',
						position: 'absolute',
						bottom: 30,
					},
					safeArea: {
						bottom: true,
					},
					ref: (ref) => {
						if (ref)
						{
							this.btnRef = ref;
						}
					},
				},
				View(
					{
						testId: `${this.props.testId}_VisibilityLayer`,
						style: {
							display: this.state.visible ? 'flex' : 'none',
							flexDirection: 'row',
						},
						ref: (ref) => {
							this.containerRef = ref;
						},
					},
					Button({
						testId: `${this.props.testId}_ClickableArea`,
						text: Loc.getMessage('M_TASK_DETAILS_CHAT_BUTTON'),
						size: ButtonSize.M,
						backgroundColor: Color.accentMainPrimary,
						color: Color.baseWhiteFixed,
						leftIcon: Icon.MESSAGES,
						badge: this.#renderBadge(this.state.unreadComments),
						onClick: this.props.onClick,
					}),
				),
			);
		}

		#showAhaMoment(ref)
		{
			void AhaMoment.show({
				testId: `${this.props.testId}-aha-moment`,
				title: Loc.getMessage('M_TASK_CHAT_BUTTON_AHA_MOMENT_TITLE'),
				description: Loc.getMessage('M_TASK_CHAT_BUTTON_AHA_MOMENT_DESCRIPTION'),
				disableHideByOutsideClick: false,
				shouldShowImageBackgroundColor: false,
				onHide: () => {
					this.ahaMomentWasShown = true;
					void this.#markAsViewed();
				},
				image: Image(
					{
						uri: IMAGE_URI,
						style: {
							width: 78,
							height: 70,
						},
						resizeMode: 'contain',
					},
				),
				closeButton: false,
				targetRef: ref,
			});
		}

		async #markAsViewed()
		{
			await Tourist.ready();
			void Tourist.remember('chat_button_moment_enabled');
		}

		/**
		 * @param {number} unreadComments
		 * @return {BadgeCounter|null}
		 */
		#renderBadge(unreadComments)
		{
			if (unreadComments <= 0)
			{
				return null;
			}

			return BadgeCounter({
				testId: `${this.props.testId}_Badge`,
				value: unreadComments,
				showRawValue: true,
				design: this.state.isBadgeActive ? BadgeCounterDesign.SUCCESS : BadgeCounterDesign.GREY,
			});
		}
	}

	const mapStateToProps = (state, { taskId }) => {
		const task = selectByTaskIdOrGuid(state, taskId) || {};

		return {
			unreadComments: task.newCommentsCount,
			isBadgeActive: selectIsMember(task) && !task.isMuted,
		};
	};

	module.exports = {
		ChatButton: connect(mapStateToProps)(ChatButton),
	};
});
