/**
 * @module tasks/layout/checklist/list/src/toasts
 */
jn.define('tasks/layout/checklist/list/src/toasts', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { showToast } = require('toast');

	/** @type {Object|null} */
	let shownToast = null;

	/**
	 * @param {ChecklistToastParams} params
	 * @param {Object} layoutWidget
	 * @returns {Object}
	 */
	const showChecklistToastMap = (params, layoutWidget) => {
		shownToast?.close();
		shownToast = showToast(params, layoutWidget);

		return shownToast;
	};

	/**
	 * @param {ChecklistEmptyToastParams} params
	 * @returns {Object}
	 */
	const toastEmptyPersonalList = ({ layoutWidget, hideCompleted, lastActive }) => {
		Haptics.impactLight();

		const messageCode = hideCompleted ? 'NO_ITEM_IN_WORKS' : 'PERSONAL_TITLE';

		return showChecklistToastMap({
			message: Loc.getMessage(`TASKSMOBILE_LAYOUT_CHECKLIST_EMPTY_SCREEN_${messageCode}`),
			layoutWidget,
		}, layoutWidget);
	};

	/**
	 * @param {ChecklistMovedToastParams} params
	 * @returns {Object}
	 */
	const toastMovedItem = ({ layoutWidget, onButtonTap }) => showChecklistToastMap({
		onButtonTap,
		message: Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_ITEM_MOVED'),
		buttonText: Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_REDIRECT'),
	}, layoutWidget);

	/**
	 * @param {ChecklistNoRightsToastParams} options
	 * @returns {void}
	 */
	const toastNoRights = ({ layoutWidget, params }) => {
		Haptics.notifyWarning();
		showChecklistToastMap({
			message: Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_NO_RIGHTS'),
			iconName: Icon.LOCK.getIconName(),
			...params,
		}, layoutWidget);
	};

	module.exports = {
		toastMovedItem,
		toastNoRights,
		toastEmptyPersonalList,
	};
});
