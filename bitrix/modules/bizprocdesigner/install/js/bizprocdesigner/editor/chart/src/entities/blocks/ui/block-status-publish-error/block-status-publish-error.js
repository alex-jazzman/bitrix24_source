import { BIcon, Outline } from 'ui.icon-set.api.vue';

import './block-status-publish-error.css';

// @vue/component
export const BlockStatusPublishError = {
	name: 'BlockStatusPublishError',
	components: {
		BIcon,
	},
	computed: {
		Outline: (): typeof Outline => Outline,
	},
	template: `
		<div class="editor-chart-block-status-publish-error">
			<div class="editor-chart-block-status-publish-error__icon">
				<BIcon :name="Outline.ALERT_ACCENT" :size="16"/>
			</div>
			{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_PUBLISH_ERROR') }}
		</div>
	`,
};
