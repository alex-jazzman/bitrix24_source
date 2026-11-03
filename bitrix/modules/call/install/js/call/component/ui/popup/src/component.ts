import { defineComponent } from 'ui.vue3';

import { Popup as UiPopup } from 'ui.vue3.components.popup';

export type CallPopupTarget = Element | Event | { $el?: Element } | Array<{ $el?: Element } | Element> | null | undefined;

export interface CallPopupAngle
{
	position?: 'top' | 'bottom' | 'left' | 'right';
	offset?: number;
}

export interface CallPopupBindOptions
{
	position?: 'top' | 'bottom' | 'left' | 'right';
	forceBindPosition?: boolean;
}

export type CallPopupOptions = Record<string, unknown>;

const resolveElement = (target: CallPopupTarget): HTMLElement | null =>
{
	if (!target)
	{
		return null;
	}

	if (Array.isArray(target))
	{
		return target.length > 0 ? resolveElement(target[0]) : null;
	}

	if (target instanceof Event)
	{
		const node = (target.currentTarget ?? target.target) as Element | null;

		return node instanceof HTMLElement ? node : null;
	}

	if (target instanceof HTMLElement)
	{
		return target;
	}

	const candidate = (target as { $el?: unknown }).$el;

	return candidate instanceof HTMLElement ? candidate : null;
};

export const CallPopup = defineComponent({
	name: 'CallPopup',
	components: { UiPopup },
	props: {
		open: {
			type: Boolean,
			default: false,
		},
		bindElement: {
			type: HTMLElement,
			default: null,
		},
		bindOptions: {
			type: Object,
			default: (): CallPopupBindOptions => ({ position: 'top', forceBindPosition: true }),
		},
		offsetTop: {
			type: Number,
			default: 0,
		},
		offsetLeft: {
			type: Number,
			default: 20,
		},
		angle: {
			type: [Object, Boolean],
			default: (): CallPopupAngle => ({ position: 'bottom' }),
		},
		background: {
			type: String,
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
	emits: ['update:open', 'hidden'],
	data(): { internalOpen: boolean; internalBindElement: HTMLElement | null }
	{
		return {
			internalOpen: this.open,
			internalBindElement: this.bindElement,
		};
	},
	computed: {
		isOpen(): boolean
		{
			return this.internalOpen && this.internalBindElement !== null;
		},
		popupOptions(): CallPopupOptions
		{
			const base: CallPopupOptions = {
				bindElement: this.internalBindElement,
				bindOptions: this.bindOptions,
				offsetTop: this.offsetTop,
				offsetLeft: this.offsetLeft,
				angle: this.angle,
			};

			if (this.className !== null)
			{
				base.className = this.className;
			}

			if (this.background !== null)
			{
				base.background = this.background;
			}

			return this.options === null ? base : { ...base, ...this.options };
		},
	},
	watch: {
		open(value: boolean): void
		{
			if (value === this.internalOpen)
			{
				return;
			}

			this.internalOpen = value;

			if (!value)
			{
				this.internalBindElement = null;
			}
		},
		bindElement(value: HTMLElement | null): void
		{
			this.internalBindElement = value;
		},
	},
	methods: {
		show(target?: CallPopupTarget): void
		{
			const element = resolveElement(target) ?? this.internalBindElement;

			if (element === null)
			{
				return;
			}

			this.internalBindElement = element;
			this.setOpen(true);

			this.$nextTick(() =>
			{
				(this.$refs.popup as { adjustPosition: () => void } | undefined)?.adjustPosition();
			});
		},
		hide(): void
		{
			if (!this.internalOpen)
			{
				return;
			}

			this.setOpen(false);
			this.internalBindElement = null;
			this.$emit('hidden');
		},
		toggle(target?: CallPopupTarget): void
		{
			if (this.internalOpen)
			{
				this.hide();

				return;
			}

			this.show(target);
		},
		setOpen(value: boolean): void
		{
			this.internalOpen = value;
			this.$emit('update:open', value);
		},
	},
	template: /* HTML */`
		<UiPopup ref="popup" v-if="isOpen" :options="popupOptions" @close="hide">
			<template #default="{ freeze, unfreeze }">
				<slot :freeze="freeze" :unfreeze="unfreeze" />
			</template>
		</UiPopup>
	`,
});
