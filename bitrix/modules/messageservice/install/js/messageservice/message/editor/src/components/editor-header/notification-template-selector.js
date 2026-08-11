import { Dialog, type ItemOptions } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { Chip } from 'ui.system.chip.vue';
import { mapGetters, mapState } from 'ui.vue3.vuex';
import { type NotificationTemplate } from '../../editor';
import { Type } from 'main.core';

const ENTITY_ID = 'messageservice-notification-template';

// @vue/component
export const NotificationTemplateSelector = {
	name: 'NotificationTemplateSelector',
	components: {
		Chip,
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	dialog: null,
	computed: {
		...mapState({
			/** @type NotificationTemplate[] */
			templates: (state) => state.notificationTemplates.collection,
		}),
		...mapGetters({
			/** @type ?NotificationTemplate */
			current: 'notificationTemplates/current',
		}),
		dialogItems(): ItemOptions[]
		{
			return this.templates.map((template: NotificationTemplate) => {
				const hasTitle = Type.isStringFilled(template.translation?.TITLE);

				return {
					id: template.code,
					entityId: ENTITY_ID,
					title: hasTitle ? template.translation?.TITLE : (template.translation?.TEXT || template.code),
					subtitle: hasTitle ? (template.translation?.TEXT || '') : null,
					avatar: '/bitrix/js/messageservice/message/editor/images/template.svg',
					avatarOptions: {
						bgColor: 'var(--ui-color-accent-soft-blue-3)',
					},
					selected: this.current?.code === template.code,
					tabs: ['recents'],
				};
			});
		},
	},
	beforeUnmount()
	{
		this.dialog?.destroy();
		this.dialog = null;
	},
	methods: {
		toggleDialog(): void
		{
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
				height: 350,
				enableSearch: true,
				hideOnSelect: true,
				autoHide: true,
				dropdownMode: true,
				multiple: false,
				cacheable: false,
				events: {
					'Item:onSelect': (event) => {
						this.$store.dispatch('notificationTemplates/setSelected', {
							code: event.getData().item.id,
						});
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
			:icon="Outline.TEXT_FORMAT_BOTTOM"
			:dropdown="true"
			:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_TEMPLATES')"
			data-test-role="notification-template-selector"
			@click="toggleDialog"
		/>
	`,
};
