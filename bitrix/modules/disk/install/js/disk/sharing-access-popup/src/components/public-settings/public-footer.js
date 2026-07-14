// @vue/component
import { TextSm } from 'ui.system.typography.vue';
import { Loc } from 'main.core';

export const PublicAccessFooter = {
	name: 'PublicAccessFooter',
	components: { TextSm },
	props: {
		isDownload: { type: Boolean, required: true },
	},
	emits: ['update:isDownload'],
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
					:checked="isDownload"
					@change="onToggle"
					id="test"
				>
				<TextSm
					tag="label"
					className="access-public-block__download-label"
					for="test"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_CHECKOUT_DOWNLOAD_ACTION')}
				</TextSm>
			</div>
		</div>
	`,
};
