import { Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Dialog } from 'ui.system.dialog';
import { BLine } from 'ui.system.skeleton.vue';
import { HeadlineMd, TextMd, TextSm, TextXs } from 'ui.system.typography.vue';
import { markRaw } from 'ui.vue3';
import { Button as UiButton } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore } from '../../../../entities/blocks/stores/diagram';
import { useFragmentLibraryStore } from '../../../../entities/fragment-library';
import { editorAPI } from '../../../../shared/api';
import { useLoc } from '../../../../shared/composables';
import { makeDialogDraggable } from '../../../../shared/utils';
import { FragmentLibraryItem } from '../fragment-library-item/fragment-library-item';
import './style.css';

// ui.system.dialog fixes the width (it passes width as both minWidth and maxWidth) and the popup only
// shifts a box that does not fit, so the viewport cap has to be applied here.
const DIALOG_WIDTH = 700;
const DIALOG_VIEWPORT_GAP = 32;

const SKELETON_ROWS = 3;
const SKELETON_LINE_HEIGHT = 32;
const ERROR_ICON_SIZE = 20;
const EMPTY_ICON_SIZE = 48;

const MESSAGE_IDS = Object.freeze({
	title: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_TITLE',
	subtitle: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_SUBTITLE',
	close: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_BUTTON_CLOSE',
	columnName: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_COLUMN_NAME',
	columnAuthor: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_COLUMN_AUTHOR',
	columnNodes: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_COLUMN_NODES',
	columnActions: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_COLUMN_ACTIONS',
	loadMore: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_ACTION_LOAD_MORE',
	pageLoadedAnnounce: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_PAGE_LOADED_ANNOUNCE',
	emptyTitle: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_EMPTY_TITLE',
	emptyText: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_EMPTY_TEXT',
	errorCommon: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_ERROR_COMMON',
	errorReloadPage: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_ERROR_RELOAD_PAGE',
	noData: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_WINDOW_NO_DATA',
});

/**
 * The library of the portal as a window over the living canvas (API-01). It is not modal: a click on the
 * scheme is not a way out of it, and the fragment is added while it stays open. The list is read anew on
 * every opening - the library is changed by other people, and what was read the last time is shown to
 * nobody.
 */
// @vue/component
export const FragmentLibraryWindow = {
	name: 'FragmentLibraryWindow',
	components: {
		BIcon,
		BLine,
		FragmentLibraryItem,
		HeadlineMd,
		TextMd,
		TextSm,
		TextXs,
		UiButton,
	},
	emits: ['close', 'insert'],
	setup(): Object
	{
		return {
			...useLoc(),
			AirButtonStyle,
			ButtonSize,
			EMPTY_ICON_SIZE,
			ERROR_ICON_SIZE,
			MESSAGE_IDS,
			Outline,
			SKELETON_ROWS,
			SKELETON_LINE_HEIGHT,
		};
	},
	data(): Object
	{
		return {
			instance: null,
			authorNames: {},
		};
	},
	computed: {
		...mapState(useFragmentLibraryStore, [
			'items',
			'hasMore',
			'isLoading',
			'errorCode',
			'isEmpty',
			'isSurfaceUnavailable',
		]),
		...mapState(diagramStore, ['insertingFragmentId', 'isWriteLocked']),
		isFirstPageLoading(): boolean
		{
			return this.isLoading && this.items.length === 0;
		},
		/**
		 * The canvas refuses an insertion in every state the write lock covers, the overlay of a busy
		 * template among them: the same lock raises it, and under it there is no canvas to add to at all.
		 */
		isInsertDisabled(): boolean
		{
			return this.isWriteLocked;
		},
		errorMessage(): string
		{
			if (this.errorCode === null)
			{
				return '';
			}

			return this.getMessage(
				this.isSurfaceUnavailable ? MESSAGE_IDS.errorReloadPage : MESSAGE_IDS.errorCommon,
			);
		},
	},
	watch: {
		// The names of the authors are read for the page that arrived: the first one and every one the
		// person asks for after it.
		items(): void
		{
			void this.loadAuthorNames();
		},
	},
	mounted(): void
	{
		this.getDialog().setContent(this.$refs.content);
		this.getDialog().show();
		makeDialogDraggable(this.$refs.content);
		void this.loadFirstPage();
	},
	unmounted(): void
	{
		this.instance?.hide();
	},
	methods: {
		...mapActions(useFragmentLibraryStore, ['loadFirstPage', 'loadMore']),
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
				text: this.getMessage(MESSAGE_IDS.close),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				dataset: { testid: 'bizprocdesigner-fragment-library-close' },
			});

			const dialog = new Dialog({
				title: this.getMessage(MESSAGE_IDS.title),
				subtitle: this.getMessage(MESSAGE_IDS.subtitle),
				centerButtons: [close],
				events: {
					onHide: this.closePopup,
				},
				width: Math.min(DIALOG_WIDTH, window.innerWidth - DIALOG_VIEWPORT_GAP),
				// The window is meant to stay open while a person works on the scheme, and every click on
				// the scheme lands outside it. Closing is left to the close button, the cross and Esc.
				closeByClickOutside: false,
			});

			close.bindEvent('click', () => {
				dialog.hide();
			});

			return dialog;
		},
		resolveAuthor(authorId: ?number): string
		{
			const name = Type.isNumber(authorId) ? this.authorNames[String(authorId)] : null;

			return Type.isStringFilled(name) ? name : this.getMessage(MESSAGE_IDS.noData);
		},
		async loadAuthorNames(): Promise<void>
		{
			const missing = [...new Set(
				this.items
					.map((item) => item.authorId)
					.filter((authorId) => Type.isNumber(authorId) && authorId > 0),
			)].filter((authorId) => !(String(authorId) in this.authorNames));

			if (missing.length === 0)
			{
				return;
			}

			const names = await editorAPI.fetchUserNames(missing);
			this.authorNames = { ...this.authorNames, ...names };
		},
		/**
		 * A page that arrived adds rows below the ones already read, and neither the busy container nor
		 * the table says so: the person who does not see the list is told how long it has become.
		 */
		async loadNextPage(): Promise<void>
		{
			await this.loadMore();

			if (this.errorCode === null)
			{
				LiveAnnouncer.announce(this.getMessage(
					MESSAGE_IDS.pageLoadedAnnounce,
					{ '#COUNT#': this.items.length },
				));
			}
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div
			ref="content"
			tabindex="-1"
			class="bizprocdesigner-fragment-library"
			:aria-busy="isLoading"
			data-testid="bizprocdesigner-fragment-library"
		>
			<div v-if="errorMessage" class="bizprocdesigner-fragment-library__error">
				<BIcon
					class="bizprocdesigner-fragment-library__error-icon"
					:name="Outline.EXCLAMATION_CIRCLE"
					:size="ERROR_ICON_SIZE"
				/>
				<TextSm
					role="alert"
					class="bizprocdesigner-fragment-library__error-text"
					data-testid="bizprocdesigner-fragment-library-error"
				>
					{{ errorMessage }}
				</TextSm>
			</div>
			<div
				v-if="isFirstPageLoading"
				class="bizprocdesigner-fragment-library__skeleton"
				data-testid="bizprocdesigner-fragment-library-loading"
			>
				<BLine
					v-for="line in SKELETON_ROWS"
					:key="line"
					:height="SKELETON_LINE_HEIGHT"
				/>
			</div>
			<div
				v-else-if="isEmpty"
				role="status"
				class="bizprocdesigner-fragment-library__empty"
				data-testid="bizprocdesigner-fragment-library-empty"
			>
				<div
					aria-hidden="true"
					class="bizprocdesigner-fragment-library__empty-icon"
					data-testid="bizprocdesigner-fragment-library-empty-icon"
				>
					<BIcon :name="Outline.LIBRARY_BASE" :size="EMPTY_ICON_SIZE"/>
				</div>
				<HeadlineMd align="center">{{ getMessage(MESSAGE_IDS.emptyTitle) }}</HeadlineMd>
				<TextMd align="center">{{ getMessage(MESSAGE_IDS.emptyText) }}</TextMd>
			</div>
			<table
				v-else-if="items.length > 0"
				class="bizprocdesigner-fragment-library__table"
				data-testid="bizprocdesigner-fragment-library-table"
			>
				<thead>
					<tr>
						<th scope="col"><TextXs>{{ getMessage(MESSAGE_IDS.columnName) }}</TextXs></th>
						<th scope="col"><TextXs>{{ getMessage(MESSAGE_IDS.columnAuthor) }}</TextXs></th>
						<th scope="col"><TextXs>{{ getMessage(MESSAGE_IDS.columnNodes) }}</TextXs></th>
						<th scope="col">
							<visually-hidden>{{ getMessage(MESSAGE_IDS.columnActions) }}</visually-hidden>
						</th>
					</tr>
				</thead>
				<tbody>
					<FragmentLibraryItem
						v-for="item in items"
						:key="item.id"
						:item="item"
						:authorName="resolveAuthor(item.authorId)"
						:isInserting="insertingFragmentId === item.id"
						:isInsertDisabled="isInsertDisabled"
						@insert="$emit('insert', $event)"
					/>
				</tbody>
			</table>
			<div v-if="hasMore" class="bizprocdesigner-fragment-library__more">
				<UiButton
					:text="getMessage(MESSAGE_IDS.loadMore)"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:loading="isLoading"
					:dataset="{ testid: 'bizprocdesigner-fragment-library-load-more' }"
					@click="loadNextPage"
				/>
			</div>
		</div>
	`,
};
