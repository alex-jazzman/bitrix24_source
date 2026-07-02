import { type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';

import { type ImolModelCrmForm } from 'imopenlines.v2.model';

import { CrmFormPopup } from './crm-form-popup';

// @vue/component
export const CrmForm = {
	name: 'CrmForm',
	components: { BIcon, CrmFormPopup, Spinner },
	props: {
		forms: {
			type: Array,
			default: () => [],
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['open', 'close', 'selectForm'],
	data(): JsonObject
	{
		return {
			selectorElement: null,
			showPopup: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		SpinnerSize: () => SpinnerSize,
		SpinnerColor: () => SpinnerColor,
	},
	mounted()
	{
		this.selectorElement = this.$refs.crmFormButton;
	},
	methods:
	{
		onClick(): void
		{
			if (this.showPopup)
			{
				this.onPopupClose();

				return;
			}

			this.showPopup = true;
			this.$emit('open');
		},
		onPopupClose(): void
		{
			this.showPopup = false;
			this.$emit('close');
		},
		onSelectForm(form: ImolModelCrmForm): void
		{
			this.$emit('selectForm', form);
			this.onPopupClose();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span ref="crmFormButton">
			<Spinner
				v-if="isLoading"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.blue"
			/>
			<BIcon
				v-else
				:name="OutlineIcons.CRM_FORM"
				:title="loc('IMOL_CONTENT_TEXTAREA_CRM_FORM')"
				class="bx-imol-textarea-icon"
				:class="{ '--active': showPopup }"
				@click="onClick"
			/>
		</span>
		<CrmFormPopup
			v-if="showPopup && !isLoading"
			:bindElement="selectorElement"
			:forms="forms"
			@selectForm="onSelectForm"
			@close="onPopupClose"
		/>
	`,
};
