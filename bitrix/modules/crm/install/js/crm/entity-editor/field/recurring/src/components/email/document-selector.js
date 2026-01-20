import { Tag, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { SidePanel } from 'ui.sidepanel';
import { FieldTitle } from '../common/field-title';

const DEFAULT_TAB_ID = 'default';

export const DocumentSelector = {
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		documents: {
			type: Array,
			required: true,
		},
		documentUrl: {
			type: String,
			required: true,
		},
	},

	components: {
		FieldTitle,
	},

	data(): Object
	{
		return {
			currentDocumentId: this.documentId,
		};
	},

	methods: {
		showDocumentDialog(event: BaseEvent): void
		{
			const dialog = this.getDocumentDialog();

			dialog.setTargetNode(event.target);
			dialog.show();
		},

		getDocumentDialog(): Dialog
		{
			if (!this.documentDialog)
			{
				const items = this.getItems();

				this.documentDialog = new Dialog({
					multiple: false,
					dropdownMode: true,
					showAvatars: true,
					enableSearch: items.length > 8,
					width: 500,
					height: 300,
					zIndex: 2500,
					items,
					tabs: this.getTabs(),
					footer: this.getFooter(),
					events: {
						'Item:onSelect': this.onSelectDocument,
						'Item:onDeselect': this.onDeselectDocument,
					},
				});
			}

			return this.documentDialog;
		},

		onSelectDocument(event: BaseEvent): void
		{
			const { item: { id } } = event.getData();
			this.currentDocumentId = id;

			this.emitChanges();
		},

		onDeselectDocument(): void
		{
			this.currentDocumentId = null;

			this.emitChanges();
		},

		emitChanges(): void
		{
			void this.$nextTick(() => {
				this.$emit('onChange', this.currentDocumentId);
			});
		},

		getCurrentDocument(): ?Object
		{
			const document = this.documents.find((item) => item.id === this.currentDocumentId);

			return Type.isObject(document) ? document : null;
		},

		getTabs(): Array<Object>
		{
			return [
				{
					id: DEFAULT_TAB_ID,
					title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_TAB_TITLE_SMART_INVOICE'),
					stub: true,
					stubOptions: {
						title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_DOCUMENT_TITLE_SMART_INVOICE'),
						subtitle: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_DOCUMENT_SUBTITLE_SMART_INVOICE'),
						arrow: true,
					},
				},
			]
		},

		getItems(): Array<Object>
		{
			const items = [];
			this.documents.forEach((template) => {
				items.push(this.createDialogItem(template));
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
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${this.createNewDocumentHandler}">
						${this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_ADD')}
					</span>
				</div>
			`;
		},

		createNewDocumentHandler(): void
		{
			this.showDocumentsSidePanel(this.documentUrl);
		},

		showDocumentsSidePanel(url: string): void
		{
			SidePanel.Instance.open(url, {
				cacheable: false,
				width: 1080,
				events: {
					onClose: async () => {
						this.$emit('onReInit');
					},
				},
			});
		},
	},

	watch: {
		documentId(newValue: number): void
		{
			if (Number(this.documentId) !== Number(this.currentDocumentId))
			{
				this.currentDocumentId = Number(newValue);
			}
		},
		documents: {
			handler(): void
			{
				const dialog = this.getDocumentDialog();
				dialog.removeItems();

				this.documents.forEach((template) => {
					dialog.addItem(this.createDialogItem(template));
				});
			},
			deep: true,
		},
	},

	computed: {
		documentTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_FIELD_SMART_INVOICE');
		},
		documentName(): ?string
		{
			const document = this.getCurrentDocument();

			return document ? document.title : null;
		},
		placeholder(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_FIELD_PLACEHOLDER');
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label for="" class="ui-entity-editor-block-title-text">
					{{documentTitle}}
				</label>
			</div>
			<div
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
				@click="showDocumentDialog"
			>
				<div v-if="documentName" class="ui-ctl-element">{{documentName}}</div>
				<div v-else class="ui-ctl-element placeholder" :data-placeholder="placeholder"></div>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			</div>
		</div>
	`,
};
