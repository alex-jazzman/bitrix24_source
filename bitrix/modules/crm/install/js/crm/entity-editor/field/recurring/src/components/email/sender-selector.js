import { Tag, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { ProviderShowcase } from 'ui.mail.provider-showcase';
import { FieldTitle } from '../common/field-title';

const DEFAULT_TAB_ID = 'default';

export const SenderSelector = {
	props: {
		senderId: {
			type: Number,
			required: true,
		},
		senders: {
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
			currentSenderId: this.senderId,
		};
	},

	methods: {
		showSenderDialog(event: BaseEvent): void
		{
			const dialog = this.getSenderDialog();

			dialog.setTargetNode(event.target);
			dialog.show();
		},

		getSenderDialog(): Dialog
		{
			if (!this.senderDialog)
			{
				const items = this.getItems();

				this.senderDialog = new Dialog({
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
						'Item:onSelect': this.onSelectSender,
						'Item:onDeselect': this.onDeselectSender,
					},
				});
			}

			return this.senderDialog;
		},

		getTabs(): Array<Object>
		{
			return [
				{
					id: DEFAULT_TAB_ID,
					title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_SENDER_TITLE'),
					stub: true,
					stubOptions: {
						title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_SENDER_TITLE'),
						subtitle: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_SENDER_SUBTITLE_SMART_INVOICE'),
						arrow: true,
					},
				},
			];
		},

		getItems(): Array<Object>
		{
			const items = [];
			this.senders.forEach((sender) => {
				items.push(this.createDialogItem(sender));
			});

			return items;
		},

		getSelectedItems(): Array<Object>
		{
			const items = [];
			this.senders.forEach((sender) => {
				if (Number(this.senderId) === Number(sender.id))
				{
					items.push(this.createDialogItem(sender));
				}
			});

			return items;
		},

		createDialogItem(sender: Object): Object
		{
			return {
				id: sender.id,
				title: sender.email,
				subtitle: sender.name,
				entityId: DEFAULT_TAB_ID,
				tabs: DEFAULT_TAB_ID,
			};
		},

		getFooter(): HTMLElement
		{
			return Tag.render`
				<div class="crm-entity-editor-recurring-template-selector-footer">
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${this.createNewSenderHandler}">
						${this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_NEW_SENDER')}
					</span>
				</div>
			`;
		},

		createNewSenderHandler(): void
		{
			ProviderShowcase.openSlider({
				setSenderCallback: (senderId: number | string, senderName: string, senderEmail: string) => {
					this.$emit('onReInit');
				},
			});
		},

		onSelectSender(event: BaseEvent): void
		{
			const { item: { id } } = event.getData();
			this.currentSenderId = id;

			this.emitChanges();
		},

		onDeselectSender(): void
		{
			this.currentSenderId = null;

			this.emitChanges();
		},

		emitChanges(): void
		{
			this.$emit('onChange', this.currentSenderId);
		},

		getCurrentSender(): ?Object
		{
			const sender = this.senders.find((item) => Number(item.id) === Number(this.senderId));

			return Type.isObject(sender) ? sender : null;
		},
	},

	watch: {
		senderId(newValue): void
		{
			if (Number(this.senderId) !== Number((this.currentSenderId)))
			{
				this.currentSenderId = Number(newValue);
			}
		},
		senders: {
			handler(): void
			{
				const senderDialog = this.getSenderDialog();
				senderDialog.removeItems();

				this.senders.forEach((sender) => {
					senderDialog.addItem(this.createDialogItem(sender));
				});

				// const sender = this.getCurrentSender();
				// this.$refs.sender.innerText = sender ? `${sender.name} (${sender.email})` : '';
			},
			deep: true,
		},
	},

	computed: {
		senderTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SENDER_FIELD');
		},
		senderName(): ?string
		{
			const sender = this.getCurrentSender();

			return sender ? sender.email : null;
		},
		placeholder(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SENDER_FIELD_PLACEHOLDER');
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label for="" class="ui-entity-editor-block-title-text">
					{{senderTitle}}
				</label>
			</div>
			<div
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
				@click="showSenderDialog"
			>
				<div v-if="senderName" class="ui-ctl-element">{{senderName}}</div>
				<div v-else class="ui-ctl-element placeholder" :data-placeholder="placeholder"></div>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			</div>
		</div>
	`,
};
