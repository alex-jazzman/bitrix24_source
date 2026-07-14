/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, tasks_v2_core, tasks_v2_const, tasks_v2_lib_hint) {
	'use strict';

	class RelationError extends tasks_v2_lib_hint.Hint {
		#popupId = 'tasks-relation-error';
		#taskId;
		setTaskId(taskId) {
			this.#taskId = taskId;
			return this;
		}
		async showError(errorText, fieldId) {
			void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/setFieldFilled`, {
				id: this.#taskId,
				fieldName: fieldId
			});
			await new Promise(resolve => {
				setTimeout(() => resolve(), 0);
			});
			const scrollContainer = document.querySelector(`[data-task-card-scroll="${this.#taskId}"]`);
			const addButton = scrollContainer.querySelector(`[data-task-relation-add="${fieldId}"]`);
			const options = {
				id: this.#popupId,
				bindElement: addButton,
				content: errorText,
				maxWidth: 470,
				offsetLeft: addButton.offsetWidth / 2,
				targetContainer: scrollContainer
			};
			await super.showHint(options);
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const relationError = new RelationError();

	exports.relationError = relationError;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib);
//# sourceMappingURL=relation-error.bundle.js.map
