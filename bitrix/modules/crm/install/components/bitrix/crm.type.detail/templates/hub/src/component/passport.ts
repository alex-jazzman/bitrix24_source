import { defineComponent, type Component, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { CrmHubPassportHero, type ScalarRecord, type SettingsRecord } from 'crm.settings-hub';

import { canEditCustomSection, type HubBaseline, readCustomSections } from '../lib/hub-baseline/hub-baseline';
import { isCreationEditPinned } from '../lib/creation-edit-pin/creation-edit-pin';
import {
	resolvePlacementButtonLabel,
	resolvePlacementTitle,
} from '../lib/resolve-placement-title/resolve-placement-title';

// Passport of the process: name, description and the placement button. It lives in the shell's
// `passport` slot, so it is shown above every section instead of disappearing when the reader leaves
// the first one.
//
// The meta row of counts ("1 воронка · 12 стадий · 3 робота") is gone: the mockup of 2026-09-01
// deletes it from the passport outright, and the PM confirmed the deletion rather than the prose
// rewrite that was on the table. Placement came back here from the "Расположение" card of the same
// mockup — only the frame moved, the control below is the same compact CrmTypeHubCustomSectionControl
// with its dialog, inline editor, permission alert and revert registry untouched (D-17).
//
// On the CREATION screen (creationMode) the same hero opens straight in edit mode and stays there: the
// caret is in the empty name with its grey placeholder, the description is an editable two-row
// textarea with no prompt, and under the hero stand "Сохранить" and "Отменить". The pattern is the one
// accepted on the creation screen of a digital workplace (D-19). On the editing screen of a saved
// type none of it applies: the name and the description open for editing from the pencil or a click.
//
// The placement button is the same on both screens (owner, T12: "и на настройке тоже"): the stock
// outline accent-2 AIR style and the caption "Расположен в: <workplace>", CRM when there is none.
export const CrmTypeHubPassport = defineComponent({
	name: 'CrmTypeHubPassport',
	components: {
		CrmHubPassportHero,
		UiButton,
	},
	mixins: [locMixin],
	props: {
		// The FULL record list, not a section slice: the passport sits above the sections and the
		// shell hands its slot no records of its own.
		records: {
			type: Array as PropType<SettingsRecord[]>,
			default: () => [],
		},
		snapshot: {
			type: Object as PropType<HubBaseline>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		controls: {
			type: Object as PropType<Record<string, Component>>,
			default: null,
		},
		// Creation mode only. The shell's save panel is hidden while the type is being created, so
		// the hero carries the single action of that screen; on the editing screen both flags stay
		// false and the hero renders exactly as before.
		showCreationSaveButton: {
			type: Boolean,
			default: false,
		},
		creationSaveInProgress: {
			type: Boolean,
			default: false,
		},
		// "The draft cannot be saved yet" — today that means an empty name, the one truly required
		// column of a type. The verdict arrives ready-made: the hero has no store of its own and must
		// not start guessing at the form's validity.
		creationSaveDisabled: {
			type: Boolean,
			default: false,
		},
		// The creation mode arrives already LATCHED from app.ts (creationPreview.active): the passport
		// does not read the store and does not work the mode out by itself. False keeps the editing
		// screen exactly as it was.
		creationMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update', 'creation-save', 'creation-cancel'],
	watch: {
		// The kit's readOnly only blocks OPENING the editor, so the name already open on the creation
		// screen would stay contenteditable through the save. It is closed here for the wait and
		// reopened with the caret if the save fails and read-only drops.
		readOnly(readOnly: boolean): void
		{
			if (!this.creationMode)
			{
				return;
			}

			if (readOnly)
			{
				(this.$refs.hero as { stopEdit?: () => void } | null)?.stopEdit?.();
			}
			else
			{
				this.focusTitle();
			}
		},
	},
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	data(): { placementAnchor: HTMLElement | null }
	{
		return {
			// Anchor of the workplace dropdown; resolved after mount, the control reads it lazily when
			// the dialog is opened.
			placementAnchor: null,
		};
	},
	// The creation screen opens straight in edit mode: the name is always empty there, and the
	// step "find the pencil" is one too many — the caret has to be in the field from the first frame.
	// The mode is opened by the hero's own method (passport-hero.ts startEdit, public: the component
	// declares no expose), so the kit is not edited and the editing state stays its own. Children mount
	// before their parent, so the ref is filled by now. On the editing screen both calls do nothing.
	mounted(): void
	{
		this.placementAnchor = (this.$refs.placementAnchor as HTMLElement) ?? null;
		this.pinEditMode();
		this.focusTitle();
	},
	computed: {
		titleRecord(): ScalarRecord | null
		{
			return this.findRecord('sp-title') as ScalarRecord | null;
		},
		title(): string
		{
			return String(this.snapshot.title ?? '');
		},
		descriptionRecord(): ScalarRecord | null
		{
			return this.findRecord('sp-description') as ScalarRecord | null;
		},
		// The live store value, as the title: an edit makes the form dirty at once.
		description(): string
		{
			return String(this.snapshot.description ?? '');
		},
		customSectionRecord(): SettingsRecord | null
		{
			return this.findRecord('sp-custom-section');
		},
		customSectionControl(): Component | null
		{
			const record = this.customSectionRecord;

			return record ? (this.controls?.[record.controlType] ?? null) : null;
		},
		// Resolved from customSectionId — the value that actually goes to the server — so the button
		// follows the choice already made in the dialog, before it is saved.
		placementTitle(): string | null
		{
			return resolvePlacementTitle(
				readCustomSections(this.snapshot),
				this.snapshot.customSectionId as number | string | null,
			);
		},
		// "Расположен в: Отдел выпуска" / "Расположен в: CRM". The bare name is still decided by
		// resolvePlacementButtonLabel, the frame around it is one phrase with a placeholder, so the word
		// order stays the translator's. A language file without the frame phrase (only lang/ru carries
		// it) gets the bare name rather than an empty button.
		placementText(): string
		{
			const label = resolvePlacementButtonLabel(this.placementTitle);
			const name = label.title || (this.loc(label.code) ?? '');

			return this.loc('CRM_TYPE_DETAIL_HUB_LOCATION_BUTTON', { '#TITLE#': name }) ?? name;
		},
		creationSaveText(): string
		{
			return this.loc('CRM_TYPE_DETAIL_HUB_CREATION_SAVE_BUTTON') ?? '';
		},
		creationCancelText(): string
		{
			return this.loc('CRM_TYPE_DETAIL_HUB_CREATION_CANCEL_BUTTON') ?? '';
		},
		// One reason not to accept the press, two sources: nothing to save yet, or the previous press
		// is still in flight.
		isCreationSaveBlocked(): boolean
		{
			return this.creationSaveDisabled || this.creationSaveInProgress;
		},
		// What the BUTTON is told, which is a different question from the one above. In ui.buttons
		// `disabled` and `waiting` are one state slot and not two flags (setDisabled/setWaiting both
		// end in setState), and the wrapper's watchers fire in template order — so a `disabled` that
		// moves together with `loading` puts ui-btn-disabled over the ui-btn-wait set a job earlier,
		// and the wait state lives for a fraction of a tick. Holding this value still for the whole
		// request is what lets the spinner survive; the real HTML attribute meanwhile is set by
		// setWaiting() itself, so the button is not clickable while it waits.
		// `&& !creationSaveInProgress` and not a bare creationSaveDisabled: the hero is the one live
		// block of this screen, the name can be cleared while the request is in flight, and that edit
		// would otherwise move the prop and put the spinner out mid-wait.
		isCreationSaveButtonDisabled(): boolean
		{
			return this.creationSaveDisabled && !this.creationSaveInProgress;
		},
		isPlacementDisabled(): boolean
		{
			return !canEditCustomSection(this.snapshot, this.readOnly);
		},
	},
	methods: {
		findRecord(id: string): SettingsRecord | null
		{
			return this.records.find((record) => record.id === id) ?? null;
		},
		// Pins the edit mode on the CREATION screen. There the empty name stays a grey placeholder and the
		// description field stays on screen, while the kit closes the mode by itself: Enter in the name
		// and focus leaving the content column (Tab to the placement button and beyond, a click beside
		// the hero) call stopEdit(), the empty name is drawn as a black heading with a pencil and the
		// textarea of the display mode drops out of the DOM. No style brings that back and the kit is not
		// ours to edit, so the flag is put back here, by a watcher on the hero instance.
		//
		// The flag returns BEFORE the re-render: a $watch flushes 'pre', and for one instance such a job
		// is queued ahead of its render. The template branches do not switch, the h2 and the textarea
		// stay the same nodes and the focus does not jump. NOT through startEdit(): that one also pulls
		// the focus into the name, and Tab out of the hero would become a trap.
		//
		// The price is a tie to the kit's internal isEditing field, of the same kind as calling
		// startEdit() through a ref. Should the field be renamed, the pin silently comes off; the live
		// check catches that. Esc is not part of it: the slider closes on it by itself.
		pinEditMode(): void
		{
			if (!this.creationMode)
			{
				return;
			}

			const hero = this.$refs.hero as {
				isEditing: boolean,
				$watch?: (source: string, callback: (value: boolean) => void) => void,
			} | null;
			hero?.$watch?.('isEditing', (editing: boolean) => {
				if (!editing && isCreationEditPinned(this.creationMode, this.readOnly))
				{
					hero.isEditing = true;
				}
			});
		},
		// Caret in the name. Called twice: here, on mount, and once more from app.ts when the slider has
		// loaded — mounting alone does not keep the focus. The hub lives in the slider's frame, and on
		// the frame's `load` the slider calls FocusTrap.applyInitialFocus() (main/install/js/main/
		// sidepanel/src/slider.ts, the load handler). The trap sits in the PARENT document: its
		// container.contains(activeElement) is always false for a node of the frame, so the early exit
		// never fires and the focus goes to the slider container — inside the frame
		// document.activeElement becomes BODY. The repeat after that event is what puts the caret back.
		//
		// Calling it again is safe: the hero's startEdit is idempotent (openEditor sets the same
		// isEditing and refocuses the field), and primeTitleContent rewrites the text only when it
		// differs from the `title` prop — a name typed by then has already come back through update:title.
		focusTitle(): void
		{
			if (!this.creationMode)
			{
				return;
			}

			const hero = this.$refs.hero as { startEdit?: () => void } | null;
			hero?.startEdit?.();
		},
		handleTitleUpdate(value: string): void
		{
			const record = this.titleRecord;
			if (record)
			{
				this.$emit('update', { id: record.id, valueKey: record.valueKey, value });
			}
		},
		handleDescriptionUpdate(value: string): void
		{
			const record = this.descriptionRecord;
			if (record)
			{
				this.$emit('update', { id: record.id, valueKey: record.valueKey, value });
			}
		},
		// The custom-section control keeps its own payload shape; the app routes it by record id.
		handleCustomSectionUpdate(value: unknown): void
		{
			const record = this.customSectionRecord;
			if (record)
			{
				this.$emit('update', { id: record.id, valueKey: (record as ScalarRecord).valueKey, value });
			}
		},
		openPlacementSelector(): void
		{
			(this.$refs.customSectionControl as any)?.openSelector?.();
		},
		// The hero only reports the press: who saves, what is sent and how the slider is closed
		// belongs to the app. The guard repeats the button's own `disabled` on purpose — a disabled
		// look is a CSS class, and a stray programmatic or keyboard press must not slip past it.
		handleCreationSave(): void
		{
			if (this.isCreationSaveBlocked)
			{
				return;
			}

			this.$emit('creation-save');
		},
		// "Отменить" of the creation screen reports the press and nothing else, like the save above:
		// leaving the screen without a dialog is the app's job (it owns the store and the close
		// guard). While the save is in flight the button is disabled, and the guard repeats that for
		// a press that slips past the look.
		handleCreationCancel(): void
		{
			if (this.creationSaveInProgress)
			{
				return;
			}

			this.$emit('creation-cancel');
		},
	},
	// The description is editable on both screens and limited by the kit's field rule. On the creation
	// screen it is a textarea with no prompt, the same as on the creation screen of a workplace; on the
	// editing screen an empty one shows the placeholder phrase. The note lives out here and not as an
	// HTML comment: a comment at the root of the template would make the root a fragment in a dev build.
	template: `
		<CrmHubPassportHero
			ref="hero"
			class="crm-type-hub-passport"
			:title="title"
			:title-label="titleRecord ? titleRecord.title : ''"
			:description="description"
			:description-placeholder="creationMode ? '' : 'CRM_TYPE_DETAIL_HUB_DESCRIPTION_PLACEHOLDER'"
			:description-read-only="readOnly"
			limit-description
			:read-only="readOnly"
			@update:title="handleTitleUpdate"
			@update:description="handleDescriptionUpdate"
		>
			<!--
				Outline accent-2 on both screens, the stock AIR style and nothing painted by hand; the
				caption, the dropdown, the disabled state and the dialog are the same on both screens.
				The anchor is capped at the width of the column, so a long workplace name is cut by the
				button's own ellipsis instead of pushing the hero wider (src/style.css).
			-->
			<template v-if="customSectionRecord" #placement>
				<span ref="placementAnchor" class="crm-type-hub-passport__placement-anchor">
					<UiButton
						:text="placementText"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						:size="ButtonSize.MEDIUM"
						dropdown
						:disabled="isPlacementDisabled"
						:dataset="{ testid: 'crm-type-hub-main-location-btn' }"
						@click="openPlacementSelector"
					/>
				</span>
				<component
					:is="customSectionControl"
					v-if="customSectionControl"
					ref="customSectionControl"
					:descriptor="customSectionRecord"
					:snapshot="snapshot"
					:read-only="readOnly"
					:target-node="placementAnchor"
					compact
					data-testid="crm-type-hub-main-location-control"
					@update="handleCustomSectionUpdate"
				/>
			</template>
			<!--
				The "action" slot of the kit draws the tinted row under the hero. The v-if sits on the
				slot template itself, so with the flag off the slot is not handed over to the kit at
				all and that row stays unrendered: the editing screen keeps today's markup.
				"Сохранить" and "Отменить" stand in one row, as on the creation screen of a workplace:
				the same plain style of the cancel, the same gap between the two (src/style.css).
			-->
			<template v-if="showCreationSaveButton" #action>
				<div class="crm-type-hub-passport__creation-actions">
					<UiButton
						:text="creationSaveText"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.MEDIUM"
						:loading="creationSaveInProgress"
						:disabled="isCreationSaveButtonDisabled"
						:dataset="{ testid: 'crm-type-hub-creation-save-btn' }"
						@click="handleCreationSave"
					/>
					<UiButton
						:text="creationCancelText"
						:style="AirButtonStyle.PLAIN"
						:size="ButtonSize.MEDIUM"
						:disabled="creationSaveInProgress"
						:dataset="{ testid: 'crm-type-hub-creation-cancel-btn' }"
						@click="handleCreationCancel"
					/>
				</div>
			</template>
		</CrmHubPassportHero>
	`,
});
