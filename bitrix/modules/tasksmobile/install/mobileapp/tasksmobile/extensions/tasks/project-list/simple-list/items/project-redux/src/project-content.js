/**
 * @module tasks/project-list/simple-list/items/project-redux/src/project-content
 */
jn.define('tasks/project-list/simple-list/items/project-redux/src/project-content', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { connect } = require('statemanager/redux/connect');
	const { Color, Component, Indent } = require('tokens');
	const { withPressed } = require('utils/color');
	const { Moment, DynamicDateFormatter } = require('utils/date');
	const { date, dayShortMonth, shortTime } = require('utils/date/formats');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { AvatarEntityType, AvatarShape } = require('ui-system/blocks/avatar');
	const { ProjectAvatar } = require('tasks/ui/avatars/project-avatar');
	const { selectGroupById } = require('tasks/statemanager/redux/slices/groups');
	const { selectById } = require('tasks/statemanager/redux/slices/project-list');
	const {
		ProjectMemberStack,
		ProjectRoleStack,
	} = require('tasks/project-list/simple-list/items/project-redux/src/project-avatar-stacks');

	const PROJECT_AVATAR_SIZE = 40;

	const activityDateFormatter = new DynamicDateFormatter({
		config: {
			[DynamicDateFormatter.periods.DAY]: shortTime(),
			[DynamicDateFormatter.periods.WEEK]: 'E',
			[DynamicDateFormatter.periods.YEAR]: dayShortMonth(),
		},
		defaultFormat: date(),
	});

	class ProjectContent extends PureComponent
	{
		/**
		 * @returns {?ProjectContentProject}
		 */
		get project()
		{
			return this.props.project;
		}

		/**
		 * @returns {ProjectContentGroup}
		 */
		get group()
		{
			return this.props.group ?? {};
		}

		get backgroundColor()
		{
			return Color.bgContentPrimary.toHex();
		}

		get testId()
		{
			return `${this.props.testId}_PROJECT_${this.props.id}`;
		}

		render()
		{
			if (!this.project)
			{
				return null;
			}

			return View(
				{
					testId: this.testId,
					style: {
						position: 'relative',
						minHeight: 76,
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingVertical: Indent.XL2.toNumber(),
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColor: withPressed(this.backgroundColor),
					},
				},
				this.renderProjectAvatar(),
				this.renderContent(),
				this.renderDivider(),
			);
		}

		renderDivider()
		{
			const left = Component.paddingLr.toNumber() + PROJECT_AVATAR_SIZE + Indent.XL.toNumber();

			return View({
				style: {
					position: 'absolute',
					left,
					right: 0,
					bottom: 0,
					height: 1,
					backgroundColor: Color.bgSeparatorSecondary.toHex(),
				},
			});
		}

		renderProjectAvatar()
		{
			return ProjectAvatar({
				testId: `${this.testId}_AVATAR`,
				id: this.project.id,
				name: this.group.name,
				size: PROJECT_AVATAR_SIZE,
				shape: AvatarShape.HEXAGON,
				entityType: AvatarEntityType.GROUP,
				uri: this.group.resizedImage100 ?? this.group.image,
				accent: true,
				hasCollabers: this.hasCollabers(),
				style: {
					backgroundColor: this.backgroundColor,
				},
			});
		}

		renderContent()
		{
			return View(
				{
					style: {
						flex: 1,
						marginLeft: Indent.XL.toNumber(),
					},
				},
				this.renderHeader(),
				this.renderFooter(),
			);
		}

		renderHeader()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Text2({
					testId: `${this.testId}_TITLE`,
					text: this.group.name,
					color: Color.base1,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flex: 1,
					},
				}),
				this.renderActivityDate(),
			);
		}

		renderActivityDate()
		{
			const activityDate = this.getActivityDateTimestamp();

			if (!activityDate)
			{
				return null;
			}

			return Text5({
				testId: `${this.testId}_ACTIVITY_DATE`,
				text: activityDateFormatter.format(new Moment(activityDate * 1000)),
				color: Color.base3,
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					flexShrink: 0,
					marginLeft: Indent.M.toNumber(),
				},
			});
		}

		renderFooter()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: Indent.S.toNumber(),
					},
				},
				ProjectRoleStack({
					testId: this.testId,
					ownerId: this.project.ownerId,
					moderatorIds: this.project.moderatorIds,
				}),
				ProjectMemberStack({
					testId: this.testId,
					memberIds: this.project.memberIds,
				}),
				View({
					style: {
						flex: 1,
					},
				}),
				this.renderCounter(),
			);
		}

		renderCounter()
		{
			const counterValue = this.getCounterValue();

			if (counterValue <= 0 || this.isCounterHidden())
			{
				return null;
			}

			return BadgeCounter({
				testId: `${this.testId}_COUNTER`,
				value: counterValue,
				design: BadgeCounterDesign.SUCCESS,
				size: BadgeCounterSize.M,
				style: {
					marginLeft: Indent.S.toNumber(),
				},
			});
		}

		hasCollabers()
		{
			return this.project.hasCollabers === true || this.project.hasCollabers === 'Y';
		}

		getCounterValue()
		{
			return Number(this.project.counter?.value ?? this.project.counter?.VALUE ?? 0);
		}

		getActivityDateTimestamp()
		{
			const activityDate = Number(this.project.activityDate);

			return Number.isFinite(activityDate) && activityDate > 0 ? activityDate : null;
		}

		isCounterHidden()
		{
			const isHidden = this.project.counter?.isHidden ?? this.project.counter?.IS_HIDDEN;

			return isHidden === true || isHidden === 'Y';
		}

	}

	/**
	 * @param {object} state
	 * @param {ProjectListProjectContentProps} ownProps
	 * @returns {object}
	 */
	const mapStateToProps = (state, ownProps) => {
		const project = selectById(state, ownProps.id);

		if (!project)
		{
			return {};
		}

		const group = selectGroupById(state, project.id);
		const {
			id,
			activityDate,
			ownerId,
			moderatorIds,
			memberIds,
			counter,
			hasCollabers,
		} = project;

		return {
			project: {
				id,
				activityDate,
				ownerId,
				moderatorIds,
				memberIds,
				counter,
				hasCollabers,
			},
			group,
		};
	};

	const ProjectContentView = connect(mapStateToProps)(ProjectContent);

	module.exports = { ProjectContentView };
});
