import { MessageField } from './message-field';
import type { Message } from './message-field';

// @vue/component
export const MessageFields = {
	components: {
		MessageField,
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
			systemLogMessageRef: [],
			systemLogMessage: [],
			activeHintRowId: null,
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const message = this.getGrid().querySelectorAll('[data-system-log-message]');

			this.systemLogMessage = [...message].map((systemLogMessageNode: HTMLElement) => this.getSystemLogMessage(systemLogMessageNode));

			await this.$nextTick();

			message.forEach((systemLogMessageNode: HTMLElement) => {
				const systemLogMessage = this.getSystemLogMessage(systemLogMessageNode);
				systemLogMessageNode.append(this.systemLogMessageRef[systemLogMessage.rowId]);
			});
		},
		getSystemLogMessage(systemLogMessageNode: HTMLElement): Message
		{
			const rowId = Number(systemLogMessageNode.closest('[data-id]').dataset.id);

			/** @type {{ message: ?string, link: ?string, errors: ?array }} */
			const message = JSON.parse(systemLogMessageNode.dataset.systemLogMessage);

			return {
				rowId,
				message: message.message,
				link: message.link,
				errors: message.errors,
			};
		},
		setRef(element: HTMLElement, rowId: number): void
		{
			this.systemLogMessageRef ??= {};
			this.systemLogMessageRef[rowId] = element;
		},
		onHintOpen(rowId: number): void
		{
			this.activeHintRowId = rowId;
		},
		onHintClose(rowId: number): void
		{
			if (this.activeHintRowId === rowId)
			{
				this.activeHintRowId = null;
			}
		},
	},
	template: `
		<template v-for="(message, id) in systemLogMessage" :key="id">
			<MessageField
				:ref="(el) => setRef(el?.$el, message.rowId)"
				:message="message"
				:activeHintRowId
				@hintOpen="onHintOpen"
				@hintClose="onHintClose"
			/>
		</template>
	`,
};
