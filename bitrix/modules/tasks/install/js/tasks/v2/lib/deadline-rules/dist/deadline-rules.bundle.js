/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, tasks_v2_const, tasks_v2_core, tasks_v2_lib_idUtils, tasks_v2_provider_service_deadlineService, tasks_v2_provider_service_taskService) {
	'use strict';

	const DeadlineSaveStatus = Object.freeze({
		Saved: 'saved',
		Failed: 'failed',
		Skipped: 'skipped',
		ReasonRequired: 'reasonRequired'
	});
	class DeadlineRules {
		canChange(taskId) {
			const task = this.#getTask(taskId);
			if (!task?.rights.deadline) {
				return false;
			}
			return !this.isChangeCountExceeded(taskId);
		}
		isChangeCountExceeded(taskId) {
			const task = this.#getTask(taskId);
			if (!task || tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) || this.canChangeWithoutLimitation(taskId) || !task.maxDeadlineChanges) {
				return false;
			}
			return task.deadlineChangeCount >= task.maxDeadlineChanges;
		}
		requiresChangeReason(taskId) {
			const task = this.#getTask(taskId);
			if (!task?.requireDeadlineChangeReason) {
				return false;
			}
			return !this.canChangeWithoutLimitation(taskId);
		}
		canChangeWithoutLimitation(taskId) {
			const task = this.#getTask(taskId);
			const isCreator = tasks_v2_core.Core.getParams().currentUser.id === task?.creatorId;
			return !tasks_v2_lib_idUtils.idUtils.isReal(taskId) || isCreator || task?.rights.edit || tasks_v2_core.Core.getParams().rights.user.admin;
		}
		hasRepeatRule(taskId) {
			return tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) && main_core.Type.isObject(this.#getTask(taskId)?.replicateParams || null);
		}
		getCurrentDeadline(taskId) {
			const task = this.#getTask(taskId);
			if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
				return task?.deadlineTs;
			}

			// The DEADLINE_AFTER column cannot hold an empty value — the ORM reads NULL back as 0 —
			// so a repeat rule keeps its own offset, where "no deadline" and "on the creation day"
			// stay distinct.
			if (this.hasRepeatRule(taskId)) {
				const deadlineOffset = task.replicateParams.deadlineOffset;
				return main_core.Type.isNumber(deadlineOffset) ? deadlineOffset * 1000 : null;
			}
			return task?.deadlineAfter;
		}
		async saveDeadline(taskId, {
			deadlineTs,
			changeReason = '',
			deadlineManuallySet
		}) {
			if (this.requiresChangeReason(taskId) && changeReason.trim() === '') {
				return {
					status: DeadlineSaveStatus.ReasonRequired,
					errors: null
				};
			}
			let status = DeadlineSaveStatus.Skipped;
			let errors = null;
			if (this.#hasDeadlineToSave(taskId, deadlineTs)) {
				errors = await this.#setDeadline(taskId, deadlineTs, changeReason, deadlineManuallySet);
				status = this.#resolveSaveStatus(errors);
				if (status === DeadlineSaveStatus.Saved) {
					this.#spendDeadlineChange(taskId);
				}
			}
			return {
				status,
				errors
			};
		}
		async clearDeadline(taskId, {
			changeReason = '',
			deadlineManuallySet
		} = {}) {
			if (this.requiresChangeReason(taskId) && changeReason.trim() === '') {
				return {
					status: DeadlineSaveStatus.ReasonRequired,
					errors: null
				};
			}

			// Under a repeat rule 0 is the "on the creation day" offset, so an empty deadline
			// is null there; everywhere else it stays the legacy zero.
			const emptyDeadline = this.hasRepeatRule(taskId) ? null : 0;
			const errors = await this.#setDeadline(taskId, emptyDeadline, changeReason, deadlineManuallySet);
			return {
				status: this.#resolveSaveStatus(errors),
				errors
			};
		}

		// A template offset of 0 ("on the creation day") is a real value, not an empty deadline, so a
		// falsy check would drop it: for a template any actual change goes through, including a switch
		// back to "no deadline". A task keeps the legacy rule, where an empty value is saved only by
		// clearDeadline() — and an unchanged deadline is never saved, so it spends no deadline change.
		#hasDeadlineToSave(taskId, deadlineTs) {
			if (deadlineTs === this.getCurrentDeadline(taskId)) {
				return false;
			}
			return tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) || Boolean(deadlineTs);
		}
		#resolveSaveStatus(errors) {
			return errors?.length ? DeadlineSaveStatus.Failed : DeadlineSaveStatus.Saved;
		}
		#spendDeadlineChange(taskId) {
			const task = this.#getTask(taskId);
			if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) && !this.canChangeWithoutLimitation(taskId) && task?.maxDeadlineChanges) {
				void tasks_v2_provider_service_deadlineService.deadlineService.updateDeadlineChangeCount(task.id);
			}
		}
		async #setDeadline(taskId, deadlineTs, changeReason, deadlineManuallySet) {
			if (tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
				const fields = {
					deadlineAfter: deadlineTs
				};

				// The offset lives in the repeat rule, so it has to travel with the update —
				// otherwise the rule keeps the previous value and the field reverts on reread.
				if (this.hasRepeatRule(taskId)) {
					fields.replicateParams = {
						...this.#getTask(taskId).replicateParams,
						deadlineOffset: main_core.Type.isNumber(deadlineTs) ? deadlineTs / 1000 : null
					};
				}
				await tasks_v2_provider_service_taskService.taskService.update(taskId, fields);
				return null;
			}
			tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
			const fields = {
				deadlineTs,
				deadlineChangeReason: changeReason
			};
			if (deadlineManuallySet !== undefined) {
				fields.deadlineManuallySet = deadlineManuallySet;
			}
			const result = await tasks_v2_provider_service_taskService.taskService.update(taskId, fields);
			tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
			return result[tasks_v2_const.Endpoint.TaskDeadlineUpdate] ?? null;
		}
		#getTask(taskId) {
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
		}
	}
	const deadlineRules = new DeadlineRules();

	exports.DeadlineRules = DeadlineRules;
	exports.DeadlineSaveStatus = DeadlineSaveStatus;
	exports.deadlineRules = deadlineRules;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=deadline-rules.bundle.js.map
