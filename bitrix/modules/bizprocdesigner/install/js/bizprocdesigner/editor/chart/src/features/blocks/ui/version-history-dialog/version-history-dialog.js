import { Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { Dialog } from 'ui.system.dialog';
import { BLine } from 'ui.system.skeleton.vue';
import { HeadlineMd, TextMd, TextSm } from 'ui.system.typography.vue';
import { markRaw } from 'ui.vue3';
import { Button as UiButton } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useVersionHistoryStore } from '../../../../entities/blocks/stores/version-history';
import './style.css';

const PUBLICATION_TYPE_PHRASES = {
	1: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_PUBLICATION_TYPE_COMMON',
};

const SKELETON_ROWS = 3;
const SKELETON_LINE_HEIGHT = 32;
// ui.system.dialog fixes the width (it passes width as both minWidth and maxWidth) and the
// popup only shifts a box that does not fit, so the viewport cap has to be applied here.
const DIALOG_WIDTH = 874;
const DIALOG_VIEWPORT_GAP = 32;

type VersionRow = {
	id: number,
	versionNumber: number,
	createdAt: string,
	author: string,
	publicationType: string,
	isCurrent: boolean,
};

// @vue/component
export const VersionHistoryDialog = {
	name: 'VersionHistoryDialog',
	components: {
		BLine,
		Chip,
		HeadlineMd,
		TextMd,
		TextSm,
		UiButton,
	},
	emits: ['close', 'view', 'restore'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			ChipDesign,
			ChipSize,
			SKELETON_ROWS,
			SKELETON_LINE_HEIGHT,
		};
	},
	data(): Object
	{
		return {
			instance: null,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['templateId']),
		...mapState(useVersionHistoryStore, ['versions', 'authorNames', 'isLoading', 'errorMessage', 'isEmpty']),
		rows(): Array<VersionRow>
		{
			return this.versions.map((version) => ({
				id: version.id,
				versionNumber: version.versionNumber,
				createdAt: this.formatCreatedAt(version.createdTimestamp),
				author: this.resolveAuthor(version.authorId),
				publicationType: this.resolvePublicationType(version.publicationType),
				isCurrent: version.isCurrent === true,
			}));
		},
	},
	mounted(): void
	{
		this.getDialog().setContent(this.$refs.content);
		this.getDialog().show();
		void this.loadVersions(this.templateId);
	},
	unmounted(): void
	{
		this.instance?.hide();
		this.reset();
	},
	methods: {
		...mapActions(useVersionHistoryStore, ['loadVersions', 'reset']),
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode) ?? '';
		},
		getDialog(): Dialog
		{
			if (!this.instance)
			{
				this.instance = markRaw(this.createDialog());
			}

			return this.instance;
		},
		createDialog(): Dialog
		{
			const close = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_BUTTON_CLOSE'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				dataset: { testid: 'bizprocdesigner-editor-version-history-close' },
			});

			const dialog = new Dialog({
				title: this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_TITLE'),
				subtitle: this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_SUBTITLE'),
				centerButtons: [close],
				events: {
					onHide: this.closePopup,
				},
				width: Math.min(DIALOG_WIDTH, window.innerWidth - DIALOG_VIEWPORT_GAP),
			});

			close.bindEvent('click', () => {
				dialog.hide();
			});

			return dialog;
		},
		closePopup(): void
		{
			this.$emit('close');
		},
		formatCreatedAt(timestamp: ?number): string
		{
			if (!Type.isNumber(timestamp))
			{
				return this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_NO_DATA');
			}

			return DateTimeFormat.format(
				DateTimeFormat.getFormat('FORMAT_DATETIME'),
				new Date(timestamp * 1000),
			);
		},
		resolveAuthor(authorId: ?number): string
		{
			const name = Type.isNumber(authorId) ? this.authorNames[String(authorId)] : null;

			return Type.isStringFilled(name) ? name : this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_NO_DATA');
		},
		resolvePublicationType(publicationType: number): string
		{
			const phraseCode = PUBLICATION_TYPE_PHRASES[publicationType];

			return phraseCode
				? this.loc(phraseCode)
				: this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_NO_DATA')
			;
		},
	},
	template: `
		<div
			ref="content"
			class="bizprocdesigner-version-history"
			data-testid="bizprocdesigner-editor-version-history"
		>
			<div
				v-if="isLoading"
				class="bizprocdesigner-version-history__skeleton"
				data-testid="bizprocdesigner-editor-version-history-loading"
			>
				<BLine
					v-for="line in SKELETON_ROWS"
					:key="line"
					:height="SKELETON_LINE_HEIGHT"
				/>
			</div>
			<TextMd
				v-else-if="errorMessage"
				role="alert"
				align="center"
				class="bizprocdesigner-version-history__error"
				data-testid="bizprocdesigner-editor-version-history-error"
			>
				{{ errorMessage }}
			</TextMd>
			<div
				v-else-if="isEmpty"
				class="bizprocdesigner-version-history__empty"
				data-testid="bizprocdesigner-editor-version-history-empty"
			>
				<HeadlineMd align="center">
					{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_EMPTY_TITLE') }}
				</HeadlineMd>
				<TextMd align="center">
					{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_EMPTY_TEXT') }}
				</TextMd>
			</div>
			<table v-else class="bizprocdesigner-version-history__table">
				<thead>
					<tr>
						<th scope="col"><TextSm>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_NUMBER') }}</TextSm></th>
						<th scope="col"><TextSm>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_DATE') }}</TextSm></th>
						<th scope="col"><TextSm>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_AUTHOR') }}</TextSm></th>
						<th scope="col"><TextSm>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_TYPE') }}</TextSm></th>
						<td></td>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="row in rows"
						:key="row.id"
						:data-testid="'bizprocdesigner-editor-version-history-row-' + row.versionNumber"
					>
						<th scope="row">
							<div class="bizprocdesigner-version-history__number">
								<TextMd>{{ row.versionNumber }}</TextMd>
								<Chip
									v-if="row.isCurrent"
									tabindex="-1"
									:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_CURRENT')"
									:size="ChipSize.Xs"
									:design="ChipDesign.OutlineAccent2"
								/>
							</div>
						</th>
						<td><TextMd tag="div" wrap="truncate">{{ row.createdAt }}</TextMd></td>
						<td><TextMd tag="div" wrap="truncate">{{ row.author }}</TextMd></td>
						<td><TextMd tag="div" wrap="truncate">{{ row.publicationType }}</TextMd></td>
						<td>
							<div class="bizprocdesigner-version-history__actions">
								<UiButton
									:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ACTION_VIEW')"
									:size="ButtonSize.EXTRA_SMALL"
									:style="AirButtonStyle.PLAIN"
									:dataset="{ testid: 'bizprocdesigner-editor-version-history-view-' + row.versionNumber }"
									@click="$emit('view', row.id)"
								/>
								<UiButton
									:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ACTION_RESTORE')"
									:size="ButtonSize.EXTRA_SMALL"
									:style="AirButtonStyle.PLAIN"
									:dataset="{ testid: 'bizprocdesigner-editor-version-history-restore-' + row.versionNumber }"
									@click="$emit('restore', row.id)"
								/>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	`,
};
