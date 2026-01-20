/**
 * @module tasks/layout/fields/deadline
 */
jn.define('tasks/layout/fields/deadline', (require, exports, module) => {
	const { DateTimeFieldClass } = require('layout/ui/fields/datetime');
	const { DeadlinePicker } = require('tasks/deadline-picker');
	const { DeadlineRestrictions } = require('tasks/deadline-picker/deadline-restrictions');
	const { Type } = require('type');

	/**
	 * @class DeadlineField
	 */
	class DeadlineField extends DateTimeFieldClass
	{
		showTitle()
		{
			return BX.prop.getBoolean(this.props, 'showTitle', false);
		}

		getDefaultReadOnlyEmptyValue()
		{
			return BX.message('TASKS_FIELDS_DEADLINE_FIELD_EMPTY_VALUE');
		}

		getDefaultEmptyEditableValue()
		{
			return BX.message('TASKS_FIELDS_DEADLINE_FIELD_EMPTY_VALUE');
		}

		getDeadlineChangesLeft()
		{
			return BX.prop.getNumber(this.props, 'deadlineChangesLeft', null);
		}

		getTask()
		{
			return BX.prop.getObject(this.props, 'task');
		}

		isReadOnly()
		{
			return BX.prop.getBoolean(this.props, 'readOnly', false);
		}

		canUpdateDeadline()
		{
			return BX.prop.getBoolean(this.props, 'updateDeadline', true);
		}

		prepareSingleValue(value)
		{
			if (Type.isObject(value))
			{
				return value.deadline;
			}

			return value;
		}

		handleAdditionalFocusActions()
		{
			const currentDeadline = (this.getValue() ? this.getValue() * 1000 : null);
			const pickerParams = {
				canSetNoDeadline: true,
				parentWidget: this.getParentWidget(),
				task: this.getTask(),
			};

			(new DeadlinePicker(pickerParams))
				.checkCanOpen()
				.then((datePicker) => datePicker.show({
					deadline: currentDeadline,
				}))
				.then(({ deadline, reason }) => {
					this.removeFocus()
						.then(() => (deadline === currentDeadline ? Promise.resolve() : this.onBeforeHandleChange()))
						.then(() => {
							const timeInSeconds = DeadlineField.getTimeInSeconds(deadline);
							const timeWith00Seconds = timeInSeconds - (timeInSeconds % 60);

							this.handleChange({ deadline: timeWith00Seconds, reason });
						})
						.catch(console.error)
					;
				})
				.catch((error) => {
					this.removeFocus();

					if (error)
					{
						console.error(error);
					}
				})
			;

			return Promise.resolve();
		}

		/**
		 * @return {boolean}
		 */
		getCustomContentClickHandler()
		{
			if (this.isReadOnly())
			{
				DeadlineRestrictions.showCompleteRestrictionToast({
					layout: this.getParentWidget(),
				});
			}

			return true;
		}
	}

	DeadlineField.propTypes = {
		...DateTimeFieldClass.propTypes,
	};

	DeadlineField.defaultProps = {
		...DateTimeFieldClass.defaultProps,
		showTitle: false,
	};

	module.exports = {
		DeadlineField,
	};
});
