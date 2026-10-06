import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { AirButtonStyle, ButtonSize } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { Button as UiButton } from 'ui.vue3.components.button';
import { hint } from 'ui.vue3.directives.hint';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { usePublishTemplate } from '../../../../features/blocks/composables/use-publish-template';

// No design for the bars exists yet, so the layout stays a single flex row
// instead of a stylesheet that would be rewritten together with the first UX iteration.
const BAR_LAYOUT_STYLE = 'display: flex; align-items: center; gap: 12px; flex-wrap: wrap;';

// @vue/component
export const RestoreUndoBar = {
	name: 'RestoreUndoBar',
	components: {
		Alert,
		UiButton,
	},
	directives: {
		hint,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			AlertDesign,
			ButtonSize,
			BAR_LAYOUT_STYLE,
			...usePublishTemplate(),
		};
	},
	computed: {
		...mapState(useDiagramStore, ['isRestoreInProgress']),
		isBusy(): boolean
		{
			return this.isRestoreInProgress || this.isPublishing;
		},
		// The same right decides the toolbar button: a user who may restore a version into the draft
		// still may not publish it, and must not be offered an action the server would reject.
		isPublishDisabled(): boolean
		{
			return this.isBusy || !this.canPublish;
		},
	},
	mounted(): void
	{
		LiveAnnouncer.announce(this.loc('BIZPROCDESIGNER_EDITOR_RESTORE_UNDO_BAR_TEXT'));
	},
	methods: {
		...mapActions(useDiagramStore, ['undoRestore', 'discardRestoreBackup']),
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode) ?? '';
		},
		handleUndo(): void
		{
			void this.undoRestore();
		},
		handleDiscard(): void
		{
			MessageBox.confirm(
				this.loc('BIZPROCDESIGNER_EDITOR_RESTORE_DISCARD_CONFIRM_MESSAGE'),
				this.loc('BIZPROCDESIGNER_EDITOR_RESTORE_DISCARD_CONFIRM_TITLE'),
				(messageBox) => {
					messageBox.close();
					void this.discardRestoreBackup();
				},
				this.loc('BIZPROCDESIGNER_EDITOR_RESTORE_DISCARD_CONFIRM_OK'),
				(messageBox) => {
					messageBox.close();
				},
				this.loc('BIZPROCDESIGNER_EDITOR_RESTORE_DISCARD_CONFIRM_CANCEL'),
			);
		},
	},
	template: `
		<Alert
			:design="AlertDesign.tintedWarning"
			data-testid="bizprocdesigner-editor-restore-undo-bar"
		>
			<div :style="BAR_LAYOUT_STYLE">
				<span>{{ loc('BIZPROCDESIGNER_EDITOR_RESTORE_UNDO_BAR_TEXT') }}</span>
				<span v-hint="publishAccessHint">
					<UiButton
						:text="loc('BIZPROCDESIGNER_EDITOR_PUBLISH')"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.EXTRA_SMALL"
						:disabled="isPublishDisabled"
						:dataset="{ testid: 'bizprocdesigner-editor-restore-publish-button' }"
						@click="publishTemplate"
					/>
				</span>
				<UiButton
					:text="loc('BIZPROCDESIGNER_EDITOR_RESTORE_UNDO_BAR_UNDO')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.EXTRA_SMALL"
					:disabled="isBusy"
					:dataset="{ testid: 'bizprocdesigner-editor-restore-undo-button' }"
					@click="handleUndo"
				/>
				<UiButton
					:text="loc('BIZPROCDESIGNER_EDITOR_RESTORE_UNDO_BAR_DISCARD')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.EXTRA_SMALL"
					:disabled="isBusy"
					:dataset="{ testid: 'bizprocdesigner-editor-restore-discard-button' }"
					@click="handleDiscard"
				/>
			</div>
		</Alert>
	`,
};
