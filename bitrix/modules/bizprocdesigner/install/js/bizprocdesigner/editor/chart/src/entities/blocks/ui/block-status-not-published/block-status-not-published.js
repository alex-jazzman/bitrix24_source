import './block-status-not-published.css';
import { useLoc } from '../../../../shared/composables';
import type { GetMessage } from '../../../../shared/composables';

type BlockStatusNotPublishedSetup = {
	getMessage: GetMessage,
}

// @vue/component
export const BlockStatusNotPublished = {
	name: 'block-status-not-published',
	setup(): BlockStatusNotPublishedSetup
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
		};
	},
	template: `
		<p class="editor-chart-block-status-not-published">
			{{ getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_NOT_PUBLISHED_STATUS') }}
		</p>
	`,
};
