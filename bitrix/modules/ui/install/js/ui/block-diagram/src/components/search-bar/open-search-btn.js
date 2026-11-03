import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TooltipPosition } from 'ui.system.tooltip';
import { vBTooltip } from 'ui.system.tooltip.vue';
import { computed, toValue, useTemplateRef, type ComputedRef } from 'ui.vue3';

import { useActionKeyshortcuts, useActionShortcut, useLoc } from '../../composables';
import { CANVAS_ACTION_ID, TOOLTIP_SHOW_DELAY, withShortcut } from '../../utils';

import './open-search-btn.css';

type OpenSearchBtnSetup = {
	iconSet: {...};
	ariaLabel: string;
	shortcut: ComputedRef<string | null>;
	tooltip: ComputedRef<{ [string]: string | number }>;
	focus: () => void;
};

// @vue/component
export const OpenSearchBtn = {
	name: 'open-search-btn',
	directives: {
		'b-tooltip': vBTooltip,
	},
	components: {
		BIcon,
	},
	setup(): OpenSearchBtnSetup
	{
		const loc = useLoc();
		const button = useTemplateRef('button');
		const ariaLabel = loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_OPEN');
		const searchShortcut = useActionShortcut(CANVAS_ACTION_ID.TOGGLE_SEARCH);

		return {
			iconSet: Outline,
			ariaLabel,
			shortcut: useActionKeyshortcuts(CANVAS_ACTION_ID.TOGGLE_SEARCH),
			tooltip: computed(() => ({
				content: withShortcut(ariaLabel, toValue(searchShortcut)),
				// The button hangs at the canvas top edge, so the bubble opens downwards: there is no room above.
				position: TooltipPosition.Bottom,
				showDelay: TOOLTIP_SHOW_DELAY,
			})),
			// The panel closes back onto this button, so it has to be reachable from the outside.
			focus: (): void => {
				toValue(button)?.focus();
			},
		};
	},
	template: `
		<button
			type="button"
			class="ui-block-diagram-open-search-btn"
			v-b-tooltip="tooltip"
			:aria-label="ariaLabel"
			:aria-keyshortcuts="shortcut"
			ref="button"
		>
			<BIcon
				:name="iconSet.SEARCH"
				:size="24"
				aria-hidden="true"
				class="ui-block-diagram-open-search-btn__icon"
			/>
		</button>
	`,
};
