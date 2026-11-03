import { Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { AirButtonStyle, ButtonSize } from 'ui.buttons';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { HeadlineMd, TextMd, TextSm, TextXs } from 'ui.system.typography.vue';
import { Button as UiButton } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useVersionHistoryStore } from '../../../../entities/blocks/stores/version-history';

const PUBLICATION_TYPE_PHRASES = {
	1: 'BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_PUBLICATION_TYPE_COMMON',
};

const SKELETON_ROWS = 3;
const SKELETON_LINE_HEIGHT = 32;
const ERROR_ICON_SIZE = 20;
const EMPTY_ICON_SIZE = 40;

type VersionRow = {
	id: number,
	versionNumber: number,
	createdAt: string,
	author: string,
	publicationType: string,
	isCurrent: boolean,
};

// @vue/component
export const VersionHistoryPanel = {
	name: 'VersionHistoryPanel',
	components: {
		BIcon,
		BLine,
		Chip,
		HeadlineMd,
		TextMd,
		TextSm,
		TextXs,
		UiButton,
	},
	emits: ['view', 'restore'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			ChipDesign,
			ChipSize,
			EMPTY_ICON_SIZE,
			ERROR_ICON_SIZE,
			Outline,
			SKELETON_ROWS,
			SKELETON_LINE_HEIGHT,
		};
	},
	data(): Object
	{
		return {
			isActive: true,
			requestedPublishedAt: null,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['templateId', 'lastPublishedAt']),
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
	watch: {
		// The window stays open while the person keeps working, so a publication made beside it adds a version
		// the list already shown does not have. Only a publication does: the autosaves of the same session
		// leave the list of versions as it was.
		lastPublishedAt(): void
		{
			if (this.isActive)
			{
				this.loadList();
			}
		},
	},
	mounted(): void
	{
		this.loadList();
	},
	activated(): void
	{
		this.isActive = true;
		if (this.requestedPublishedAt !== this.lastPublishedAt || this.errorMessage !== null)
		{
			this.loadList();
		}
	},
	deactivated(): void
	{
		this.isActive = false;
	},
	unmounted(): void
	{
		this.reset();
	},
	methods: {
		...mapActions(useVersionHistoryStore, ['loadVersions', 'reset']),
		loadList(): void
		{
			this.requestedPublishedAt = this.lastPublishedAt;
			void this.loadVersions(this.templateId);
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode) ?? '';
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
		<div class="bizprocdesigner-version-history" data-testid="bizprocdesigner-editor-version-history-panel">
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
			<div v-else-if="errorMessage" class="bizprocdesigner-version-history__error">
				<BIcon
					class="bizprocdesigner-version-history__error-icon"
					:name="Outline.EXCLAMATION_CIRCLE"
					:size="ERROR_ICON_SIZE"
				/>
				<TextSm
					role="alert"
					class="bizprocdesigner-version-history__error-text"
					data-testid="bizprocdesigner-editor-version-history-error"
				>
					{{ errorMessage }}
				</TextSm>
			</div>
			<div
				v-else-if="isEmpty"
				role="status"
				class="bizprocdesigner-version-history__empty"
				data-testid="bizprocdesigner-editor-version-history-empty"
			>
				<BIcon
					class="bizprocdesigner-version-history__empty-icon"
					:name="Outline.CLOCK_BACK"
					:size="EMPTY_ICON_SIZE"
				/>
				<HeadlineMd align="center">
					{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_EMPTY_TITLE') }}
				</HeadlineMd>
				<TextMd align="center">
					{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_EMPTY_TEXT') }}
				</TextMd>
			</div>
			<table v-else class="bizprocdesigner-version-history__table" data-testid="bizprocdesigner-editor-version-history-table">
				<thead>
					<tr>
						<th scope="col"><TextXs>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_NUMBER') }}</TextXs></th>
						<th scope="col"><TextXs>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_DATE') }}</TextXs></th>
						<th scope="col"><TextXs>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_AUTHOR') }}</TextXs></th>
						<th scope="col"><TextXs>{{ loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_COLUMN_TYPE') }}</TextXs></th>
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
								<TextMd accent>{{ row.versionNumber }}</TextMd>
								<Chip
									v-if="row.isCurrent"
									tabindex="-1"
									:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_CURRENT')"
									:size="ChipSize.Xs"
									:design="ChipDesign.OutlineAccent2"
								/>
							</div>
						</th>
						<td><TextMd wrap="break-words">{{ row.createdAt }}</TextMd></td>
						<td><TextMd wrap="break-words">{{ row.author }}</TextMd></td>
						<td><TextMd wrap="break-words">{{ row.publicationType }}</TextMd></td>
						<td>
							<div class="bizprocdesigner-version-history__actions">
								<UiButton
									:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ACTION_VIEW')"
									:size="ButtonSize.EXTRA_SMALL"
									:style="AirButtonStyle.OUTLINE"
									:dataset="{ testid: 'bizprocdesigner-editor-version-history-view-' + row.versionNumber }"
									@click="$emit('view', row.id)"
								/>
								<UiButton
									:text="loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_ACTION_RESTORE')"
									:size="ButtonSize.EXTRA_SMALL"
									:style="AirButtonStyle.OUTLINE"
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
