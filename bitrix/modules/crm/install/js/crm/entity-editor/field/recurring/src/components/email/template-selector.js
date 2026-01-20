import { Tag, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { SidePanel } from 'ui.sidepanel';
import { FieldTitle } from '../common/field-title';

const DEFAULT_TAB_ID = 'default';

export const TemplateSelector = {
	props: {
		entityTypeId: {
			type: Number,
			required: true,
		},
		templateId: {
			type: Number,
			required: true,
		},
		templates: {
			type: Array,
			required: true,
		},
	},

	components: {
		FieldTitle,
	},

	data(): Object
	{
		return {
			currentTemplateId: this.templateId,
		};
	},

	methods: {
		showTemplateDialog(event: BaseEvent): void
		{
			const dialog = this.getTemplateDialog();

			dialog.setTargetNode(event.target);
			dialog.show();
		},

		getTemplateDialog(): Dialog
		{
			if (!this.templateDialog)
			{
				const items = this.getItems();

				this.templateDialog = new Dialog({
					multiple: false,
					dropdownMode: true,
					showAvatars: true,
					enableSearch: items.length > 8,
					width: 500,
					height: 300,
					zIndex: 2500,
					tabs: this.getTabs(),
					items,
					selectedItems: this.getSelectedItems(),
					footer: this.getFooter(),
					events: {
						'Item:onSelect': this.onSelectTemplate,
						'Item:onDeselect': this.onDeselectTemplate,
					},
				});
			}

			return this.templateDialog;
		},

		getTabs(): Array<Object>
		{
			return [
				{
					id: DEFAULT_TAB_ID,
					title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TEMPLATE_TITLE'),
					stub: true,
					stubOptions: {
						title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TEMPLATE_TITLE'),
						subtitle: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TEMPLATE_SUBTITLE_SMART_INVOICE'),
						arrow: true,
					},
				},
			];
		},

		getItems(): Array<Object>
		{
			const items = [];
			this.templates.forEach((template) => {
				items.push(this.createDialogItem(template));
			});

			return items;
		},

		getSelectedItems(): Array<Object>
		{
			const items = [];
			this.templates.forEach((template) => {
				if (Number(this.templateId) === Number(template.id))
				{
					items.push(this.createDialogItem(template));
				}
			});

			return items;
		},

		createDialogItem(template: Object): Object
		{
			return {
				id: template.id,
				title: template.title,
				entityId: DEFAULT_TAB_ID,
				tabs: DEFAULT_TAB_ID,
			};
		},

		getFooter(): HTMLElement
		{
			return Tag.render`
				<div class="crm-entity-editor-recurring-template-selector-footer">
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${this.createNewEmailTemplateHandler}">
						${this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_NEW_TEMPLATE')}
					</span>
					<span class="ui-selector-footer-link" onclick="${this.showEmailTemplatesList}">
						${this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SHOW_TEMPLATES_LIST')}
					</span>
				</div>
			`;
		},

		createNewEmailTemplateHandler(): void
		{
			let url = '/crm/configs/mailtemplate/add/';

			const urlParams = {
				ENTITY_TYPE_ID: this.entityTypeId,
			};

			url = BX.util.add_url_param(url, urlParams);

			this.showEmailTemplatesSidePanel(url, true);
		},

		showEmailTemplatesList(): void
		{
			const url = '/crm/configs/mailtemplate/';

			this.showEmailTemplatesSidePanel(url, false);
		},

		showEmailTemplatesSidePanel(url: string, isReInit: boolean): void
		{
			SidePanel.Instance.open(url, {
				cacheable: false,
				width: 1080,
				events: {
					onClose: async () => {
						if (isReInit)
						{
							this.$emit('onReInit');
						}
					},
				},
			});
		},

		onSelectTemplate(event: BaseEvent): void
		{
			const { item: { id } } = event.getData();
			this.currentTemplateId = id;

			this.emitChanges();
		},

		onDeselectTemplate(): void
		{
			this.currentTemplateId = null;

			this.emitChanges();
		},

		emitChanges(): void
		{
			void this.$nextTick(() => {
				this.$emit('onChange', this.currentTemplateId);
			});
		},

		getCurrentTemplate(): ?Object
		{
			const template = this.templates.find((item) => Number(item.id) === Number(this.currentTemplateId));

			return Type.isObject(template) ? template : null;
		},
	},

	watch: {
		templateId(newValue): void
		{
			if (Number(this.templateId) !== Number(this.currentTemplateId))
			{
				this.currentTemplateId = Number(newValue);
			}
		},
		templates: {
			handler(): void
			{
				const templateDialog = this.getTemplateDialog();
				templateDialog.removeItems();

				this.templates.forEach((template) => {
					templateDialog.addItem(this.createDialogItem(template));
				});

				// const template = this.getCurrentTemplate();
				// this.$refs.template.innerText = template ? template.title : '';
			},
			deep: true,
		},
	},

	computed: {
		templateTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TEMPLATE_FIELD');
		},
		templateName(): ?string
		{
			const template = this.getCurrentTemplate();

			return template ? template.title : null;
		},
		placeholder(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TEMPLATE_FIELD_PLACEHOLDER');
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label class="ui-entity-editor-block-title-text">
					{{templateTitle}}
				</label>
			</div>
			<div
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
				@click="showTemplateDialog"
			>
				<div v-if="templateName" class="ui-ctl-element">{{templateName}}</div>
				<div v-else class="ui-ctl-element placeholder" :data-placeholder="placeholder"></div>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			</div>
		</div>
	`,
};
