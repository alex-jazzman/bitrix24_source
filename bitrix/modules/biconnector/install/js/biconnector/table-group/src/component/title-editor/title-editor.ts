import { BIcon, Outline } from 'ui.icon-set.api.vue';
import type { BitrixVueComponentProps } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';

import './title-editor.css';

type HintOptions = {
	text: string,
	popupOptions: {
		bindOptions: { position: string },
		width: number,
		offsetLeft: number,
		angle: { position: string, offset: number },
	},
};

export const TitleEditor: BitrixVueComponentProps = {
	name: 'BIConnectorTableGroupTitleEditor',
	components: {
		BIcon,
	},
	directives: {
		hint,
	},
	props: {
		canEdit: {
			type: Boolean,
			required: true,
		},
	},
	emits: [
		'onNameUpdate',
	],
	data(): Object
	{
		return {
			editMode: false,
			nameBeforeEdit: '',
		};
	},
	computed: {
		groupName(): string
		{
			return this.$store.getters.groupName;
		},
		isNewGroup(): boolean
		{
			return this.$store.getters.isNewGroup;
		},
		namePlaceholder(): string
		{
			return this.isNewGroup ? this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_NAME_NEW') : '';
		},
		displayedName(): string
		{
			return this.groupName || this.namePlaceholder;
		},
		iconSet(): typeof Outline
		{
			return Outline;
		},
		systemNameHint(): HintOptions
		{
			return {
				text: this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_SYSTEM_NAME_HINT'),
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
		handleNameInput(event: InputEvent): void
		{
			this.$store.commit('setGroupName', (event.target as HTMLInputElement).value);
		},
		setEditMode(): void
		{
			this.nameBeforeEdit = this.groupName;
			this.editMode = true;
			this.$nextTick(() => {
				this.$refs.nameInput.focus();
			});
		},
		setViewMode(): void
		{
			// Enter leaves the edit mode, the blur of the removed input follows: the second call has nothing to do.
			if (!this.editMode)
			{
				return;
			}

			this.editMode = false;
			if (this.groupName === '')
			{
				this.restoreName();
			}

			if (this.groupName !== this.nameBeforeEdit)
			{
				this.$emit('onNameUpdate');
			}
		},
		restoreName(): void
		{
			// A group has to keep a name: an empty one is refused by the server and rolls back the whole save
			// of the matrix. A group with no name to restore takes the default one of an added group.
			if (this.nameBeforeEdit === '')
			{
				this.$store.commit('setEmptyGroupName', this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_NAME_NEW'));

				return;
			}

			this.$store.commit('setGroupName', this.nameBeforeEdit);
		},
	},
	// language=Vue
	template: `
		<div class="biconnector-table-group-title-editor">
			<template v-if="canEdit">
				<input
					v-if="editMode"
					class="biconnector-table-group-title-editor__input"
					ref="nameInput"
					:value="groupName"
					:placeholder="namePlaceholder"
					@input="handleNameInput"
					@blur="setViewMode"
					@keyup.enter="setViewMode"
				>
				<template v-else>
					<div class="biconnector-table-group-title-editor__name">{{ displayedName }}</div>
					<BIcon
						:name="iconSet.EDIT_L"
						:size="20"
						color="var(--ui-color-base-4)"
						class="biconnector-table-group-title-editor__edit-icon"
						@click="setEditMode"
					/>
				</template>
			</template>
			<div class="biconnector-table-group-title-editor__name" v-hint="systemNameHint" v-else>
				{{ displayedName }}
			</div>
		</div>
	`,
};
