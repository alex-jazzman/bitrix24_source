import { Dom, Text, Event, Runtime } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';

import './bottom-sheet.css';

export type SheetBindProps = {
	getBindElement: Function,
	getTargetContainer: Function,
};

// @vue/component
export const BottomSheet = {
	components: {
		Popup,
	},
	props: {
		sheetBindProps: {
			/** @type SheetBindProps */
			type: Object,
			required: true,
		},
		isExpanded: {
			type: Boolean,
			default: false,
		},
		padding: {
			type: Number,
			default: 24,
		},
		popupPadding: {
			type: Number,
			default: 24,
		},
		uniqueKey: {
			type: String,
			default: () => Text.getRandom(),
		},
		customClass: {
			type: String,
			default: '',
		},
	},
	emits: ['close'],
	computed: {
		popupOptions(): PopupOptions
		{
			const baseClass = 'b24-bottom-sheet';
			const expandedClass = this.isExpanded ? '--expanded' : '';
			const customClass = this.customClass || '';

			const className = [baseClass, expandedClass, customClass]
				.filter((name: string) => name !== '')
				.join(' ');

			return {
				id: `b24-bottom-sheet-${this.uniqueKey || 'default'}`,
				bindElement: this.sheetBindProps.getBindElement(),
				targetContainer: this.sheetBindProps.getTargetContainer(),
				className,
				borderRadius: '18px 18px 0 0',
				padding: this.popupPadding,
				animation: {
					showClassName: '--show',
					closeClassName: '--close',
					closeAnimationType: 'animation',
				},
				autoHide: false,
			};
		},
	},
	watch: {
		isExpanded(isExpanded: boolean): void
		{
			const popup = this.$refs.popup?.getPopupInstance();
			Dom.toggleClass(popup?.getPopupContainer(), '--expanded', isExpanded);
		},
	},
	created(): void
	{
		this.unfreezeDebounced = Runtime.debounce(this.unfreeze, 500, this);
	},
	mounted(): void
	{
		Event.EventEmitter.subscribe('BX.UI.Viewer.Controller:onBeforeShow', this.freeze);
		Event.EventEmitter.subscribe('BX.UI.Viewer.Controller:onClose', this.unfreezeDebounced);
	},
	beforeUnmount(): void
	{
		Event.EventEmitter.unsubscribe('BX.UI.Viewer.Controller:onBeforeShow', this.freeze);
		Event.EventEmitter.unsubscribe('BX.UI.Viewer.Controller:onClose', this.unfreezeDebounced);
	},
	methods: {
		freeze(): void
		{
			this.$refs.popup?.freeze();
		},
		unfreeze(): void
		{
			this.$refs.popup?.unfreeze();
		},
	},
	template: `
		<Popup ref="popup" :options="popupOptions" @close="$emit('close')">
			<div class="b24-bottom-sheet-content" :style="{ '--padding': padding + 'px' }">
				<slot/>
			</div>
		</Popup>
	`,
};
