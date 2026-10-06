import './style.css';
import * as Mixins from '../base/components/mixins';

const FieldAgreement = {
	mixins: [Mixins.MixinField],
	template: `
		<div class="b24-form-control-container">
			<label>
				<input type="checkbox" 
					:id="fieldId"
					:aria-required="ariaRequired"
					:aria-invalid="ariaInvalid"
					:aria-describedby="ariaDescribedby"
					v-model="field.item().selected"
					@blur="$emit('input-blur', this)"
					@focus="$emit('input-focus', this)"
					@click.capture="requestConsent"
					onclick="this.blur()"
				>
				<span v-if="field.isLink()" class="b24-form-control-desc">{{ linkParts.before }}<a :href="linkUrl" target="_blank" rel="noopener noreferrer" class="b24-form-field-agreement-link">{{ linkParts.text }}</a>{{ linkParts.after }}</span>
				<span v-else class="b24-form-control-desc">
					<span class="b24-form-field-agreement-link">{{ field.label }}</span>
				</span>
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
			</label>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`,
	computed: {
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
			const parts = String(this.field.label).split('%');

			return {
				before: parts[0] || '',
				text: parts.length > 1 ? parts[1] : '',
				after: parts.length > 2 ? parts.slice(2).join('%') : '',
			};
		},
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
