import { Runtime, Tag } from 'main.core';
import { Dialog, type ItemOptions } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { Chip } from 'ui.system.chip.vue';
import { mapGetters } from 'ui.vue3.vuex';
import type { Template } from '../../model/templates-model';

const ENTITY_ID = 'crm-hsm';

// @vue/component
export const TemplateSelector = {
	name: 'TemplateSelector',
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
		...mapGetters({
			/** @type Template[] */
			templates: 'templates/listForChannel',
			/** @type ?Template */
			current: 'templates/current',
		}),
		dialogItems(): ItemOptions[]
		{
			return this.templates.map((template: Template) => {
				return {
					id: template.ORIGINAL_ID,
					entityId: ENTITY_ID,
					title: template.TITLE,
					subtitle: template.PREVIEW,
					avatar: '/bitrix/js/crm/messagesender/editor/images/template.svg',
					avatarOptions: {
						bgColor: 'var(--ui-color-accent-soft-blue-3)',
					},
					selected: this.current?.ORIGINAL_ID === template.ORIGINAL_ID,
					tabs: ['recents'],
				};
			});
		},
		dialogFooter(): Array<HTMLElement>
		{
			return [
				Tag.render`<span style="width: 100%;"></span>`,
				Tag.render`
					<span onclick="${this.showFeedbackForm}" class="ui-selector-footer-link">${
						this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_SUGGEST_TEMPLATE')
					}</span>
				`,
			];
		},
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
				footer: this.dialogFooter,
				events: {
					'Item:onSelect': (event) => {
						this.$store.dispatch('templates/setTemplate', { templateOriginalId: event.getData().item.id });

						this.$Bitrix.Data.get('locator').getAnalyticsService().onSelectTemplate();
					},
					onDestroy: () => {
						this.dialog = null;
					},
				},
			});

			this.dialog.show();
		},
		async showFeedbackForm(): Promise<void>
		{
			this.$Bitrix.Data.get('locator').getAnalyticsService().onSuggestTemplate();

			const { Form } = await Runtime.loadExtension('ui.feedback.form');

			/** @see BX.UI.Feedback.Form.open */
			Form.open({
				id: 'b24_crm_timeline_whatsapp_template_suggest_form',
				forms: [{
					zones: ['ru', 'by', 'kz'],
					id: 758,
					lang: 'ru',
					sec: 'jyafqa',
				}, {
					zones: ['en'],
					id: 760,
					lang: 'en',
					sec: 'culzcq',
				}, {
					zones: ['de'],
					id: 764,
					lang: 'de',
					sec: '9h74xf',
				}, {
					zones: ['com.br'],
					id: 766,
					lang: 'com.br',
					sec: 'ddkhcc',
				}, {
					zones: ['es'],
					id: 762,
					lang: 'es',
					sec: '6ni833',
				}, {
					zones: ['en'],
					id: 760,
					lang: 'en',
					sec: 'culzcq',
				}],
			});
		},
	},
	template: `
		<Chip 
			:icon="Outline.TEXT_FORMAT_BOTTOM"
			:dropdown="true"
			:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_TEMPLATES')"
			data-test-role="template-selector"
			@click="toggleDialog"
		/>
	`,
};
