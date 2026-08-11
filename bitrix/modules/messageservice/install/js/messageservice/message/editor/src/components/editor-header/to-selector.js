import { Type } from 'main.core';
import { Dialog, type ItemOptions } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { mapGetters, mapState } from 'ui.vue3.vuex';
import type { To } from '../../editor';

const ENTITY_ID = 'messageservice-to';

// @vue/component
export const ToSelector = {
	name: 'ToSelector',
	components: {
		Chip,
	},
	setup(): Object
	{
		return {
			Outline,
			ChipDesign,
		};
	},
	dialog: null,
	computed: {
		...mapGetters({
			/** @type ?To */
			to: 'to/current',
		}),
		...mapState({
			toList: (state) => state.to.collection,
		}),
		hasTos(): boolean
		{
			return Type.isArrayFilled(this.toList);
		},
		chipText(): string
		{
			if (!this.hasTos)
			{
				return this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_NO_RECEIVER');
			}

			return this.to.appearance.caption;
		},
		dialogItems(): ItemOptions[]
		{
			return this.toList.map((to: To) => {
				return {
					id: to.id,
					entityId: ENTITY_ID,
					title: to.appearance.title,
					subtitle: to.appearance.subtitle,
					avatar: to.appearance.avatar,
					selected: this.to?.id === to.id,
					tabs: ['recents'],
				};
			});
		},
	},
	methods: {
		toggleDialog(): void
		{
			if (!this.hasTos)
			{
				return;
			}

			if (this.dialog)
			{
				this.dialog.hide();
				this.dialog = null;

				return;
			}

			this.dialog = new Dialog({
				targetNode: this.$el,
				entities: [
					{
						id: ENTITY_ID,
						searchable: true,
					},
				],
				items: this.dialogItems,
				width: 400,
				height: 300,
				enableSearch: true,
				hideOnSelect: true,
				autoHide: true,
				dropdownMode: true,
				multiple: false,
				cacheable: false,
				events: {
					'Item:onSelect': (event) => {
						this.$store.dispatch('to/setTo', { toId: event.getData().item.id });
					},
					onDestroy: () => {
						this.dialog = null;
					},
				},
			});

			this.dialog.show();
		},
	},
	template: `
		<Chip
			:icon="Outline.PERSON"
			iconColor="var(--ui-color-accent-main-primary-alt)"
			iconBackground="var(--ui-color-accent-soft-blue-3)"
			:design="hasTos ? ChipDesign.Outline : ChipDesign.ShadowDisabled"
			:dropdown="true"
			:trimmable="true"
			:text="chipText"
			data-test-role="receiver-selector"
			@click="toggleDialog"
		/>
	`,
};
