import { Browser } from 'main.core';
import { toValue } from 'ui.vue3';
import { useHistory, useBlockDiagram, useKeyboardShortcuts } from '../../composables';
import { IconButton } from '../icon-button/icon-button';
import { Outline } from 'ui.icon-set.api.vue';
import './history-bar.css';

export type HistoryBarSetup = {
	hasNext: boolean,
	hasPrev: boolean,
	onNext: () => void,
	onPrev: () => void,
	Outline: {...},
};

// @vue/component
export const HistoryBar = {
	name: 'history-bar',
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
		const isMac = Browser.isMac();

		useKeyboardShortcuts([
			{
				keys: ['Mod', 'z'],
				handler: prev,
			},
			{
				keys: isMac ? ['Mod', 'Shift', 'z'] : ['Mod', 'y'],
				handler: next,
			},
		]);

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

		return {
			hasNext,
			hasPrev,
			onNext,
			onPrev,
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
					@click="onPrev"
				/>
				<IconButton
					:icon-name="Outline.FORWARD"
					:size="22"
					:disabled="!hasNext"
					:data-test-id="$blockDiagramTestId('historyNextBtn')"
					@click="onNext"
				/>
			</slot>
		</div>
	`,
};
