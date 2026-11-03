import './style.css';
import * as Mixins from '../base/components/mixins';

const BUTTON_CAPTION_PLACEHOLDER = '%buttonCaption%';
const DOCUMENT_TITLE_PLACEHOLDER = '%documentTitle%';

const FieldAgreement = {
	mixins: [Mixins.MixinField],
	template: `
		<div class="b24-form-control-container" :data-testid="'crm-agreement-field-' + field.id">
			<div
				v-if="field.isAcceptedBySubmit()"
				:data-testid="'crm-agreement-submit-text-' + field.id"
				class="b24-form-field-agreement-submit-text"
			>{{ linkParts.before }}<a
				v-if="field.isLink()"
				:data-testid="'crm-agreement-submit-link-' + field.id"
				:href="linkUrl"
				target="_blank"
				rel="noopener noreferrer"
				class="b24-form-field-agreement-submit-link"
			>{{ linkParts.text }}</a><button
				v-else
				type="button"
				:data-testid="'crm-agreement-read-btn-' + field.id"
				class="b24-form-field-agreement-submit-link"
				aria-haspopup="dialog"
				@click="requestConsent"
			>{{ linkParts.text }}</button>{{ linkParts.after }}</div>
			<label v-else>
				<input type="checkbox" 
					:id="fieldId"
					:data-testid="'crm-agreement-checkbox-' + field.id"
					:aria-required="ariaRequired"
					:aria-invalid="ariaInvalid"
					:aria-describedby="ariaDescribedby"
					v-model="field.item().selected"
					@blur="$emit('input-blur', this)"
					@focus="$emit('input-focus', this)"
					@change="field.resetAgreementNotice()"
					@click.capture="requestConsent"
					onclick="this.blur()"
				>
				<span v-if="field.isLink()" class="b24-form-control-desc">{{ linkParts.before }}<a :data-testid="'crm-agreement-link-' + field.id" :href="linkUrl" target="_blank" rel="noopener noreferrer" class="b24-form-field-agreement-link">{{ linkParts.text }}</a>{{ linkParts.after }}</span>
				<span v-else class="b24-form-control-desc">
					<span class="b24-form-field-agreement-link" :data-testid="'crm-agreement-label-' + field.id">{{ field.label }}</span>
				</span>
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
			</label>
			<span
				v-if="field.agreementNoticeVisible"
				:data-testid="'crm-agreement-notice-' + field.id"
				class="b24-form-field-agreement-notice"
				role="status"
				aria-live="polite"
			>{{ field.getAgreementNoticeText() }}</span>
			<field-item-alert v-if="!field.isAcceptedBySubmit()" v-bind:field="field"></field-item-alert>
		</div>
	`,
	computed: {
		agreementNoticePolicy()
		{
			return this.field.getAgreementNoticePolicy();
		},
		linkUrl()
		{
			let url = this.field.options.content.url.trim();
			if (!/^http:|^https:/.test(url))
			{
				url = `https://${url}`;
			}

			return url;
		},
		linkParts()
		{
			if (this.field.isAcceptedBySubmit())
			{
				return this.submitConsentParts;
			}

			const parts = String(this.field.label).split('%');

			return {
				before: parts[0] || '',
				text: parts.length > 1 ? parts[1] : '',
				after: parts.length > 2 ? parts.slice(2).join('%') : '',
			};
		},
		submitConsentParts()
		{
			const form = this.$root.form;
			const caption = form.buttonCaption || form.messages.get('defButton');
			const personal = this.field.options.isPersonalDataAgreement === true;
			const message = personal ? 'consentAcceptBySubmit' : 'consentAcceptBySubmitDocument';
			const parts = String(this.field.messages.get(message))
				.split(DOCUMENT_TITLE_PLACEHOLDER);

			// caption comes from form settings: substitute it after the split and via a function,
			// so it can inject neither the marker nor a `$&` replacement pattern
			const withCaption = (part) => (part || '').replace(BUTTON_CAPTION_PLACEHOLDER, () => caption);
			if (!personal && parts.length === 1)
			{
				return { before: '', text: withCaption(parts[0]), after: '' };
			}

			return {
				before: withCaption(parts[0]),
				text: personal
					? this.field.messages.get('consentAcceptBySubmitLink') || this.field.options.content.title
					: this.field.options.content.title,
				after: withCaption(parts.length > 1 ? parts.slice(1).join(DOCUMENT_TITLE_PLACEHOLDER) : ''),
			};
		},
	},
	watch: {
		agreementNoticePolicy()
		{
			this.field.refreshAgreementNoticePolicy();
		},
	},
	beforeDestroy()
	{
		this.field.resetAgreementNotice();
	},
	methods: {
		requestConsent(e)
		{
			this.field.consentRequested = true;

			if (this.field.isLink())
			{
				this.field.applyConsent();
				return true;
			}

			e ? e.preventDefault() : null;
			e ? e.stopPropagation() : null;
			this.$root.$emit('consent:request', this.field);
			return false;
		},
	},
};

export {
	FieldAgreement,
};
