import type { BitrixVueComponentProps } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';

export const TitleEditor: BitrixVueComponentProps = {
	props: {
		canEdit: {
			type: Boolean,
			required: true,
		},
	},
	data(): Object
	{
		return {
			editMode: false,
		};
	},
	directives: {
		hint,
	},
	computed: {
		namePlaceholder(): string
		{
			return this.isNewGroup
				? this.$Bitrix.Loc.getMessage('BI_GROUP_NAME_NEW')
				: ''
			;
		},
		displayedGroupName(): string
		{
			if (this.isNewGroup && !this.groupName)
			{
				return this.namePlaceholder;
			}

			return this.groupName;
		},
		isNewGroup(): boolean
		{
			return this.$store.getters.isNewGroup;
		},
		groupName: {
			get(): string
			{
				return this.$store.getters.groupName;
			},
			set(value): void
			{
				this.$store.commit('setGroupName', value);
			},
		},
		set(): Outline
		{
			return Outline;
		},
		nameHintOptions(): Object
		{
			return {
				text: this.$Bitrix.Loc.getMessage('BI_GROUP_SYSTEM_NAME_HINT'),
				popupOptions: {
					bindOptions: {
						position: 'bottom',
					},
					width: 220,
					offsetLeft: 40,
					angle: {
						position: 'top',
						offset: 0,
					},
				},
			};
		},
	},
	methods: {
		setEditMode()
		{
			this.editMode = true;
			this.$nextTick(() => {
				this.$refs.nameInput.focus();
			});
		},
		setViewMode()
		{
			this.editMode = false;
			this.$emit('onNameUpdate');
		},
	},
	emits: [
		'onNameUpdate',
	],
	components: {
		BIcon,
	},
	template: `
		<div class="group-header-title" :style="{ width: editMode ? '80%' : 'auto' }">
			<template v-if="canEdit">
				<input
					v-if="editMode"
					class="group-name-input"
					@blur="setViewMode"
					@keyup.enter="setViewMode"
					v-model="groupName"
					ref="nameInput"
					:placeholder="namePlaceholder"
				>
				<template v-else>
					<div class="group-name">{{displayedGroupName}}</div>
					<BIcon
						:name="set.EDIT_L"
						:size="20"
						color="var(--ui-color-base-4)"
						:class="'group-name-edit-icon'"
						@click="setEditMode"
					></BIcon>
				</template>
			</template>
			<template v-else>
				<div class="group-name" v-hint="nameHintOptions">{{displayedGroupName}}</div>
			</template>
		</div>
	`,
};
