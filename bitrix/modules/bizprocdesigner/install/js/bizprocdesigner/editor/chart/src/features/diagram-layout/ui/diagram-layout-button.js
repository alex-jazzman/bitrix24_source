/** Toolbar surface of the automatic diagram layout feature (TPL-02). */

import { UI } from 'ui.notification';
import { defineComponent } from 'ui.vue3';
import { Outline } from 'ui.icon-set.api.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { useLoc } from '../../../shared/composables';
import { LAYOUT_REJECTED_REASON, LAYOUT_UNCHANGED_REASON } from '../model/types';
import { useDiagramLayout } from '../model/use-diagram-layout';
import type { LayoutNoticeReason, UseDiagramLayout } from '../model/use-diagram-layout';

const BUTTON_TEST_ID = 'diagramLayoutButton';

const NOTIFICATION_DELAY_MS = 4000;

/** Phrase of every outcome a run reports to the user. */
const NOTICE_MESSAGE_IDS: { +[LayoutNoticeReason]: string } = Object.freeze({
	[LAYOUT_REJECTED_REASON.invalidGraph]: 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_ERROR_INVALID_GRAPH',
	[LAYOUT_REJECTED_REASON.unsafeGeometry]: 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_ERROR_GEOMETRY',
	[LAYOUT_REJECTED_REASON.invalidFrame]: 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_ERROR_FRAME',
	[LAYOUT_REJECTED_REASON.groupOverlap]: 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_ERROR_OVERLAP',
	[LAYOUT_REJECTED_REASON.modelChanged]: 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_ERROR_MODEL_CHANGED',
	[LAYOUT_UNCHANGED_REASON.singleRigidFrame]: 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_INFO_SINGLE_FRAME',
	[LAYOUT_UNCHANGED_REASON.degenerateInput]: 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_INFO_NOTHING_TO_ARRANGE',
});

/**
 * Phrase of a run that threw. The history snapshot is the only step of a run past the write into
 * the model, so a throw leaves the diagram arranged with no step to undo it by.
 */
const RUN_FAILED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_ERROR_HISTORY';

type DiagramLayoutButtonSetup = {
	getMessage: (messageId: string) => string,
	notice: (messageId: string) => void,
	layout: UseDiagramLayout,
	buttonIcon: string,
	buttonSize: string,
	buttonStyle: string,
};

// @vue/component
export const DiagramLayoutButton = defineComponent({
	name: 'BizprocdesignerDiagramLayoutButton',
	components: { UiButton },
	setup(): DiagramLayoutButtonSetup
	{
		const { getMessage } = useLoc();

		const notice = (messageId: string): void => {
			UI.Notification.Center.notify({
				content: getMessage(messageId),
				autoHideDelay: NOTIFICATION_DELAY_MS,
			});
		};

		const layout = useDiagramLayout({
			notify: (reason: LayoutNoticeReason): void => notice(NOTICE_MESSAGE_IDS[reason]),
		});

		return {
			getMessage,
			notice,
			layout,
			buttonIcon: Outline.GRAPHS_DIAGRAM,
			buttonSize: ButtonSize.SMALL,
			buttonStyle: AirButtonStyle.PLAIN_NO_ACCENT,
		};
	},
	computed: {
		// $testId of the extension emits data-test-id, and ui.buttons puts the dataset on its root.
		buttonDataset(): { testId: string }
		{
			return { testId: this.$testId(BUTTON_TEST_ID) };
		},
		isDisabled(): boolean
		{
			return !this.layout.isAvailable();
		},
	},
	methods: {
		async handleButtonClick(): Promise<void>
		{
			if (this.isDisabled)
			{
				return;
			}

			// Every outcome of a completed run is reported by the run itself; a throw is not, and left
			// alone it would reject the click with no notice of a result the user cannot undo.
			try
			{
				await this.layout.run();
			}
			catch
			{
				this.notice(RUN_FAILED_MESSAGE_ID);
			}
		},
	},
	template: `
		<UiButton
			:text="getMessage('BIZPROCDESIGNER_EDITOR_DIAGRAM_LAYOUT_AUTO')"
			:size="buttonSize"
			:style="buttonStyle"
			:leftIcon="buttonIcon"
			:disabled="isDisabled"
			:dataset="buttonDataset"
			@click="handleButtonClick"
		/>
	`,
});
