import { defineComponent } from 'ui.vue3';

import { CallModal } from 'call.component.ui.modal';

import type { LocFunction } from 'call.plugin.loc';

import './css/modal.css';

export const CallConfirmModal = defineComponent({
	name: 'CallConfirmModal',
	components: { CallModal },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	props: {
		visible: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: '',
		},
		message: {
			type: String,
			default: '',
		},
		yesButtonText: {
			type: String,
			default: '',
		},
		noButtonText: {
			type: String,
			default: '',
		},
		targetContainer: {
			type: [HTMLElement, String],
			default: null,
		},
	},
	emits: ['update:visible', 'yes', 'no', 'close'],
	computed: {
		hasYesButton(): boolean
		{
			return this.yesButtonText.length > 0;
		},
		hasNoButton(): boolean
		{
			return this.noButtonText.length > 0;
		},
	},
	methods: {
		onUpdateVisible(value: boolean): void
		{
			this.$emit('update:visible', value);
		},
		onYes(close: () => void): void
		{
			this.$emit('yes');
			close();
		},
		onNo(close: () => void): void
		{
			this.$emit('no');
			close();
		},
		onClose(): void
		{
			this.$emit('close');
		},
	},
	template: /* HTML */`
		<CallModal
			:visible="visible"
			:title="title || null"
			:targetContainer="targetContainer"
			:closeByEsc="false"
			@update:visible="onUpdateVisible"
			@close="onClose"
		>
			<template #default>
				<div v-if="message" class="call-confirm-modal__message" data-testid="call-confirm-modal-message">
					{{ message }}
				</div>
			</template>
			<template v-if="hasYesButton || hasNoButton" #footer="{ close }">
				<button
					v-if="hasYesButton"
					type="button"
					class="call-confirm-modal__button --yes"
					data-testid="call-confirm-modal-button-yes"
					@click="onYes(close)"
				>
					{{ yesButtonText }}
				</button>
				<button
					v-if="hasNoButton"
					type="button"
					class="call-confirm-modal__button --no"
					data-testid="call-confirm-modal-button-no"
					@click="onNo(close)"
				>
					{{ noButtonText }}
				</button>
			</template>
		</CallModal>
	`,
});
