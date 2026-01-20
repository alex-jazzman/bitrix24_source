import { BMenu, type MenuOptions } from 'ui.vue3.components.menu';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Actions } from 'ui.icon-set.api.core';
import 'ui.icon-set.actions';
import 'ui.icon-set.outline';

import { LimitFeatureId, Model } from 'booking.const';
import { limit } from 'booking.lib.limit';

import './label.css';

export type Item = {
	name: string,
	value: number,
};

// @vue/component
export const LabelDropdown = {
	components: {
		BIcon,
		BMenu,
	},
	props: {
		value: {
			type: Number,
			required: true,
		},
		/** @type Item[] */
		items: {
			type: Array,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			Actions,
			Outline,
		};
	},
	data(): { isMenuShown: boolean }
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		locked(): boolean
		{
			return !this.$store.state[Model.Interface].enabledFeature.bookingNotificationsSettings;
		},
		text(): string
		{
			return this.items.find(({ value }) => value === this.value).name;
		},
		menuOptions(): MenuOptions
		{
			return {
				id: 'booking-resource-creation-wizard-label-dropdown-menu',
				bindElement: this.$refs.container,
				offsetTop: 8,
				items: this.items.map(({ name, value }) => ({
					title: name,
					onClick: () => this.$emit('update:value', value),
				})),
				targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
			};
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.locked)
			{
				void limit.show(LimitFeatureId.NotificationsSettings);

				return;
			}

			this.isMenuShown = true;
		},
	},
	template: `
		<div class="booking-resource-creation-wizard-label-dropdown" ref="container" @click="handleClick">
			<span>{{ text }}</span>
			<BIcon
				:name="locked ? Outline.LOCK_M : Actions.CHEVRON_DOWN"
			/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};
