import { computed, toValue, type ComputedRef } from 'ui.vue3';
import { vBTooltip } from 'ui.system.tooltip.vue';
import { TooltipPosition } from 'ui.system.tooltip';
import {
	useActionKeyshortcuts,
	useActionShortcut,
	useHistory,
	useBlockDiagram,
	useKeyboardShortcuts,
	useLoc,
} from '../../composables';
import { IconButton } from '../icon-button/icon-button';
import { Outline } from 'ui.icon-set.api.vue';
import { CANVAS_ACTION_ID, TOOLTIP_SHOW_DELAY, withShortcut } from '../../utils';
import './history-bar.css';

type HistoryTooltip = { [string]: string | number };

export type HistoryBarSetup = {
	hasNext: boolean,
	hasPrev: boolean,
	onNext: () => void,
	onPrev: () => void,
	prevTooltip: ComputedRef<HistoryTooltip>,
	nextTooltip: ComputedRef<HistoryTooltip>,
	prevLabel: string,
	nextLabel: string,
	prevKeyshortcuts: ComputedRef<string | null>,
	nextKeyshortcuts: ComputedRef<string | null>,
	Outline: {...},
};

// @vue/component
export const HistoryBar = {
	name: 'history-bar',
	directives: {
		'b-tooltip': vBTooltip,
	},
	components: {
		IconButton,
	},
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): HistoryBarSetup
	{
		const { isDisabledBlockDiagram } = useBlockDiagram();
		const {
			hasNext,
			hasPrev,
			next,
			prev,
		} = useHistory();
		const loc = useLoc();
		const prevLabel = loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_PREV');
		const nextLabel = loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_NEXT');
		// The platform difference of the step forward lives in the defaults of the registry, so both
		// buttons read their combo the same way here.
		const prevShortcut = useActionShortcut(CANVAS_ACTION_ID.UNDO);
		const nextShortcut = useActionShortcut(CANVAS_ACTION_ID.REDO);

		function onNext(): void
		{
			if (props.disabled || toValue(isDisabledBlockDiagram))
			{
				return;
			}

			next();
		}

		function onPrev(): void
		{
			if (props.disabled || toValue(isDisabledBlockDiagram))
			{
				return;
			}

			prev();
		}

		// The shortcuts go through the handlers of the buttons: a disabled diagram is not undone
		// from the keyboard either.
		useKeyboardShortcuts([
			{
				actionId: CANVAS_ACTION_ID.UNDO,
				handler: onPrev,
			},
			{
				actionId: CANVAS_ACTION_ID.REDO,
				handler: onNext,
			},
		]);

		return {
			hasNext,
			hasPrev,
			onNext,
			onPrev,
			prevLabel,
			nextLabel,
			// The bar hangs at the canvas top edge, so both bubbles open downwards: there is no room above.
			prevTooltip: computed((): HistoryTooltip => ({
				content: withShortcut(loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_PREV'), toValue(prevShortcut)),
				position: TooltipPosition.Bottom,
				showDelay: TOOLTIP_SHOW_DELAY,
			})),
			nextTooltip: computed((): HistoryTooltip => ({
				content: withShortcut(loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_NEXT'), toValue(nextShortcut)),
				position: TooltipPosition.Bottom,
				showDelay: TOOLTIP_SHOW_DELAY,
			})),
			prevKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.UNDO),
			nextKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.REDO),
			Outline,
		};
	},
	template: `
		<div class="ui-block-diagram-histoy-bar">
			<slot>
				<IconButton
					class="ui-block-diagram-histoy-bar__prev-button"
					:icon-name="Outline.FORWARD"
					:size="22"
					:disabled="!hasPrev"
					:data-test-id="$blockDiagramTestId('historyPrevBtn')"
					:aria-label="prevLabel"
					:aria-keyshortcuts="prevKeyshortcuts"
					v-b-tooltip="prevTooltip"
					@click="onPrev"
				/>
				<IconButton
					:icon-name="Outline.FORWARD"
					:size="22"
					:disabled="!hasNext"
					:data-test-id="$blockDiagramTestId('historyNextBtn')"
					:aria-label="nextLabel"
					:aria-keyshortcuts="nextKeyshortcuts"
					v-b-tooltip="nextTooltip"
					@click="onNext"
				/>
			</slot>
		</div>
	`,
};
