/**
 * @module tasks/layout/task/view-new/ui/extra-settings
 */
jn.define('tasks/layout/task/view-new/ui/extra-settings', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { Text2 } = require('ui-system/typography/text');
	const { Switcher, SwitcherMode, SwitcherSize } = require('ui-system/blocks/switcher');
	const { Loc } = require('tasks/loc');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { connect } = require('statemanager/redux/connect');
	const { selectByTaskIdOrGuid, update } = require('tasks/statemanager/redux/slices/tasks');

	class ExtraSettings extends LayoutComponent
	{
		static open({ taskId, layoutWidget })
		{
			const parentWidget = (layoutWidget || PageManager);

			parentWidget.openWidget('layout', {
				backdrop: {
					showOnTop: false,
					onlyMediumPosition: true,
					bounceEnable: true,
					swipeAllowed: true,
					horizontalSwipeAllowed: false,
				},
				titleParams: {
					text: Loc.getMessage('M_TASKS_EXTRA_SETTINGS'),
					type: 'dialog',
				},
			}).then((childWidget) => {
				childWidget.showComponent(new ExtraSettings({
					layoutWidget: childWidget,
					taskId,
				}));
			}).catch((err) => {
				console.error(err);
			});
		}

		render()
		{
			return Box(
				{
					withScroll: true,
					withPaddingHorizontal: true,
				},
				ExtraSettingsContent({
					taskId: this.props.taskId,
					onChange: (id, enabled) => this.#onChangeSetting(id, enabled),
				}),
			);
		}

		#onChangeSetting(id, enabled)
		{
			const reduxFields = {
				[id]: enabled,
			};

			const serverFields = {};

			// eslint-disable-next-line default-case
			switch (id)
			{
				case 'allowChangeDeadline':
					serverFields.ALLOW_CHANGE_DEADLINE = (enabled ? 'Y' : 'N');
					break;

				case 'isMatchWorkTime':
					serverFields.MATCH_WORK_TIME = (enabled ? 'Y' : 'N');
					break;

				case 'isResultRequired':
					serverFields.SE_PARAMETER = [{ CODE: 3, VALUE: (enabled ? 'Y' : 'N') }];
					break;

				case 'allowTaskControl':
					serverFields.TASK_CONTROL = (enabled ? 'Y' : 'N');
					break;
			}

			dispatch(update({
				taskId: this.props.taskId,
				reduxFields,
				serverFields,
			}));
		}
	}

	const mapStateToProps = (state, { taskId }) => {
		const task = selectByTaskIdOrGuid(state, taskId);
		const items = [
			{
				id: 'allowChangeDeadline',
				text: Loc.getMessage('M_TASKS_EXTRA_SETTINGS_ALLOW_CHANGE_DEADLINE'),
				enabled: task?.allowChangeDeadline || false,
			},
			{
				id: 'isMatchWorkTime',
				text: Loc.getMessage('M_TASKS_EXTRA_SETTINGS_IS_MATCH_WORK_TIME'),
				enabled: task?.isMatchWorkTime || false,
			},
			{
				id: 'isResultRequired',
				text: Loc.getMessage('M_TASKS_EXTRA_SETTINGS_IS_RESULT_REQUIRED'),
				enabled: task?.isResultRequired || false,
			},
			{
				id: 'allowTaskControl',
				text: Loc.getMessage('M_TASKS_EXTRA_SETTINGS_ALLOW_TASK_CONTROL'),
				enabled: task?.allowTaskControl || false,
			},
		];

		return { items };
	};

	const ExtraSettingsContent = connect(mapStateToProps)((props) => {
		const { items, onChange } = props;
		const lastIndex = items.length - 1;

		return View(
			{
				style: {
					backgroundColor: Color.bgContentPrimary.toHex(),
					paddingTop: Indent.S.getValue(),
				},
			},
			...items.map(({ id, text, enabled }, index) => SettingsItem({
				id,
				text,
				enabled,
				onChange,
				divided: index < lastIndex,
			})),
		);
	});

	const SettingsItem = ({ id, text, onChange, enabled = false, divided = true }) => View(
		{
			testId: `${id}_container`,
			style: {
				paddingTop: Indent.XL.getValue(),
			},
			onClick: () => onChange?.(id, !enabled),
		},
		View(
			{
				style: {
					paddingBottom: Indent.XL.getValue(),
					borderBottomWidth: 1,
					borderBottomColor: divided ? Color.bgSeparatorSecondary.toHex() : null,
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
				},
			},
			Text2({
				text,
				testId: `${id}_text`,
				numberOfLines: 2,
				ellipsize: 'end',
				color: Color.base1,
				style: {
					flexShrink: 1,
					marginRight: Indent.XL.getValue(),
				},
			}),
			Switcher({
				testId: `${id}_switch`,
				size: SwitcherSize.L,
				mode: SwitcherMode.SOLID,
				checked: enabled,
				onClick: () => onChange?.(id, !enabled),
			}),
		),
	);

	module.exports = {
		ExtraSettings,
	};
});
