/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, tasks_v2_const) {
	'use strict';

	class ScrumManager {
		#params;
		#taskStatus;
		#isParentScrumTask;
		constructor(params) {
			this.#params = params;
		}
		isScrum(groupType) {
			return groupType === tasks_v2_const.GroupType.Scrum;
		}
		async handleDodDisplay() {
			const {
				TaskStatus
			} = await main_core.Runtime.loadExtension('tasks.scrum.task-status');
			this.#taskStatus ??= new TaskStatus({
				groupId: this.#params.groupId,
				parentTaskId: this.#params.parentId,
				taskId: this.#params.taskId,
				action: 'complete',
				performActionOnParentTask: true
			});
			this.#isParentScrumTask ??= await this.#taskStatus.isParentScrumTask(this.#params.parentId);
			if (!this.#isParentScrumTask) {
				try {
					await this.#taskStatus.showDod(this.#params.taskId);
					return true;
				} catch {
					return false;
				}
			}
			return true;
		}
		async handleParentState() {
			const {
				TaskStatus
			} = await main_core.Runtime.loadExtension('tasks.scrum.task-status');
			this.#taskStatus ??= new TaskStatus({
				groupId: this.#params.groupId,
				parentTaskId: this.#params.parentId,
				taskId: this.#params.taskId,
				action: 'complete',
				performActionOnParentTask: true
			});
			this.#isParentScrumTask ??= await this.#taskStatus.isParentScrumTask(this.#params.parentId);
			if (this.#isParentScrumTask) {
				void this.#taskStatus.update();
			}
		}
	}

	exports.ScrumManager = ScrumManager;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Tasks.V2.Const);
//# sourceMappingURL=scrum-manager.bundle.js.map
