import { Dom, Loc, Runtime, Type } from 'main.core';
import { FocusNavigator } from 'ui.a11y';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { Dialog } from 'ui.system.dialog';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { defineComponent, markRaw } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import {
	elementId,
	makeDialogDraggable,
	type ProcessDataElement,
	type Purpose,
	useProcessDataStore,
} from 'bizprocdesigner.editor.chart';

import { ElementForm } from './element-form';
import { ProcessDataList, type ProcessDataGroup } from './process-data-list';
import './process-data.css';

const PURPOSE_ORDER: Purpose[] = ['input', 'internal', 'constant', 'shared'];
const SKELETON_LINES = [0, 1, 2, 3, 4];

// ui.system.dialog fixes the width (it passes width as both minWidth and maxWidth) and the popup only
// shifts a box that does not fit, so the viewport cap has to be applied here. Same size as the history
// of the process: both windows stand over the scheme and are read next to it.
const DIALOG_WIDTH = 700;
const DIALOG_VIEWPORT_GAP = 32;

const POPUP_CLASS = 'bizprocdesigner-process-data-popup';

// The whole list is filtered and re-rendered on every applied term, so it follows the typing instead
// of every keystroke of it.
const SEARCH_DEBOUNCE_MS = 200;

export const ProcessDataWindow = defineComponent({
	name: 'BizprocDesignerProcessDataWindow',
	components: {
		Alert,
		BInput,
		BLine,
		ElementForm,
		ProcessDataList,
		UiButton,
	},
	setup(): Object
	{
		return {
			store: useProcessDataStore(),
			AirButtonStyle,
			AlertDesign,
			ButtonSize,
			InputDesign,
			InputSize,
		};
	},
	data(): {
		query: string,
		needle: string,
		isCreating: boolean,
		instance: Dialog | null,
		opener: HTMLElement | null,
		} {
		return {
			query: '',
			// The term the list stands on: the typed one reaches it when the typing stops.
			needle: '',
			isCreating: false,
			instance: null,
			// Read before the window opens: the element that called it takes the focus back on close.
			opener: FocusNavigator.getActiveElement(),
		};
	},
	computed: {
		title(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_TITLE') ?? '';
		},
		purposeGroups(): ProcessDataGroup[]
		{
			return PURPOSE_ORDER
				.map((purpose: Purpose) => ({
					id: purpose,
					title: Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_GROUP_${purpose.toUpperCase()}`),
					hint: Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_GROUP_${purpose.toUpperCase()}_HINT`),
					items: this.matching(this.store.byPurpose(purpose)),
				}))
				// While a search is on, a group with nothing found is noise, not an invitation to fill it.
				.filter((group: ProcessDataGroup) => this.needle === '' || group.items.length > 0)
			;
		},
		isFormShown(): boolean
		{
			return this.isCreating || this.store.selected !== null;
		},
		// A refusal of the catalog itself has no form to land in, so the window itself has to name it.
		loadError(): string
		{
			if (this.store.isLoading || this.isFormShown || this.store.errors.length === 0)
			{
				return '';
			}

			const named = this.store.errors
				.map((error) => error.message)
				.find((message: string) => message !== '')
			;

			return named ?? (Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_LOAD_ERROR') ?? '');
		},
		hasResults(): boolean
		{
			return this.purposeGroups.some((group: ProcessDataGroup) => group.items.length > 0);
		},
		isSearchEmpty(): boolean
		{
			return this.needle !== '' && !this.hasResults;
		},
		readOnlyNotice(): string
		{
			if (this.store.mechanics === 'legacy')
			{
				return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_READONLY_LEGACY') ?? '';
			}

			if (!this.store.canEdit)
			{
				return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_READONLY_NO_RIGHTS') ?? '';
			}

			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_READONLY_LOCKED') ?? '';
		},
		// The header is the one part of the window that never scrolls away, so the mode of the whole
		// window is read there instead of eating a line above the list.
		subtitle(): string
		{
			return this.store.isLoading || !this.store.isReadOnly ? '' : this.readOnlyNotice;
		},
		runningInstancesNotice(): string
		{
			return Loc.getMessage(
				'BIZPROCDESIGNER_EDITOR_PROCESS_DATA_RUNNING_INSTANCES',
				{ '#COUNT#': String(this.store.runningInstances) },
			) ?? '';
		},
		searchPlaceholder(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_SEARCH_PLACEHOLDER') ?? '';
		},
		addText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_ADD') ?? '';
		},
		backText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_BACK') ?? '';
		},
		emptySearchText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_EMPTY_SEARCH') ?? '';
		},
		loadingText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_LOADING') ?? '';
		},
		skeletonLines: (): number[] => SKELETON_LINES,
	},
	watch: {
		// The window is not modal and its header is the only place a state of the whole window is read.
		subtitle(value: string): void
		{
			this.instance?.setSubtitle(value);
			this.dressPopup();
		},
		query(): void
		{
			this.applyQuery();
		},
	},
	created(): void
	{
		this.applyQuery = Runtime.debounce(() => {
			this.needle = this.query.trim().toLowerCase();
		}, SEARCH_DEBOUNCE_MS, this);
	},
	mounted(): void
	{
		this.getDialog().setContent(this.$refs.content);
		this.getDialog().show();
		// The window is added to the end of the body, so without the focus taken into it a person
		// tabbing from the menu it was opened from walks the whole editor to reach it. It lands on the
		// window itself and not on its first control: the window is read before it is acted upon.
		this.dressPopup()?.focus({ preventScroll: true });
	},
	unmounted(): void
	{
		this.instance?.hide();
		this.opener?.focus({ preventScroll: true });
	},
	methods: {
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
			return new Dialog({
				title: this.title,
				subtitle: this.subtitle,
				events: {
					onHide: this.handleClose,
				},
				width: Math.min(DIALOG_WIDTH, window.innerWidth - DIALOG_VIEWPORT_GAP),
				// The window is meant to stay open while a person edits the scheme, and every click on
				// the scheme lands outside it. Closing is left to the close button, the cross and Esc.
				closeByClickOutside: false,
			});
		},
		/**
		 * Every setter of the dialog re-renders the header, the content and the footer, so the popup is
		 * dressed again after each of them. The class is what hides the footer left without buttons, and
		 * the tabindex is what lets the window itself take the focus when it opens.
		 *
		 * The window is meant to stay open over the scheme, so it must not hold the focus either: the trap
		 * the popup arms by default loops Tab inside the window, and dropping the loop is what a non-modal
		 * window needs. Nothing outside it is isolated in the first place.
		 */
		dressPopup(): HTMLElement | null
		{
			const popup = makeDialogDraggable(this.$refs.content);
			if (!popup)
			{
				return null;
			}

			const container = popup.getPopupContainer();
			Dom.addClass(container, POPUP_CLASS);
			Dom.attr(container, 'aria-label', this.title);
			Dom.attr(container, 'tabindex', '-1');
			popup.getFocusTrap()?.setLooped(false);

			return container;
		},
		matching(elements: ProcessDataElement[]): ProcessDataElement[]
		{
			if (this.needle === '')
			{
				return elements;
			}

			return elements.filter((element: ProcessDataElement) => {
				const name = Type.isStringFilled(element.property?.Name) ? element.property.Name : '';

				return element.key.toLowerCase().includes(this.needle)
					|| name.toLowerCase().includes(this.needle);
			});
		},
		handleSelect(element: ProcessDataElement): void
		{
			this.store.selectedId = elementId(element.sourceType, element.key);
			this.isCreating = false;
		},
		handleAdd(): void
		{
			this.store.selectedId = null;
			this.isCreating = true;
		},
		handleClose(): void
		{
			this.store.close();
		},
		handleFormClose(): void
		{
			this.isCreating = false;
			this.store.selectedId = null;
		},
	},
	template: `
		<div
			ref="content"
			class="bizprocdesigner-process-data"
			data-testid="bizprocdesigner-process-data-window"
		>
			<Alert
				v-if="loadError !== ''"
				class="bizprocdesigner-process-data__notice"
				:design="AlertDesign.tintedAlert"
				role="alert"
				data-testid="bizprocdesigner-process-data-error"
			>
				{{ loadError }}
			</Alert>
			<Alert
				v-if="!store.isLoading && store.runningInstances > 0"
				class="bizprocdesigner-process-data__notice"
				:design="AlertDesign.tintedWarning"
				data-testid="bizprocdesigner-process-data-running-instances"
			>
				{{ runningInstancesNotice }}
			</Alert>
			<div v-if="isFormShown" class="bizprocdesigner-process-data__toolbar">
				<UiButton
					:text="backText"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.PLAIN"
					:dataset="{ testid: 'bizprocdesigner-process-data-back' }"
					@click="handleFormClose"
				/>
			</div>
			<div v-else class="bizprocdesigner-process-data__toolbar">
				<BInput
					v-model="query"
					class="bizprocdesigner-process-data__search"
					type="search"
					:size="InputSize.Sm"
					:design="InputDesign.Grey"
					:placeholder="searchPlaceholder"
					:ariaLabel="searchPlaceholder"
					stretched
					data-testid="bizprocdesigner-process-data-search"
				/>
				<UiButton
					v-if="!store.isReadOnly"
					class="bizprocdesigner-process-data__add"
					:text="addText"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.FILLED"
					:dataset="{ testid: 'bizprocdesigner-process-data-add' }"
					@click="handleAdd"
				/>
			</div>
			<div class="bizprocdesigner-process-data__body">
				<div
					v-if="store.isLoading"
					class="bizprocdesigner-process-data__skeleton"
					role="status"
					:aria-label="loadingText"
					aria-busy="true"
					data-testid="bizprocdesigner-process-data-skeleton"
				>
					<BLine v-for="line in skeletonLines" :key="line"/>
				</div>
				<ElementForm
					v-else-if="isFormShown"
					:element="store.selected"
					@close="handleFormClose"
				/>
				<p
					v-else-if="isSearchEmpty"
					class="bizprocdesigner-process-data__empty"
					data-testid="bizprocdesigner-process-data-empty-search"
				>
					{{ emptySearchText }}
				</p>
				<ProcessDataList
					v-else
					:groups="purposeGroups"
					:selectedId="store.selectedId"
					@select="handleSelect"
				/>
			</div>
		</div>
	`,
});
