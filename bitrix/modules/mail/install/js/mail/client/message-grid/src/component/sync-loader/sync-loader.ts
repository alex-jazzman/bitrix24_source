import { defineComponent } from 'ui.vue3';

import { Phrase, TestId } from '../../const';
import { loc } from '../../lib/loc/loc';

/** The animation of the screen, served from the images of the product rather than from this extension. */
const LoaderImage = '/bitrix/images/mail/mail-loader.svg';

/**
 * What stands in place of the table while a mailbox is synchronized for the first time. The look
 * comes from the stylesheet of the screen, written for the loader the old grid put into the stub
 * node of the template; here it fills a block of the list, which carries the height of that node.
 */
// @vue/component
export const SyncLoader = defineComponent({
	name: 'MailMessageGridSyncLoader',

	setup()
	{
		return {
			testId: TestId.SyncLoader,
			image: LoaderImage,
		};
	},

	computed: {
		label(): string
		{
			return loc(Phrase.SyncLoaderLabel);
		},
	},

	template: `
		<div class="mail-message-grid__loader-area" role="status" :aria-label="label" :data-testid="testId">
			<div class="mail-msg-list-grid-loader mail-msg-list-grid-loader-animate">
				<div class="mail-msg-list-grid-loader-inner">
					<img :src="image" :alt="label">
				</div>
			</div>
		</div>
	`,
});
