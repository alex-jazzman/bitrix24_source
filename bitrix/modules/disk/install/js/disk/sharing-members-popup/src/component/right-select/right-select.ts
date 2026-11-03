import { Loc } from 'main.core';
import { BMenu } from 'ui.system.menu.vue';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { type SharingRightValue } from '../../const/sharing';
import { getRightLabel } from '../../lib/right-label/right-label';
import { type SharingStore, useSharingStore } from '../../model/sharing/sharing';

import './right-select.css';

type RightMenuItem = {
	title: string,
	isSelected: boolean,
	onClick: () => void,
};

type RightMenuOptions = {
	bindElement: HTMLElement | null,
	closeOnItemClick: boolean,
	items: RightMenuItem[],
};

/**
 * The level of a single member. The list of levels is the same in both editing modes: the
 * server limits it by the maximum right of the current user and refuses anything above it.
 */
export const RightSelect = defineComponent({
	name: 'DiskSharingRightSelect',
	components: {
		BMenu,
		TextSm,
	},
	props: {
		modelValue: {
			type: String,
			required: true,
		},
		// the name of the member the level belongs to: the column header alone names no control
		memberName: {
			type: String,
			required: true,
		},
	},
	emits: ['update:modelValue'],
	// the store is taken here, where the injection context of the component gives the pinia of the popup
	setup(): { store: SharingStore }
	{
		return { store: useSharingStore() };
	},
	data(): { isMenuShown: boolean }
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		selectedLabel(): string
		{
			return getRightLabel(this.modelValue as SharingRightValue);
		},
		availableRights(): SharingRightValue[]
		{
			return this.store.availableRights;
		},
		/**
		 * The visible level opens the name, so the name still contains the text the user reads, and
		 * the member follows it: the header of the column names no control of the row by itself.
		 */
		accessibleName(): string
		{
			return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_MEMBER_ACCESS_LEVEL', {
				'#LEVEL#': this.selectedLabel,
				'#NAME#': this.memberName,
			}) ?? '';
		},
	},
	methods: {
		getTriggerElement(): HTMLElement | null
		{
			return (this.$refs.trigger as { $el: HTMLElement } | undefined)?.$el ?? null;
		},
		// the bound element is known only after the trigger is rendered, so the options are built on opening
		getMenuOptions(): RightMenuOptions
		{
			return {
				bindElement: this.getTriggerElement(),
				closeOnItemClick: true,
				items: this.availableRights.map((right: SharingRightValue): RightMenuItem => {
					return {
						title: getRightLabel(right),
						isSelected: right === this.modelValue,
						onClick: () => this.handleSelect(right),
					};
				}),
			};
		},
		// an empty maximum right leaves no level to offer, so there is no menu to open either
		handleClick(): void
		{
			this.isMenuShown = !this.isMenuShown && this.availableRights.length > 0;
		},
		// the closing menu puts the focus back on the trigger, which is where the picking started
		handleSelect(right: SharingRightValue): void
		{
			this.isMenuShown = false;
			this.$emit('update:modelValue', right);
		},
	},
	template: `
		<TextSm
			ref="trigger"
			tag="button"
			type="button"
			class="disk-sharing-members-popup-right"
			data-testid="disk-sharing-members-right"
			:aria-label="accessibleName"
			@click="handleClick"
		>{{ selectedLabel }}</TextSm>
		<BMenu
			v-if="isMenuShown"
			:options="getMenuOptions()"
			@close="isMenuShown = false"
		/>
	`,
});
