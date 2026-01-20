import type { Receiver } from 'crm.messagesender';
import { Type } from 'main.core';
import { Dialog, type ItemOptions } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { mapGetters } from 'ui.vue3.vuex';

const ENTITY_ID = 'crm-receiver';

// @vue/component
export const ReceiverSelector = {
	name: 'ReceiverSelector',
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
			/** @type Channel */
			channel: 'channels/current',
			/** @type ?Receiver */
			receiver: 'channels/receiver',
		}),
		hasReceivers(): boolean
		{
			return Type.isArrayFilled(this.channel?.toList);
		},
		chipText(): string
		{
			if (!this.hasReceivers)
			{
				return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_RECEIVER');
			}

			return `${this.receiver.addressSourceData.title} ${this.receiver.address.valueFormatted}`;
		},
		dialogItems(): ItemOptions[]
		{
			return this.channel.toList.map((receiver: Receiver) => {
				return {
					id: receiver.address.id,
					entityId: ENTITY_ID,
					title: receiver.addressSourceData.title,
					subtitle: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_RECEIVER_SUBTITLE_TEMPLATE', {
						'#ADDRESS#': receiver.address.valueFormatted,
						'#TYPE#': receiver.address.valueTypeCaption,
					}),
					avatar: `/bitrix/js/crm/messagesender/editor/images/${receiver.addressSource.entityTypeName.toLowerCase()}.svg`,
					selected: this.receiver?.address.id === receiver.address.id,
					tabs: ['recents'],
				};
			});
		},
	},
	methods: {
		toggleDialog(): void
		{
			if (!this.hasReceivers)
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
						this.$store.dispatch('channels/setReceiver', { receiverAddressId: event.getData().item.id });
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
			:design="hasReceivers ? ChipDesign.Outline : ChipDesign.ShadowDisabled"
			:dropdown="true"
			:trimmable="true"
			:text="chipText"
			data-test-role="receiver-selector"
			@click="toggleDialog"
		/>
	`,
};
