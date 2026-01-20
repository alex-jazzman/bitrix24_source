import { ajax as Ajax } from 'main.core';
import { FieldTitle } from '../common/field-title';
import { HiddenInput } from '../common/hidden-input';
import { Loader } from '../common/loader';
import { DocumentSelector } from './document-selector';
import { SenderSelector } from './sender-selector';
import { TemplateSelector } from './template-selector';
import { ToEmailSelector } from './to-email-selector';

export const EmailFields = {
	props: {
		entityTypeId: {
			type: Number,
			required: true,
		},
		entityId: {
			type: Number,
			required: true,
		},
		data: {
			type: Object,
			default: {},
		},
		changeCallback: {
			type: Function,
			required: true,
		},
	},

	components: {
		FieldTitle,
		HiddenInput,
		Loader,
		TemplateSelector,
		DocumentSelector,
		SenderSelector,
		ToEmailSelector,
	},

	data(): Object
	{
		return {
			isFetchedConfig: false,
			templateId: this.data.templateId ?? null,
			documentId: this.data.documentId ?? null,
			senderId: this.data.senderId ?? null,
			isEnabled: this.data.isEnabled ?? false,
			emailIds: this.data.emailIds ?? [],
			config: null,
		};
	},

	mounted(): any
	{
		if (this.isEnabled && !this.isFetchedConfig)
		{
			this.updateConfig();
		}
	},

	methods: {
		async setTemplateId(templateId: number): void
		{
			if (this.templateId !== templateId)
			{
				this.templateId = templateId;
			}
		},

		async setDocumentId(documentId: number): void
		{
			if (this.documentId !== documentId)
			{
				this.documentId = documentId;
			}
		},

		async setSenderId(senderId: number): void
		{
			if (this.senderId !== senderId)
			{
				this.senderId = senderId;
			}
		},

		async setEmailIds(emailIds: Array<number>): void
		{
			const isEqualsArrays = (a, b) => {
				if (a.length !== b.length)
				{
					return false;
				}

				const sortedA = [...a].sort();
				const sortedB = [...b].sort();

				return sortedA.every((value, index) => value === sortedB[index]);
			};

			if (!isEqualsArrays([...this.emailIds], emailIds))
			{
				this.emailIds = emailIds;

				// change-callback on HiddenInput doesn't work for array values
				this.changeCallback({
					name: 'RECURRING[EMAIL_IDS]',
					value: [...this.emailIds],
				});
			}
		},

		async updateConfig(): void
		{
			this.config = await this.fetchConfig();
		},

		async fetchConfig(): Object
		{
			const ajaxParameters = {
				entityTypeId: this.entityTypeId,
				entityId: this.entityId,
			};

			return new Promise((resolve) => {
				Ajax
					.runAction('crm.recurring.mail.getConfig', { data: ajaxParameters })
					.then((response) => {
						this.isFetchedConfig = true;

						const data = response.data;
						if (this.templateId === null)
						{
							this.templateId = data.templates[0]?.id ?? null;
						}

						resolve(response.data);
					})
					.catch(() => {
						this.showNotify(this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_ERROR'));

						this.isFetchedConfig = true;
					})
				;
			});
		},

		// eslint-disable-next-line class-methods-use-this
		showNotify(content: string): void
		{
			BX.UI.Notification.Center.notify({ content });
		},

		focus(): void
		{
			this.$refs.isEnabledTemplate.focus();
		},

		//@todo need?
		getData(): Object
		{
			const emails = this.toEmailTagSelector?.getTags();
			const emailIds = emails ? emails.map((item) => item.id) : [];

			return {
				isEnabled: this.isEnabled,
				templateId: this.templateId,
				documentId: this.documentId,
				senderId: this.senderId,
				emailIds,
			};
		},
	},

	watch: {
		async isEnabled(isEnabled: boolean): void
		{
			if (!this.isFetchedConfig && isEnabled)
			{
				this.config = await this.fetchConfig();
			}
		},
	},

	computed: {
		title(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TITLE_SMART_INVOICE');
		},
		containerClassList(): Array<string>
		{
			return [
				'crm-entity-widget-content-block-inner',
				'crm-entity-widget-content-block-colums-input',
				'crm-entity-widget-content-block-recurring-email-section-container',
			];
		},
		fieldsBlockClassList(): Object
		{
			return {
				'crm-recurring-mail-fields-container': true,
				'--disabled': !this.isEnabled,
			};
		},
		checkboxLabelClassList(): Object
		{
			return {
				'ui-ctl': true,
				'ui-ctl-w100': true,
				'ui-ctl-checkbox': true,
				'--checked': this.isEnabled,
			};
		},
		isEnabledTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SECTION_IS_ENABLED');
		},
		formattedIsEnabled(): string
		{
			return this.isEnabled ? 'Y' : 'N';
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" />
			<div :class="containerClassList">
				<label :class="checkboxLabelClassList">
					<input
						type="checkbox"
						class="ui-ctl-element"
						v-model="isEnabled"
						ref="isEnabledTemplate"
						value="Y"
					>
					<span class="ui-ctl-label-text">{{isEnabledTitle}}</span>
				</label>

				<Loader v-if="isEnabled && !isFetchedConfig" />
				
				<div v-if="isEnabled && isFetchedConfig" :class="fieldsBlockClassList">
					
					<TemplateSelector
						v-if="config"
						:entityTypeId="entityTypeId"
						:templateId="Number(templateId)"
						:templates="config.templates"
						@onChange="setTemplateId"
						@onReInit="updateConfig"
					/>
					
					<DocumentSelector
						v-if="config"
						:documentId="Number(documentId)"
						:documents="config.documents"
						:documentUrl="config.documentUrl"
						@onChange="setDocumentId"
						@onReInit="updateConfig"
					/>

					<SenderSelector
						v-if="config"
						:senderId="Number(senderId)"
						:senders="config.senders"
						@onChange="setSenderId"
						@onReInit="updateConfig"
					/>
					
					<ToEmailSelector
						v-if="config"
						:entityId="entityId"
						:entityTypeId="entityTypeId"
						:communications="config.communications"
						:emailIds="emailIds"
						@onChange="setEmailIds"
						@onReInit="updateConfig"
					/>

					<HiddenInput :value="templateId" name="RECURRING[EMAIL_TEMPLATE_ID]" :change-callback="changeCallback" />
					<HiddenInput :value="documentId" name="RECURRING[EMAIL_DOCUMENT_ID]" :change-callback="changeCallback" />
					<HiddenInput :value="senderId" name="RECURRING[SENDER_ID]" :change-callback="changeCallback" />
					<HiddenInput v-for="emailId in emailIds" :key="emailId" :value="emailId" name="RECURRING[EMAIL_IDS][]" />
				</div>
				<HiddenInput :value="formattedIsEnabled" name="RECURRING[IS_SEND_EMAIL]" :change-callback="changeCallback" />
			</div>
		</div>	
	`,
};
