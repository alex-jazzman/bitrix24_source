// @vue/component
import { TextSm } from 'ui.system.typography.vue';
import { Loc, Text } from 'main.core';

export const PublicAccessFooter = {
	name: 'PublicAccessFooter',
	components: { TextSm },
	props: {
		isDownload: { type: Boolean, required: true },
		isSaving: { type: Boolean, default: false },
	},
	emits: ['update:isDownload'],
	data()
	{
		return {
			downloadCheckboxId: `disk-sharing-public-download-checkbox-${Text.getRandom()}`,
		};
	},
	methods: {
		onToggle(event)
		{
			this.$emit('update:isDownload', event.target.checked);
		},
	},
	template: `
		<div class="access-public-block__footer">
			<div class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-public-block__download-wrapper">
				<input
					class="ui-ctl-element"
					type="checkbox"
					:id="downloadCheckboxId"
					data-testid="disk-sharing-public-download-checkbox"
					:checked="isDownload"
					:disabled="isSaving"
					@change="onToggle"
				>
				<TextSm
					tag="label"
					:for="downloadCheckboxId"
					className="access-public-block__download-label"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_CHECKOUT_DOWNLOAD_ACTION')}
				</TextSm>
			</div>
		</div>
	`,
};
