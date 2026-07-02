/**
 * @module tasks/template-list/simple-list/items/template/src/template-content
 */
jn.define('tasks/template-list/simple-list/items/template/src/template-content', (require, exports, module) => {
	const { BlinkView } = require('animation/components/blink-view');
	const { Color, Component, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Moment, DynamicDateFormatter } = require('utils/date');
	const { date, dayShortMonth, shortTime } = require('utils/date/formats');
	const { withPressed } = require('utils/color');
	const { TaskStatus, TimerState } = require('tasks/enum');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { TimeTrackingTimerIcon } = require('tasks/layout/fields/time-tracking/timer');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons');
	const { Entry } = require('tasks/entry');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { formatTemplateDeadlineAfter } = require('tasks/layout/template/deadline-after-formatter');

	class TemplateContent extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.blinkViewRef = null;
			this.isBlinking = false;
			this.getTestId = createTestIdGenerator({
				context: this,
			});
		}

		get template()
		{
			return this.props.template;
		}

		get backgroundColor()
		{
			return Color.bgContentPrimary.toHex();
		}

		get showBorder()
		{
			return this.props?.showBorder ?? false;
		}

		get showDelimiter()
		{
			return this.showBorder;
		}

		async blink()
		{
			if (this.isBlinking)
			{
				return;
			}

			this.isBlinking = true;
			await this.blinkViewRef?.blink(this.template);

			this.isBlinking = false;
		}

		render()
		{
			return new BlinkView({
				ref: (ref) => {
					this.blinkViewRef = ref;
				},
				data: this.template,
				style: {
					backgroundColor: withPressed(this.backgroundColor),
				},
				slot: this.renderContent,
			});
		}

		renderContent = () => {
			return View(
				{
					style: {
						flexDirection: 'column',
						backgroundColor: withPressed(this.backgroundColor),
					},
					testId: this.getTestId(`item-${this.props.id}`),
				},
				View({
					style: this.styles.itemWrapper(this.showBorder, this.backgroundColor),
				}),
				View(
					{
						style: this.styles.itemContent(
							this.showDelimiter,
							this.backgroundColor,
						),
					},
					this.renderHeader(),
					this.renderBody(),
				),
			);
		};

		renderHeader()
		{
			return View(
				{
					testId: this.getTestId('section'),
					style: this.styles.header(Boolean(this.template)),
				},
				Text3({
					accent: true,
					testId: this.getTestId('section-title'),
					style: this.styles.title(false, this.template?.status),
					text: this.template?.name || this.props.id,
					numberOfLines: 2,
					ellipsize: 'end',
				}),
				View(
					{
						style: {
							flexDirection: 'row',
						},
					},
					this.renderImportantIcon(),
					this.renderLastActivityDate(),
				),
			);
		}

		renderImportantIcon()
		{
			return View(
				{
					testId: this.getTestId('important'),
					style: this.styles.stateIconWrapper(this.template?.priority === 2),
				},
				IconView({
					size: 16,
					color: Color.accentMainWarning,
					icon: Icon.FIRE,
				}),
			);
		}

		renderLastActivityDate()
		{
			if (!this.template?.activityDate)
			{
				return null;
			}

			const formatter = new DynamicDateFormatter({
				config: {
					[DynamicDateFormatter.periods.DAY]: shortTime(),
					[DynamicDateFormatter.periods.WEEK]: 'E',
					[DynamicDateFormatter.periods.YEAR]: dayShortMonth(),
				},
				defaultFormat: date(),
			});

			const formattedTime = formatter.format(new Moment(this.template.activityDate * 1000));

			return Text5({
				testId: this.getTestId('last-activity-date'),
				text: formattedTime,
				style: this.styles.date,
			});
		}

		renderBody()
		{
			if (this.template?.isCreationErrorExist)
			{
				return View(
					{
						style: this.styles.body(Boolean(this.template)),
					},
					this.renderResponsible(),
				);
			}

			return View(
				{
					style: this.styles.body(Boolean(this.template)),
				},
				View(
					{
						style: {
							flexDirection: 'row',
							justifyContent: 'flex-start',
							flex: 1,
						},
					},
					View(
						{
							style: {
								...this.styles.bodySection,
								flexGrow: 1,
								marginLeft: 0,
							},
						},
						this.renderResponsible(),
						this.renderDeadline(),
					),
					View(
						{
							style: {
								...this.styles.bodySection,
								width: 80,
							},
						},
						this.renderRepetition(),
						this.renderChecklist(),
					),
				),
				View(
					{
						style: {
							...this.styles.bodySection,
							minWidth: 72,
							justifyContent: 'flex-end',
						},
					},
					this.renderTimeTrackingIcon(),
					this.renderCreateButton(),
				),
			);
		}

		renderResponsible()
		{
			return Avatar({
				id: this.template?.responsibleId,
				testId: this.getTestId('responsible'),
				size: 28,
				withRedux: true,
			});
		}

		renderDeadline()
		{
			return View(
				{
					testId: this.getTestId('deadline'),
					style: this.styles.deadlinePill(this.backgroundColor),
				},
				Text5({
					text: this.formatDeadlineAfter(this.template?.deadlineAfter ?? 0),
					style: {
						color: Color.base3.toHex(),
						marginVertical: 3,
					},
				}),
			);
		}

		formatDeadlineAfter(seconds)
		{
			return formatTemplateDeadlineAfter(seconds, Loc.getMessage('TASKSMOBILE_TEMPLATE_DEADLINE_PILL_NO_DEADLINE'));
		}

		renderChecklist()
		{
			const checklistItems = this.template?.checklist;
			if (!checklistItems)
			{
				return null;
			}

			const checklistItemsCount = checklistItems.completed + checklistItems.uncompleted;

			if (checklistItemsCount === 0)
			{
				return null;
			}

			const completedValue = checklistItems.completed > 99 ? '99+' : checklistItems.completed;
			const checklistItemsCountValue = checklistItemsCount > 99 ? '99+' : checklistItemsCount;

			return View(
				{
					testId: this.getTestId('checklist'),
					style: {
						flexDirection: 'row',
						marginRight: Indent.L.toNumber(),
						position: 'absolute',
						left: 0,
					},
				},
				IconView({
					size: 20,
					color: Color.base3,
					icon: Icon.COMPLETE_TASK_LIST,
					style: {
						marginRight: Indent.XS2.toNumber(),
					},
				}),
				Text5({
					style: {
						color: Color.base3.toHex(),
					},
					text: `${completedValue}/${checklistItemsCountValue}`,
				}),
			);
		}

		renderRepetition()
		{
			if (!this.template.isRepeatable)
			{
				return null;
			}

			return IconView({
				style: {
					position: 'absolute',
					right: 0,
				},
				size: 20,
				color: Color.base3,
				icon: Icon.REPEAT,
			});
		}

		renderCreateButton()
		{
			const templateId = Number(this.template?.id || 0);
			const templateTitle = this.template?.name || '';

			return View(
				{
					style: {
						marginLeft: Indent.M.toNumber(),
					},
				},
				Button({
					testId: this.getTestId('create-from-template'),
					leftIcon: Icon.PLUS,
					size: ButtonSize.M,
					design: ButtonDesign.OUTLINE_ACCENT_2,
					onClick: () => {
						Entry.openTaskCreation({
							initialTaskData: {
								templateId,
								templateTitle,
							},
						});
					},
				}),
			);
		}

		renderTimeTrackingIcon()
		{
			const allowTimeTracking = this.template?.allowTimeTracking;
			const timerState = this.template?.timerState ?? TimerState.PAUSED;
			const seconds = this.template?.timeElapsed ?? 0;
			const timeEstimate = this.template?.timeEstimate ?? 0;
			const isActive = Boolean(this.template?.isTimerRunningForCurrentUser);
			const Colors = {
				[TimerState.OVERDUE]: Color.accentMainAlert.toHex(),
				[TimerState.RUNNING]: Color.accentMainPrimaryalt.toHex(),
				[TimerState.PAUSED]: Color.base3.toHex(),
			};

			if (!allowTimeTracking)
			{
				return null;
			}

			return new TimeTrackingTimerIcon({
				timeEstimate,
				seconds,
				isActive,
				testId: this.getTestId(`time-tracking-${String(timerState).toLowerCase()}`),
				color: Colors[timerState],
				onTimeOver: () => {},
			});
		}

		get testId()
		{
			return this.props.testId;
		}

		get styles()
		{
			return {
				itemWrapper: (showBorder, backgroundColor) => ({
					flexGrow: 1,
					height: Component.separatorStroke.toNumber(),
					width: '100%',
					position: 'absolute',
					bottom: 0,
					backgroundColor: showBorder ? Color.bgSeparatorPrimary.toHex() : backgroundColor,
				}),
				itemContent: (showBorder, backgroundColor) => ({
					marginHorizontal: Component.paddingLr.toNumber(),
					paddingTop: Indent.XS.toNumber(),
					flexGrow: 1,
					borderBottomWidth: showBorder ? Component.separatorStroke.toNumber() : 0,
					borderBottomColor: showBorder ? Color.bgSeparatorSecondary.toHex() : backgroundColor,
				}),
				header: (shouldShow) => ({
					display: shouldShow ? 'flex' : 'none',
					flexDirection: 'row',
					alignItems: 'flex-start',
					marginTop: Indent.M.toNumber(),
					marginBottom: Indent.XL2.toNumber(),
					flexGrow: 1,
				}),
				title: (isCompleted, status) => ({
					flex: 1,
					marginRight: Indent.L.toNumber(),
					marginBottom: -Component.separatorStroke.toNumber(),
					color: isCompleted && status !== TaskStatus.SUPPOSEDLY_COMPLETED ? Color.base4.toHex() : Color.base1.toHex(),
					textDecorationLine: isCompleted && status !== TaskStatus.SUPPOSEDLY_COMPLETED ? 'line-through' : 'none',
					marginTop: 0,
				}),
				stateIconWrapper: (shouldShow) => ({
					display: shouldShow ? 'flex' : 'none',
					marginRight: 9,
					marginTop: Indent.XS2.toNumber(),
				}),
				date: {
					color: Color.base3.toHex(),
					textAlign: 'right',
					marginLeft: Indent.XS2.toNumber(),
					minWidth: 32,
					marginBottom: 0,
					paddingTop: 0,
					marginTop: Indent.XS2.toNumber(),
				},
				body: (shouldShow) => ({
					display: shouldShow ? 'flex' : 'none',
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					flexGrow: 1,
					marginBottom: 16,
				}),
				bodySection: {
					flexDirection: 'row',
					alignItems: 'center',
				},
				deadlinePill: (backgroundColor) => ({
					borderWidth: 1,
					borderColor: Color.bgSeparatorPrimary.toHex(),
					backgroundColor,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					borderRadius: Indent.XL2.toNumber(),
					marginLeft: Indent.L.toNumber(),
					paddingHorizontal: Indent.L.toNumber(),
					paddingVertical: 1,
				}),
			};
		}
	}

	const TemplateContentView = (props) => new TemplateContent(props);

	module.exports = {
		TemplateContentView,
	};
});
