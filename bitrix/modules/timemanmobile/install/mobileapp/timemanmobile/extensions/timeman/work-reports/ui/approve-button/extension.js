/**
 * @module timeman/work-reports/ui/approve-button
 */
jn.define('timeman/work-reports/ui/approve-button', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const { IconView } = require('ui-system/blocks/icon');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { createTestIdGenerator } = require('utils/test');
	const { showToast } = require('toast');
	const { Loc } = require('timeman/work-reports/loc');
	const { MarkEnum } = require('timeman/work-reports/enum');

	const DEFAULT_ICON_SIZE = 24;
	const MARK_MENU_SECTION_ID = 'mark';

	const APPROVED_OPTION = {
		id: 'mark-approved',
		state: MarkEnum.State.APPROVED,
		decisionIcon: Icon.SOLID_LIKE,
		menuIcon: Icon.LIKE,
		messageId: 'M_TIMEMAN_WORK_REPORTS_APPROVE_MENU_APPROVED',
	};

	const DISAPPROVED_OPTION = {
		id: 'mark-disapproved',
		state: MarkEnum.State.DISAPPROVED,
		decisionIcon: Icon.SOLID_DISIKE,
		menuIcon: Icon.DISLIKE,
		messageId: 'M_TIMEMAN_WORK_REPORTS_APPROVE_MENU_DISAPPROVED',
	};

	// A report without a decision shows the like of an approved one, only unfilled; the menu item that
	// drops the decision carries no icon of its own.
	const NONE_OPTION = {
		id: 'mark-none',
		state: MarkEnum.State.NONE,
		decisionIcon: Icon.LIKE,
		messageId: 'M_TIMEMAN_WORK_REPORTS_APPROVE_MENU_NONE',
	};

	const MARK_OPTIONS = [APPROVED_OPTION, DISAPPROVED_OPTION, NONE_OPTION];

	const getMarkOption = (state) => MARK_OPTIONS.find((option) => option.state === state) ?? NONE_OPTION;

	/**
	 * @param {{
	 *   getTestId: (suffix: string) => string,
	 *   state: MarkStateValue,
	 *   onChange?: (nextState: MarkStateValue) => void,
	 * }} params
	 * @returns {PopupMenuActionItem[]}
	 */
	const getMarkMenuActions = ({ getTestId, state, onChange }) => MARK_OPTIONS.map((option) => ({
		id: option.id,
		testId: getTestId(`menu-${option.id}`),
		title: Loc.getMessage(option.messageId),
		icon: option.menuIcon,
		checked: option.state === state,
		sectionCode: MARK_MENU_SECTION_ID,
		onItemSelected: () => {
			// The decision already made has nothing to write: it would send the very same mark again.
			if (option.state !== state)
			{
				onChange?.(option.state);
			}
		},
	}));

	/**
	 * @param {{
	 *   getTestId: (suffix: string) => string,
	 *   state: MarkStateValue,
	 *   onChange?: (nextState: MarkStateValue) => void,
	 *   target: TargetRef,
	 * }} params
	 */
	const openMarkMenu = ({ getTestId, state, onChange, target }) => {
		// A fresh menu per tap: an instance cached by cacheId is shared by every row and would keep the
		// target, the checked mark and the handlers of the report it was last opened from.
		new PopupMenu({
			items: getMarkMenuActions({ getTestId, state, onChange }),
			sections: [
				{
					id: MARK_MENU_SECTION_ID,
					title: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_APPROVE_MENU_TITLE'),
				},
			],
		}).show({ target });
	};

	/**
	 * @param {ApproveButtonProps} props
	 */
	const ApproveButton = ({ testId, size = DEFAULT_ICON_SIZE, state, onChange, userId, markMenuTarget }) => {
		if (!userId)
		{
			return null;
		}

		const getTestId = createTestIdGenerator({ prefix: testId });
		const option = getMarkOption(state);
		const iconProps = {
			testId: getTestId(option.id),
			icon: option.decisionIcon,
			size,
		};

		if (Number(userId) === Number(env.userId))
		{
			return IconView({
				...iconProps,
				disabled: true,
				onClick: () => {
					showToast({ message: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_APPROVE_SELF_TOAST') });
				},
			});
		}

		// The menu stands at the icon it was opened from: in a list of reports the target names the report.
		// The holder belongs to the caller: this function runs anew on every rerender of the screen it sits
		// on, while forwardRef fires once, at mount, so a local variable would hold the icon of the first
		// render only.
		const menuTarget = markMenuTarget ?? { current: null };

		return IconView({
			...iconProps,
			color: option.state === MarkEnum.State.NONE ? Color.base3 : Color.accentMainPrimary,
			forwardRef: (ref) => {
				menuTarget.current = ref;
			},
			onClick: () => {
				openMarkMenu({
					getTestId,
					state: option.state,
					onChange,
					target: menuTarget.current,
				});
			},
		});
	};

	module.exports = { ApproveButton };
});
