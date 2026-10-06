import { Popup, PopupManager } from 'main.popup';
import { Type } from 'main.core';
import { markRaw } from 'ui.vue3';

import type { JsonObject } from 'main.core';

const POPUP_CONTAINER_PREFIX = '#popup-window-content-';
const POPUP_BORDER_RADIUS = '10px';

// @vue/component
export const CallPopupContainer = {
	name: 'CallPopupContainer',
	props:
	{
		id: {
			type: String,
			required: true,
		},
		config: {
			type: Object,
			required: false,
			default() {
				return {};
			},
		},
	},
	emits: ['close', 'popup-instance-created'],
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		popupContainer(): string
		{
			return `${POPUP_CONTAINER_PREFIX}${this.id}`;
		},
	},
	created()
	{
		this.instance = null;
		this.instance = this.getPopupInstance();
		this.instance.show();
	},
	mounted()
	{
		this.instance.adjustPosition({
			forceBindPosition: true,
			position: this.getPopupConfig().bindOptions.position,
		});

		this.$emit('popup-instance-created', this.instance);
	},
	beforeUnmount()
	{
		if (!this.instance)
		{
			return;
		}

		this.closePopup();
	},
	methods:
	{
		getPopupInstance(): Popup
		{
			if (!this.instance)
			{
				PopupManager.getPopupById(this.id)?.destroy();

				// markRaw prevents Vue from wrapping the Popup instance in a reactive Proxy.
				// The Popup class relies on private fields (#focusTrap, etc.) that are not
				// accessible through a Proxy and throw "Private element is not present on this object".
				this.instance = markRaw(new Popup(this.getPopupConfig()));
			}

			return this.instance;
		},
		getDefaultConfig()
		{
			return {
				id: this.id,
				bindOptions: {
					position: 'bottom',
				},
				offsetTop: 0,
				offsetLeft: 0,
				className: 'bx-call__scope',
				cacheable: false,
				closeIcon: false,
				autoHide: true,
				closeByEsc: true,
				animation: 'fading',
				events: {
					onPopupClose: this.closePopup.bind(this),
					onPopupDestroy: this.closePopup.bind(this),
				},
				contentBorderRadius: POPUP_BORDER_RADIUS,
			};
		},
		getPopupConfig(): Object
		{
			const defaultConfig = this.getDefaultConfig();
			const { className = '', offsetTop = defaultConfig.offsetTop, bindOptions = {} } = this.config;

			const combinedClassName = `${defaultConfig.className} ${className}`.trim();
			const adjustedOffsetTop = (bindOptions.position === 'top' && Type.isNumber(offsetTop))
				? offsetTop - 10
				: offsetTop;

			return {
				...defaultConfig,
				...this.config,
				className: combinedClassName,
				offsetTop: adjustedOffsetTop,
			};
		},
		closePopup()
		{
			if (!this.instance)
			{
				return;
			}

			const instance = this.instance;
			this.instance = null;
			this.$emit('close');
			instance.destroy();
		},
		enableAutoHide()
		{
			this.getPopupInstance().setAutoHide(true);
		},
		disableAutoHide()
		{
			this.getPopupInstance().setAutoHide(false);
		},
		adjustPosition()
		{
			this.getPopupInstance().adjustPosition({
				forceBindPosition: true,
				position: this.getPopupConfig().bindOptions.position,
			});
		},
	},
	template: `
		<Teleport :to="popupContainer">
			<slot
				:adjustPosition="adjustPosition"
				:enableAutoHide="enableAutoHide"
				:disableAutoHide="disableAutoHide"
			></slot>
		</Teleport>
	`,
};
