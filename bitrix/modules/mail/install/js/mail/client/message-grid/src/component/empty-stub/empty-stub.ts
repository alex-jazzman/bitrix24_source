import 'ui.buttons';
import 'ui.design-tokens';
// the stub writes its own font, and the family of it is declared by this extension alone
import 'ui.fonts.opensans';
import { defineComponent } from 'ui.vue3';

import { Phrase, TestId } from '../../const';
import { loc } from '../../lib/loc/loc';
import { isMailboxAvailable } from '../../lib/screen-flags/screen-flags';
import { useGridStore } from '../../model/grid/grid';

/** Where the reader is sent to lift the limit of the plan; opened in a tab of its own. */
const ExpandLicenseUrl = '/settings/license_all.php';

/**
 * What the grid says instead of showing an empty table: a mailbox that is simply empty gets the
 * words of the module, and one shut off by the plan gets the limit and the way out of it.
 *
 * Offered only where the screen armed it - see `stubArmed` of the registry; outside that the table
 * keeps the plain empty row.
 */
// @vue/component
export const EmptyStub = defineComponent({
	name: 'MailMessageGridEmptyStub',

	setup()
	{
		return {
			// a fact of the screen rather than of the list, and it does not change while the screen stands
			screenAllowsMailbox: isMailboxAvailable(),
			grid: useGridStore(),
		};
	},

	computed: {
		/**
		 * The plan holds the mailbox in two ways and the stub says the same thing about both: the screen
		 * may have been opened under the limit, or a page may have been refused by it since.
		 */
		mailboxAvailable(): boolean
		{
			return this.screenAllowsMailbox && !this.grid.pageSyncBlocked;
		},

		testId(): string
		{
			return this.mailboxAvailable ? TestId.EmptyStub : TestId.TariffStub;
		},

		title(): string
		{
			return loc(this.mailboxAvailable ? Phrase.EmptyTitle : Phrase.TariffTitle);
		},

		paragraphs(): string[]
		{
			return this.mailboxAvailable
				? [loc(Phrase.EmptyTextFirst), loc(Phrase.EmptyTextSecond)]
				: [loc(Phrase.TariffTextFirst), loc(Phrase.TariffTextSecond)];
		},

		buttonText(): string
		{
			return loc(Phrase.TariffButton);
		},

		buttonTestId(): string
		{
			return TestId.TariffButton;
		},
	},

	methods: {
		handleExpandClick(): void
		{
			window.open(ExpandLicenseUrl, '_blank');
		},
	},

	template: `
		<div class="mail-msg-list-grid-empty" :data-testid="testId">
			<div class="mail-msg-list-grid-empty-inner">
				<div class="mail-msg-list-grid-empty-title">{{ title }}</div>
				<p v-for="text in paragraphs" :key="text" class="mail-msg-list-grid-empty-text">{{ text }}</p>
			</div>
			<template v-if="!mailboxAvailable">
				<!-- what stands between the words and the button of the old stub, kept as it stands there -->
				<br>
				<button
					type="button"
					class="ui-btn ui-btn-round ui-btn-lg ui-btn-success"
					:data-testid="buttonTestId"
					@click="handleExpandClick"
				>{{ buttonText }}</button>
			</template>
		</div>
	`,
});
