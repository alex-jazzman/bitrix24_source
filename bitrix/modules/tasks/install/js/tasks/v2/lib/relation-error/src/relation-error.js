import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.lib.hint';

class RelationError extends Hint
{
	#popupId: string = 'tasks-relation-error';
	#taskId: number | string;

	setTaskId(taskId: number | string): RelationError
	{
		this.#taskId = taskId;

		return this;
	}

	async showError(errorText: string, fieldId: string): Promise<void>
	{
		void this.$store.dispatch(`${Model.Tasks}/setFieldFilled`, {
			id: this.#taskId,
			fieldName: fieldId,
		});

		await new Promise((resolve) => {
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
			targetContainer: scrollContainer,
		};

		await super.showHint(options);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const relationError = new RelationError();
