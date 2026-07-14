// @vue/component
import { TextSm } from 'ui.system.typography.vue';
import { Loc } from 'main.core';

export const PrivateAccessCheckout = {
	name: 'PrivateAccessCheckout',
	components: { TextSm },
	props: {
		isDownload: { type: Boolean, required: true },
		isAllowControl: { type: Boolean, required: true },
	},
	emits: ['update:isAllowControl', 'update:isDownload'],
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
					@change="onToggleIsAllowControl"
				>
				<TextSm
					tag="label"
					className="access-private-block__access-control-label"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_CHECKOUT_ACCESS_CONTROL_LABEL')}
				</TextSm>
			</div>
			<div v-if="false" class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-private-block__download-wrapper">
				<input
					class="ui-ctl-element"
					type="checkbox"
					:checked="isDownload"
					@change="onToggleIsDownload"
				>
				<TextSm
					tag="label"
					className="access-private-block__download-label"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_CHECKOUT_DOWNLOAD_LABEL')}
				</TextSm>
			</div>
		</div>
	`,
};
