// @vue/component
import { TextSm } from 'ui.system.typography.vue';
import { Loc, Text } from 'main.core';

export const PrivateAccessCheckout = {
	name: 'PrivateAccessCheckout',
	components: { TextSm },
	props: {
		isDownload: { type: Boolean, required: true },
		isAllowControl: { type: Boolean, required: true },
	},
	emits: ['update:isAllowControl', 'update:isDownload'],
	data()
	{
		return {
			downloadCheckboxId: `disk-sharing-private-download-checkbox-${Text.getRandom()}`,
		};
	},
	methods: {
		onToggleIsAllowControl(event)
		{
			this.$emit('update:isAllowControl', event.target.checked);
		},
		onToggleIsDownload(event)
		{
			this.$emit('update:isDownload', event.target.checked);
		},
	},
	template: `
		<div class="access-private-checkout__wrapper">
			<div class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-private-block__allow-control">
				<input
					type="checkbox"
					:checked="isAllowControl"
					data-testid="disk-sharing-access-private-allow-control"
					@change="onToggleIsAllowControl"
				>
				<TextSm
					tag="label"
					className="access-private-block__access-control-label"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_CHECKOUT_ACCESS_CONTROL_LABEL')}
				</TextSm>
			</div>
			<div class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-private-block__download-wrapper">
				<input
					type="checkbox"
					:id="downloadCheckboxId"
					data-testid="disk-sharing-private-download-checkbox"
					:checked="isDownload"
					@change="onToggleIsDownload"
				>
				<TextSm
					tag="label"
					:for="downloadCheckboxId"
					className="access-private-block__download-label"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_CHECKOUT_DOWNLOAD_LABEL')}
				</TextSm>
			</div>
		</div>
	`,
};
