import { ErrorsList } from './errors-list';

// @vue/component
export const ErrorsFields = {
	components: {
		ErrorsList,
	},
	props: {
		getGrid: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			systemLogErrorsRef: [],
			systemLogErrors: [],
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const errors = this.getGrid().querySelectorAll('[data-system-log-errors]');

			this.systemLogErrors = [...errors].map((systemLogErrorsNode: HTMLElement) => this.getSystemLogErrors(systemLogErrorsNode));

			await this.$nextTick();

			errors.forEach((systemLogErrorsNode: HTMLElement) => {
				const systemLogErrors = this.getSystemLogErrors(systemLogErrorsNode);
				systemLogErrorsNode.append(this.systemLogErrorsRef[systemLogErrors.rowId]);
			});
		},
		getSystemLogErrors(systemLogErrorsNode: HTMLElement): Object
		{
			const rowId = Number(systemLogErrorsNode.closest('[data-id]').dataset.id);
			const errors = systemLogErrorsNode.dataset.systemLogErrors;

			return {
				rowId,
				errors,
			};
		},
		setRef(element: HTMLElement, rowId: number): void
		{
			this.systemLogErrorsRef ??= {};
			this.systemLogErrorsRef[rowId] = element;
		},
	},
	template: `
		<template v-for="(systemErrors, id) in systemLogErrors" :key="id">
			<ErrorsList
				:ref="(el) => setRef(el?.$el, systemErrors.rowId)"
				:errors="systemErrors.errors"
			/>
		</template>
	`,
};
