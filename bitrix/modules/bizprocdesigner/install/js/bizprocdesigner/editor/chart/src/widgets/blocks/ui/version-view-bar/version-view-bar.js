import { Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { AirButtonStyle, ButtonSize } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { Button as UiButton } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useVersionHistoryStore } from '../../../../entities/blocks/stores/version-history';

// No design for the bars exists yet, so the layout stays a single flex row
// instead of a stylesheet that would be rewritten together with the first UX iteration.
const BAR_LAYOUT_STYLE = 'display: flex; align-items: center; gap: 12px; flex-wrap: wrap;';

function loc(phraseCode: string, replacements: ?Object): string
{
	return Loc.getMessage(phraseCode, replacements) ?? '';
}

export function showVersionRestoreDialog(versionNumber: ?number, onConfirm: () => void): void
{
	MessageBox.confirm(
		loc('BIZPROCDESIGNER_EDITOR_VERSION_RESTORE_CONFIRM_MESSAGE'),
		loc('BIZPROCDESIGNER_EDITOR_VERSION_RESTORE_CONFIRM_TITLE', { '#NUMBER#': versionNumber ?? '' }),
		(messageBox) => {
			messageBox.close();
			onConfirm();
		},
		loc('BIZPROCDESIGNER_EDITOR_VERSION_RESTORE_CONFIRM_OK'),
		(messageBox) => {
			messageBox.close();
		},
		loc('BIZPROCDESIGNER_EDITOR_VERSION_RESTORE_CONFIRM_CANCEL'),
	);
}

// @vue/component
export const VersionViewBar = {
	name: 'VersionViewBar',
	components: {
		Alert,
		UiButton,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			AlertDesign,
			ButtonSize,
			BAR_LAYOUT_STYLE,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['isRestoreInProgress']),
		...mapState(useVersionHistoryStore, ['selectedVersion', 'selectedAuthorName']),
		versionNumber(): ?number
		{
			return this.selectedVersion?.versionNumber ?? null;
		},
		title(): string
		{
			return loc('BIZPROCDESIGNER_EDITOR_VERSION_VIEW_BAR_TITLE', { '#NUMBER#': this.versionNumber ?? '' });
		},
		meta(): string
		{
			return loc('BIZPROCDESIGNER_EDITOR_VERSION_VIEW_BAR_META', {
				'#DATE#': this.createdAt,
				'#AUTHOR#': this.author,
			});
		},
		createdAt(): string
		{
			const timestamp = this.selectedVersion?.createdTimestamp;
			if (!Type.isNumber(timestamp))
			{
				return loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_NO_DATA');
			}

			return DateTimeFormat.format(
				DateTimeFormat.getFormat('FORMAT_DATETIME'),
				new Date(timestamp * 1000),
			);
		},
		author(): string
		{
			return Type.isStringFilled(this.selectedAuthorName)
				? this.selectedAuthorName
				: loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_NO_DATA')
			;
		},
	},
	mounted(): void
	{
		// The dialog is destroyed together with the pressed button, so the focus falls back to the
		// menu that opened the history instead of the version being viewed.
		this.$el?.focus?.();
	},
	methods: {
		...mapActions(useDiagramStore, ['exitVersionView', 'restoreVersion']),
		loc,
		handleRestore(): void
		{
			const versionId = this.selectedVersion?.id;
			if (!Type.isNumber(versionId))
			{
				return;
			}

			showVersionRestoreDialog(this.versionNumber, () => {
				void this.restoreVersion(versionId);
			});
		},
		handleBack(): void
		{
			void this.exitVersionView();
		},
	},
	template: `
		<Alert
			v-if="selectedVersion"
			tabindex="-1"
			:design="AlertDesign.tinted"
			data-testid="bizprocdesigner-editor-version-view-bar"
		>
			<div :style="BAR_LAYOUT_STYLE">
				<span>{{ title }}</span>
				<span>{{ meta }}</span>
				<UiButton
					:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_VIEW_BAR_RESTORE')"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.EXTRA_SMALL"
					:disabled="isRestoreInProgress"
					:dataset="{ testid: 'bizprocdesigner-editor-version-view-bar-restore' }"
					@click="handleRestore"
				/>
				<UiButton
					:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_VIEW_BAR_BACK')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.EXTRA_SMALL"
					:disabled="isRestoreInProgress"
					:dataset="{ testid: 'bizprocdesigner-editor-version-view-bar-back' }"
					@click="handleBack"
				/>
			</div>
		</Alert>
	`,
};
