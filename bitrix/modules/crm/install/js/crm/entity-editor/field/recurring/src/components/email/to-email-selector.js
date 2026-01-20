import { ajax, Dom, Tag } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog, TagSelector } from 'ui.entity-selector';
import { FieldTitle } from '../common/field-title';

const DEFAULT_TAB_ID = 'default';

export const ToEmailSelector = {
	props: {
		entityId: {
			type: Number,
			required: true,
		},
		entityTypeId: {
			type: Number,
			required: true,
		},
		communications: {
			type: Array,
			required: true,
			default: [],
		},
		emailIds: {
			type: Array,
			required: true,
		},
	},

	components: {
		FieldTitle,
	},

	data(): Object
	{
		const preparedEmailIds = this.emailIds
			.filter((emailId) => emailId > 0)
			.map((emailId) => Number(emailId))
		;

		return {
			currentEmailIds: new Set(preparedEmailIds),
			currentCommunications: this.communications,
		};
	},

	mounted(): any
	{
		this.initToEmailTagSelector();
	},

	methods: {
		initToEmailTagSelector()
		{
			if (!this.toEmailTagSelector)
			{
				const tagSelectorConfig = {
					multiple: true,
					dialogOptions: {
						width: 400,
						height: 300,
						multiple: false,
						dropdownMode: true,
						showAvatars: true,
						compactView: false,
						tabs: this.getTabs(),
						items: this.getItems(),
						selectedItems: this.getSelectedItems(),
						footer: this.entityId > 0 ? this.getFooter() : null,
						events: {
							'Item:onSelect': this.onSelectEmail,
							'Item:onDeselect': this.onDeselectEmail,
						},
					},
				};

				this.toEmailTagSelector = new TagSelector(tagSelectorConfig);
				this.toEmailTagSelector.renderTo(this.$refs.toEmailContainer);
			}
		},

		getTabs(): Array<Object>
		{
			let subtitle = 'CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TO_EMAIL_SUBTITLE_SMART_INVOICE';
			if (this.entityId <= 0)
			{
				subtitle = `${subtitle}_NEW`;
			}

			return [
				{
					id: DEFAULT_TAB_ID,
					title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TO_EMAIL_TAB_TITLE'),
					stubOptions: {
						title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TO_EMAIL_TITLE'),
						subtitle: this.$Bitrix.Loc.getMessage(subtitle),
						arrow: true,
					},
				},
			];
		},

		getItems(): Array<Object>
		{
			const items = [];
			this.currentCommunications.forEach((communication) => {
				communication.emails.forEach((email) => {
					items.push(this.createDialogItem(email, communication));
				});
			});

			return items;
		},

		getSelectedItems(): Array<Object>
		{
			const selectedItems = [];

			this.currentEmailIds.forEach((emailId) => {
				const email = this.getEmailById(emailId);
				if (email)
				{
					selectedItems.push(this.createDialogItem(email));
				}
			});

			return selectedItems;
		},

		getEmailById(emailId: string): ?Object
		{
			const emails = this.currentCommunications.flatMap((communication) => {
				return communication.emails.map((email) => {
					return {
						...email,
						caption: communication.caption,
					};
				});
			});

			const email = emails.find((item) => Number(item.id) === Number(emailId));

			return email ?? null;
		},

		createDialogItem(email: Object, communication: ?Object = null): Object
		{
			return {
				id: email.id,
				title: email.value,
				subtitle: communication ? this.getEmailSubtitle(communication, email) : '',
				entityId: DEFAULT_TAB_ID,
				tabs: DEFAULT_TAB_ID,
			};
		},

		getEmailSubtitle(item: Object, email: Object): string
		{
			return `${item.caption} (${email.typeLabel})`;
		},

		getFooter(): HTMLElement
		{
			return Tag.render`
				<div class="crm-entity-editor-recurring-template-selector-footer">
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${this.addClientHandler.bind(this)}">
						${this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_BIND_CLIENT')}
					</span>
				</div>
			`;
		},

		onSelectEmail(event: BaseEvent): void
		{
			const { item: { id } } = event.getData();

			this.currentEmailIds.add(id);

			this.emitChanges();
		},

		onDeselectEmail(event: BaseEvent): void
		{
			const { item: { id } } = event.getData();

			this.currentEmailIds.delete(id);

			this.emitChanges();
		},

		emitChanges(): void
		{
			void this.$nextTick(() => {
				this.$emit('onChange', [...this.currentEmailIds.values()]);
			});
		},

		addClientHandler(event: BaseEvent): void
		{
			const id = 'client-selector-dialog';
			const entityTypeId = this.entityTypeId;
			const context = `CRM_RECURRING-${entityTypeId}`;

			if (!this.userSelectorDialog)
			{
				this.userSelectorDialog = new Dialog({
					id,
					context,
					targetNode: event.target,
					multiple: false,
					dropdownMode: false,
					showAvatars: true,
					enableSearch: true,
					width: 450,
					zIndex: 2500,
					entities: this.getClientSelectorEntities(),
					events: {
						'Item:onSelect': this.onSelectClient,
					},
				});
			}

			if (this.userSelectorDialog.isOpen())
			{
				this.userSelectorDialog.hide();
			}
			else
			{
				this.userSelectorDialog.show();
			}
		},

		getClientSelectorEntities(): Array
		{
			const contact = {
				id: 'contact',
				dynamicLoad: true,
				dynamicSearch: true,
				options: {
					showTab: true,
					showPhones: true,
					showMails: true,
				},
			};

			const company = {
				id: 'company',
				dynamicLoad: true,
				dynamicSearch: true,
				options: {
					excludeMyCompany: true,
					showTab: true,
					showPhones: true,
					showMails: true,
				},
			};

			return [contact, company];
		},

		async onSelectClient(event: BaseEvent): Promise<void>
		{
			const { item } = event.getData();

			this.selectedClient = {
				entityId: item.id,
				entityTypeId: BX.CrmEntityType.resolveId(item.entityId),
			};

			const isBound = await this.bindClient();
			if (isBound)
			{
				BX.Crm.EntityEditor.getDefault().reload();

				const id = this.currentCommunications[0]?.emails[0]?.id;
				if (id)
				{
					this.currentEmailIds.add(id);
					this.emitChanges();
				}
			}
		},

		async bindClient(): Promise
		{
			const { entityId: clientId, entityTypeId: clientTypeId } = this.selectedClient;

			const ajaxParams = {
				entityId: this.entityId,
				entityTypeId: this.entityTypeId,
				clientId,
				clientTypeId,
			};

			return new Promise((resolve) => {
				ajax.runAction('crm.recurring.mail.bindClient', { data: ajaxParams })
					.then(({ data }) => {
						if (!data)
						{
							resolve(false);
						}

						const { communications } = data;
						this.currentCommunications = communications;

						this.currentCommunications.forEach((communication) => {
							communication.emails.forEach((email) => {
								this.toEmailTagSelector.addTag(this.createDialogItem(email, communication));
							});
						});

						this.$emit('onReInit');
						this.emitChanges();

						resolve(true);
					})
					.catch((data) => {
						this.showNotify(this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_ERROR'));
					})
				;
			});
		},

		// eslint-disable-next-line class-methods-use-this
		showNotify(content: string): void
		{
			BX.UI.Notification.Center.notify({ content });
		},
	},

	watch: {
		emailIds(emailIds): void
		{
			this.currentEmailIds = new Set(emailIds ?? []);
		},
		communications: {
			handler(data): void
			{
				this.currentCommunications = data;
				this.toEmailTagSelector = null;
				Dom.clean(this.$refs.toEmailContainer);
				this.initToEmailTagSelector();
			},
			deep: true,
		},
	},

	computed: {
		communicationsTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_COMMUNICATIONS_FIELD');
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label for="" class="ui-entity-editor-block-title-text">
					{{communicationsTitle}}
				</label>
			</div>
			<div ref="toEmailContainer"></div>
		</div>
	`,
};
