/**
 * @module tasks/deadline-picker/deadline-restrictions
 */
jn.define('tasks/deadline-picker/deadline-restrictions', (require, exports, module) => {
	const { AccessToast } = require('tasks/layout/task/view-new/services/access-toast');
	const { Icon } = require('assets/icons');
	const { TaskActionAccess } = require('tasks/enum');
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { showToast } = require('toast');
	const { Haptics } = require('haptics');
	const { Moment } = require('utils/date');
	const { dayMonth, longDate } = require('utils/date/formats');
	const { selectIsCreator } = require('tasks/statemanager/redux/slices/tasks');

	const RestrictionToastCodes = {
		COMPLETE: TaskActionAccess.UPDATE_DEADLINE,
		BY_MAX_CHANGES: TaskActionAccess.UPDATE_DEADLINE_BY_MAX_CHANGES,
		BY_MAX_DATE: TaskActionAccess.UPDATE_DEADLINE_BY_MAX_DATE,
	};

	/**
	 * Pure validation class for deadline-related restriction checks.
	 * Can be used independently for any deadline validation scenarios.
	 */
	class DeadlineRestrictions
	{
		/**
		 * @public
		 * @param {object} [layout=PageManager]
		 */
		static showByQuantityRestrictionToast({ layout = PageManager } = {})
		{
			new AccessToast({
				iconName: Icon.ALERT_ACCENT.getIconName(),
				layout,
			})
				.showByAccess(TaskActionAccess.UPDATE_DEADLINE_BY_MAX_CHANGES);
		}

		/**
		 * @public
		 * @param {object} [layout=PageManager]
		 */
		static showCompleteRestrictionToast({ layout = PageManager } = {})
		{
			new AccessToast({
				iconName: Icon.ALERT_ACCENT.getIconName(),
				layout,
				locSuffix: '_MSGVER_1',
			})
				.showByAccess(TaskActionAccess.UPDATE_DEADLINE);
		}

		/**
		 * @public
		 * @param {number} [maxDeadlineChangeDate]
		 * @param {object} [layout=PageManager]
		 */
		static showMaxDateRestrictionToast({ maxDeadlineChangeDate, layout = PageManager } = {})
		{
			const moment = new Moment(maxDeadlineChangeDate);
			const format = moment.withinYear ? dayMonth() : longDate();

			Haptics.notifyWarning();
			showToast({
				message: Loc.getMessage(
					'TASKSMOBILE_DEADLINE_PICKER_RESTRICTED_BY_DATE',
					{ '#DATE#': (new Moment(maxDeadlineChangeDate)).format(format) },
				),
				iconName: Icon.ALERT_ACCENT.getIconName(),
			}, layout);
		}

		/**
		 * @param {Object} options
		 * @param {Object} options.task
		 * @param {Object} options.task.id
		 * @param {number|null} options.task.deadlineChangesLeft
		 * @param {boolean} options.task.requireDeadlineChangeReason
		 * @param {number|null} options.task.maxDeadlineChangeDate
		 * @param {boolean} options.task.canUpdate
		 * @param {boolean} options.task.canUpdateDeadline
		 */
		constructor(options = {})
		{
			this.task = options.task;

			/**
			 * @private
			 */
			this.hasNoLimitations = null;
		}

		/**
		 * @public
		 * @param {object} value
		 */
		updateTask(value)
		{
			this.task = value;
			this.hasNoLimitations = null;
		}

		/**
		 * @public
		 * @returns {{isReadOnly: boolean, toastCode: null}|{isReadOnly: boolean, toastCode: string}}
		 */
		isReadOnly()
		{
			if (!this.task || this.canChangeDeadlineWithoutLimitation())
			{
				return {
					isReadOnly: false,
					toastCode: null,
				};
			}

			if (this.isDeadlineRestrictedCompletely())
			{
				return {
					isReadOnly: true,
					toastCode: RestrictionToastCodes.COMPLETE,
				};
			}

			if (this.isDeadlineRestrictedByQuantity())
			{
				return {
					isReadOnly: true,
					toastCode: RestrictionToastCodes.BY_MAX_CHANGES,
				};
			}

			return {
				isReadOnly: false,
				toastCode: null,
			};
		}

		/**
		 * @returns {boolean}
		 */
		canChangeDeadlineWithoutLimitation()
		{
			if (this.hasNoLimitations !== null)
			{
				return this.hasNoLimitations;
			}

			if (!this.task)
			{
				return true;
			}

			this.hasNoLimitations = this.task.canUpdate || selectIsCreator(this.task) || env.isAdmin;

			return this.hasNoLimitations;
		}

		/**
		 * @public
		 * @param {string} [toastCode]
		 * @param {object} [layout=PageManager]
		 */
		showToastByCode({ toastCode, layout = PageManager } = {})
		{
			switch (toastCode)
			{
				case RestrictionToastCodes.BY_MAX_CHANGES:
					DeadlineRestrictions.showByQuantityRestrictionToast({ layout });
					break;

				case RestrictionToastCodes.COMPLETE:
					DeadlineRestrictions.showCompleteRestrictionToast({ layout });
					break;

				case RestrictionToastCodes.BY_MAX_DATE:
					DeadlineRestrictions.showMaxDateRestrictionToast({
						maxDeadlineChangeDate: this.task.maxDeadlineChangeDate,
						layout,
					});

					break;

				default:
			}
		}

		/**
		 * @returns {boolean}
		 */
		isDeadlineRestrictedCompletely()
		{
			if (this.canChangeDeadlineWithoutLimitation())
			{
				return false;
			}

			return this.task?.canUpdateDeadline === false;
		}

		/**
		 * @returns {boolean}
		 */
		isDeadlineRestrictedByQuantity()
		{
			if (this.canChangeDeadlineWithoutLimitation())
			{
				return false;
			}

			return Type.isNumber(this.task?.deadlineChangesLeft) && this.task.deadlineChangesLeft <= 0;
		}

		/**
		 * @param {number} deadline
		 * @returns {boolean}
		 */
		isDeadlineRestrictedByMaxDate(deadline)
		{
			if (!this.hasMaxDateRestriction())
			{
				return false;
			}

			return deadline > this.task?.maxDeadlineChangeDate;
		}

		/**
		 * @returns {boolean}
		 */
		hasMaxDateRestriction()
		{
			if (this.canChangeDeadlineWithoutLimitation())
			{
				return false;
			}

			return Type.isNumber(this.task?.maxDeadlineChangeDate) && this.task.maxDeadlineChangeDate > 0;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isReasonRequired()
		{
			if (this.canChangeDeadlineWithoutLimitation())
			{
				return false;
			}

			return Boolean(this.task?.requireDeadlineChangeReason);
		}
	}

	module.exports = {
		DeadlineRestrictions,
		RestrictionToastCodes,
	};
});
