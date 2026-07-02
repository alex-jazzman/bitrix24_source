import { Dom, Event, Type } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';

import { BusySlot as BusySlotType, Model } from 'booking.const';

import { BusyPopup } from './busy-popup/busy-popup';
import './ui-busy-slot.css';

const BookingBusySlotClassName = 'booking-booking-busy-slot';

// @vue/component
export const UiBusySlot = {
	name: 'UiBusySlot',
	components: {
		BusyPopup,
	},
	props: {
		busySlot: {
			type: Object,
			required: true,
		},
		positionStyle: {
			type: Object,
			required: true,
		},
		isDisabled: {
			type: Boolean,
			default: false,
		},
		isVisible: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['click'],
	setup(): { BookingBusySlotClassName: string, BusySlotType: BusySlotType }
	{
		return {
			BookingBusySlotClassName,
			BusySlotType,
		};
	},
	data(): { isPopupShown: boolean }
	{
		return {
			isPopupShown: false,
		};
	},
	computed: {
		...mapGetters({
			isDragMode: `${Model.Interface}/isDragMode`,
		}),
	},
	methods: {
		onClick(): void
		{
			this.$emit('click');
		},
		onMouseEnter(): void
		{
			clearTimeout(this.showTimeout);
			this.showTimeout = setTimeout(() => this.showPopup(), 300);
			Event.unbind(document, 'mousemove', this.onMouseMove);
			Event.bind(document, 'mousemove', this.onMouseMove);
		},
		onMouseMove(event: MouseEvent): void
		{
			if (this.cursorInsideContainer(event.target))
			{
				this.updatePopup(event);
			}
			else
			{
				Event.unbind(document, 'mousemove', this.onMouseMove);
				this.closePopup();
			}
		},
		onMouseLeave(event: MouseEvent): void
		{
			if (event.relatedTarget?.closest('.popup-window')?.querySelector('.booking-booking-busy-popup'))
			{
				return;
			}

			Event.unbind(document, 'mousemove', this.onMouseMove);
			this.closePopup();
		},
		cursorInsideContainer(eventTarget: EventTarget | null): boolean
		{
			return !Type.isNull(eventTarget) && Dom.hasClass(eventTarget, this.BookingBusySlotClassName);
		},
		updatePopup(event: MouseEvent): void
		{
			const rect = this.$refs.container?.getBoundingClientRect();
			if (
				this.isDragMode
				|| !rect
				|| event.clientY > rect.top + rect.height
				|| event.clientY < rect.top
				|| event.clientX < rect.left
				|| event.clientX > rect.left + rect.width
			)
			{
				this.closePopup();

				return;
			}

			this.showTimeout ??= setTimeout(() => this.showPopup(), 300);
		},
		showPopup(): void
		{
			this.isPopupShown = true;
		},
		closePopup(): void
		{
			clearTimeout(this.showTimeout);
			this.showTimeout = null;
			this.isPopupShown = false;
		},
	},
	template: `
		<div
			v-if="isVisible"
			:class="[BookingBusySlotClassName, {
				'--disabled': isDisabled,
			}]"
			:style="{
				...positionStyle,
				'z-index': busySlot.type === BusySlotType.IntersectionOverbooking ? 2 : 1,
			}"
			data-element="ui-booking-busy-slot"
			:data-id="busySlot.resourceId"
			:data-from="busySlot.fromTs"
			:data-to="busySlot.toTs"
			ref="container"
			@click.stop="onClick"
			@mouseenter.stop="onMouseEnter"
			@mouseleave.stop="onMouseLeave"
		></div>
		<BusyPopup
			v-if="isPopupShown"
			:busySlot="busySlot"
			@close="closePopup"
		/>
	`,
};
