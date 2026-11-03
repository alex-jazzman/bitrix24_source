import { Text } from 'main.core';
import { defineComponent } from 'ui.vue3';
import { Popup as UiPopup } from 'ui.vue3.components.popup';

import { CallIcon } from 'call.component.ui.icon';

import './css/modal.css';

export type CallModalOptions = Record<string, unknown>;

export const CallModal = defineComponent({
	name: 'CallModal',
	components: { UiPopup, CallIcon },
	props: {
		id: {
			type: String,
			default: (): string => `call-modal-${Text.getRandom()}`,
		},
		visible: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: null,
		},
		width: {
			type: Number,
			default: 420,
		},
		maxWidth: {
			type: Number,
			default: 420,
		},
		closeByEsc: {
			type: Boolean,
			default: true,
		},
		closable: {
			type: Boolean,
			default: true,
		},
		dismissableMask: {
			type: Boolean,
			default: false,
		},
		targetContainer: {
			type: [HTMLElement, String],
			default: null,
		},
		className: {
			type: String,
			default: null,
		},
		options: {
			type: Object,
			default: null,
		},
	},
	emits: ['update:visible', 'close'],
	data(): { internalVisible: boolean }
	{
		return {
			internalVisible: this.visible,
		};
	},
	computed: {
		popupOptions(): CallModalOptions
		{
			return {
				bindElement: null,
				overlay: { opacity: 20 },
				width: this.width,
				maxWidth: this.maxWidth,
				closeByEsc: this.closeByEsc,
				closeIcon: false,
				autoHide: this.dismissableMask,
				targetContainer: this.targetContainer,
				className: this.className,
				darkMode: true,
				contentBackground: '#22272B',
				contentBorderRadius: '10px',
				contentNoPaddings: true,
				animation: 'fading',
				cacheable: false,
				...(this.options ?? {}),
			};
		},
	},
	watch: {
		visible(value: boolean): void
		{
			if (value !== this.internalVisible)
			{
				this.internalVisible = value;
			}
		},
	},
	methods: {
		show(): void
		{
			this.setVisible(true);
		},
		hide(): void
		{
			this.setVisible(false);
		},
		toggle(): void
		{
			this.setVisible(!this.internalVisible);
		},
		close(): void
		{
			this.setVisible(false);
		},
		setVisible(value: boolean): void
		{
			if (value === this.internalVisible)
			{
				return;
			}

			this.internalVisible = value;
			this.$emit('update:visible', value);
		},
		onClose(): void
		{
			const wasVisible = this.internalVisible;

			this.setVisible(false);

			if (wasVisible)
			{
				this.$emit('close');
			}
		},
	},
	template: /* HTML */`
		<UiPopup v-if="internalVisible" ref="popup" :id="id" :options="popupOptions" @close="onClose">
			<template #default="{ freeze, unfreeze }">
				<div class="call-modal__content">
					<button
						v-if="closable"
						type="button"
						class="call-modal__close"
						data-testid="call-modal-close"
						:aria-label="'Close'"
						@click="close"
					>
						<CallIcon icon="cross" :size="16" color="white" />
					</button>
					<div v-if="title || $slots.header" class="call-modal__header">
						<slot name="header">{{ title }}</slot>
					</div>
					<div class="call-modal__body">
						<slot :close="close" :freeze="freeze" :unfreeze="unfreeze"></slot>
					</div>
					<div v-if="$slots.footer" class="call-modal__footer">
						<slot name="footer" :close="close"></slot>
					</div>
				</div>
			</template>
		</UiPopup>
	`,
});
