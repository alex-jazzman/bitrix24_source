/**
 * @module tasks/layout/template/view/create-task-button
 */
jn.define('tasks/layout/template/view/create-task-button', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { Icon } = require('assets/icons');
	const { PureComponent } = require('layout/pure-component');
	const { Entry } = require('tasks/entry');
	const { createTestIdGenerator } = require('utils/test');

	class CreateTaskButton extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.containerRef = null;
			this.getTestId = createTestIdGenerator({
				context: this,
			});
			this.state = {
				visible: true,
			};

			this.show = this.show.bind(this);
			this.hide = this.hide.bind(this);
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
			const { templateId, templateTitle } = this.props;

			return View(
				{
					testId: this.getTestId('container'),
					style: {
						flex: 1,
						alignSelf: 'center',
						position: 'absolute',
						bottom: 30,
					},
					safeArea: {
						bottom: true,
					},
				},
				View(
					{
						testId: this.getTestId('visibility-layer'),
						style: {
							display: this.state.visible ? 'flex' : 'none',
							flexDirection: 'row',
						},
						ref: (ref) => {
							this.containerRef = ref;
						},
					},
					Button({
						testId: this.getTestId('clickable-area'),
						text: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_CREATE_TASK_BUTTON'),
						size: ButtonSize.M,
						backgroundColor: Color.accentMainPrimary,
						color: Color.baseWhiteFixed,
						leftIcon: Icon.PLUS,
						onClick: () => {
							void Entry.openTaskCreation({
								initialTaskData: {
									templateId,
									templateTitle,
								},
							});
						},
					}),
				),
			);
		}
	}

	module.exports = {
		CreateTaskButton,
	};
});
