import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import './preview-btn.css';

// @vue/component
export const PreviewBtn = {
	name: 'PreviewBtn',
	components: {
		BIcon,
	},
	props: {
		showPreview: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		icon(): string
		{
			return this.showPreview
				? Outline.CROSSED_EYE
				: Outline.OBSERVER;
		},
		label(): string
		{
			return this.showPreview
				? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_HIDE_PREVIEW_BTN_TEXT')
				: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_SHOW_PREVIEW_BTN_TEXT');
		},
	},
	template: `
		<button
			class="bizproc-setuptemplateactivity-preview-btn"
			type="button"
		>
			<BIcon
				:name="icon"
				:size="24"
				class="bizproc-setuptemplateactivity-preview-btn__icon"
			/>
			<span class="bizproc-setuptemplateactivity-preview-btn__label">
				{{ label }}
			</span>
		</button
	`,
};
