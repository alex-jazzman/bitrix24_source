import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { defineComponent } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';
import { mapState } from 'ui.vue3.pinia';

import { HeaderElement } from '../../const/element';
import { HeaderTestId } from '../../const/testid';
import { hideHint, showHint } from '../../lib/hint-keyboard/hint-keyboard';
import { useCompositionStore } from '../../model/composition/composition';

import './content-warning.css';

type HintBinding = {
	text: string,
	popupOptions: Object,
};

type ContentWarningContext = {
	HeaderTestId: typeof HeaderTestId,
	IconSize: number,
	WarningIcon: string,
};

/** The warning stands next to the name and is read at the size of it. */
const IconSize = 24;

/**
 * The warning about content the portal does not vet. The text is the same for every opening which
 * carries the element, so it lives in the phrases of the extension rather than in the composition.
 * The hint is the only place the text is written, hence the icon carries it as its accessible name.
 */
export const ContentWarning = defineComponent({
	name: 'DiskDocumentHeaderContentWarning',
	components: {
		BIcon,
	},
	directives: {
		hint,
	},
	setup(): ContentWarningContext
	{
		return {
			HeaderTestId,
			IconSize,
			WarningIcon: Outline.ALERT,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['hasElement']),
		isPresent(): boolean
		{
			return this.hasElement(HeaderElement.ContentWarning);
		},
		warningText(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_CONTENT_WARNING') ?? '';
		},
		/** The bubble is raised above the frame of the document, which lies right under the header. */
		hintParams(): HintBinding
		{
			return {
				text: this.warningText,
				popupOptions: { zIndexOptions: { alwaysOnTop: true } },
			};
		},
	},
	methods: {
		showHint,
		hideHint,
	},
	template: `
		<span
			v-if="isPresent"
			v-hint="hintParams"
			class="disk-document-header-content-warning"
			:data-testid="HeaderTestId.ContentWarning"
			role="img"
			tabindex="0"
			:aria-label="warningText"
			@focus="showHint"
			@blur="hideHint"
			@keydown.esc="hideHint"
		>
			<BIcon
				:name="WarningIcon"
				:size="IconSize"
				color="var(--ui-color-accent-main-warning)"
			/>
		</span>
	`,
});
