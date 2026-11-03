import { defineComponent, nextTick } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { BInput } from 'ui.system.input.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineXl, TextXs } from 'ui.system.typography.vue';

import { focusEditable, resolveEditableElement, type FocusTarget } from '../../lib/focus-editable/focus-editable';
import { limitHubDescriptionEdit, type HubDescriptionEdit } from '../../lib/hub-description/hub-description';
import { shouldEndEditing } from '../../lib/should-end-editing/should-end-editing';

import './passport-hero.css';

// Passport of the hub: the type avatar, its editable name, a free description slot and the
// placement row. Name and description are read-only text until the pencil is pressed, so the
// passport reads as a heading and not as a form; the pencil then opens both of them at once.
//
// The name is edited IN PLACE — the same <h2>, the same type ramp, contenteditable — instead of
// being swapped for an input. Swapping moved the text by the input's own padding and border and
// changed its font, so the first click made the heading jump; now only a caret appears. The
// description is the opposite case and stays a real field: it is prose, so it opens as a two-row
// textarea with a resize grip rather than a one-line input that hides its own tail.
export const CrmHubPassportHero = defineComponent({
	name: 'CrmHubPassportHero',
	components: { BIcon, BInput, UiButton, HeadlineXl, TextXs },
	mixins: [locMixin],
	props: {
		title: {
			type: String,
			default: '',
		},
		titleLabel: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		// Phrase code of the prompt shown while the description is empty.
		descriptionPlaceholder: {
			type: String,
			default: '',
		},
		icon: {
			type: String,
			default: Outline.SMART_PROCESS,
		},
		locationTitle: {
			type: String,
			default: '',
		},
		locationIcon: {
			type: String,
			default: Outline.LOCATION,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		descriptionReadOnly: {
			type: Boolean,
			default: false,
		},
		limitDescription: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:title', 'update:description'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize, Outline };
	},
	data(): { isEditing: boolean }
	{
		return {
			isEditing: false,
		};
	},
	computed: {
		titleText(): string
		{
			return this.title || (this.titleLabel ? this.loc(this.titleLabel) : '');
		},
	},
	methods: {
		// The pencil and the description text are two doors into the same mode unless the description
		// is independently read-only; otherwise they only differ in where the caret lands. Bound as
		// bare `@click="startEdit"`, so they take no arguments — the click event would land in them.
		startEdit(): void
		{
			this.openEditor('titleInput');
		},
		startEditDescription(): void
		{
			if (this.descriptionReadOnly)
			{
				return;
			}

			this.openEditor('descriptionInput');
		},
		openEditor(focusRef: string): void
		{
			if (this.readOnly)
			{
				return;
			}

			this.isEditing = true;
			nextTick(() => {
				this.primeTitleContent();
				focusEditable(this.$refs[focusRef] as FocusTarget);
			});
		},
		// The editable heading carries no interpolation on purpose, so its text is seeded here, once,
		// when the mode opens. Binding it would re-render the node on every keystroke — the parent
		// owns `title` and echoes each edit straight back — and the caret would jump to the start.
		primeTitleContent(): void
		{
			const element = resolveEditableElement(this.$refs.titleInput as FocusTarget);
			if (element && element.textContent !== this.title)
			{
				element.textContent = this.title;
			}
		},
		stopEdit(): void
		{
			this.isEditing = false;
		},
		// Closing hangs on the content block, not on each input: a blur inside the mode must not end
		// it, otherwise moving from the name to the description would collapse the name back into a
		// heading.
		//
		// The decision waits a macrotask and then asks where focus LANDED, because `relatedTarget`
		// lies at the moment that matters. Opening the mode removes the pencil, Chrome blurs it as it
		// goes, and that focusout reaches this handler carrying `relatedTarget: null` — the same
		// shape as a click on inert background. One tick later the two are easy to tell apart: the
		// caret is already in the name input (`nextTick` is a microtask, so it has run by then).
		handleFocusOut(): void
		{
			setTimeout(() => {
				if (!this.isEditing)
				{
					return;
				}

				if (shouldEndEditing(this.$refs.content as HTMLElement | undefined, document.activeElement))
				{
					this.stopEdit();
				}
			}, 0);
		},
		handleTitleInput(event: Event): void
		{
			const element = event.target as HTMLElement | null;

			this.$emit('update:title', element?.textContent ?? '');
		},
		// Plain text only. A contenteditable takes the source's markup as it comes, and a pasted line
		// break would quietly turn a one-line name into two — the very thing Enter is intercepted for.
		// execCommand is deprecated but remains the only insertion that keeps the browser's own undo
		// stack; it also fires `input`, so the emit above still runs and no second path is needed.
		handleTitlePaste(event: ClipboardEvent): void
		{
			event.preventDefault();

			const text = (event.clipboardData?.getData('text/plain') ?? '').replaceAll(/\s+/gu, ' ').trim();
			if (text === '')
			{
				return;
			}

			const element = event.target as HTMLElement | null;
			element?.ownerDocument?.execCommand?.('insertText', false, text);
		},
		handleDescriptionInput(value: string): void
		{
			if (!this.limitDescription)
			{
				this.$emit('update:description', value);

				return;
			}

			const field = this.resolveDescriptionField();
			const limited = limitHubDescriptionEdit(this.description, value, field?.selectionEnd ?? value.length);
			if (limited.value !== value)
			{
				this.writeBackDescription(limited);
			}

			this.$emit('update:description', limited.value);
		},
		resolveDescriptionField(): HTMLTextAreaElement | null
		{
			const host = resolveEditableElement(this.$refs.descriptionInput as FocusTarget);

			return host?.querySelector('textarea') ?? null;
		},
		// The parent echoes the cut value, which usually equals the current prop, so BInput does not re-render and
		// the field would keep the extra text. Native maxlength is no help: it counts UTF-16 units, not
		// characters.
		writeBackDescription(edit: HubDescriptionEdit): void
		{
			const field = this.resolveDescriptionField();
			if (!field)
			{
				return;
			}

			field.value = edit.value;
			field.setSelectionRange(edit.caret, edit.caret);
		},
		// The NAME is one line, so Enter there means "done" — there is nothing for a line break to do
		// and letting it through would put a second line inside a heading.
		handleEditKeydown(event: KeyboardEvent): void
		{
			if (['Enter', 'Escape'].includes(event.key))
			{
				event.preventDefault();
				this.stopEdit();
			}
		},
		// The DESCRIPTION is prose in a textarea, so Enter belongs to the text and only Escape closes
		// the mode. Sharing handleEditKeydown here would make the field unable to hold the second line
		// it is sized for.
		handleDescriptionKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape')
			{
				event.preventDefault();
				this.stopEdit();
			}
		},
	},
	template: `
		<div class="crm-settings-hub-passport-hero" data-testid="crm-settings-hub-passport-hero">
			<div class="crm-settings-hub-passport-hero__top">
				<div class="crm-settings-hub-passport-hero__avatar">
					<BIcon class="crm-settings-hub-passport-hero__avatar-icon" :name="icon" :size="40"/>
					<span v-if="$slots.badge" class="crm-settings-hub-passport-hero__badge">
						<slot name="badge"/>
					</span>
				</div>
				<div
					ref="content"
					class="crm-settings-hub-passport-hero__content"
					@focusout="handleFocusOut"
				>
					<div class="crm-settings-hub-passport-hero__title-row">
						<HeadlineXl
							v-if="isEditing"
							ref="titleInput"
							accent
							tag="h2"
							class="crm-settings-hub-passport-hero__title --editable"
							contenteditable="true"
							role="textbox"
							aria-multiline="false"
							spellcheck="false"
							:aria-label="titleLabel ? loc(titleLabel) : ''"
							:data-placeholder="titleLabel ? loc(titleLabel) : ''"
							data-testid="crm-settings-hub-passport-hero-input"
							@input="handleTitleInput"
							@paste="handleTitlePaste"
							@keydown="handleEditKeydown"
						/>
						<template v-else>
							<HeadlineXl accent tag="h2" class="crm-settings-hub-passport-hero__title">{{ titleText }}</HeadlineXl>
							<UiButton
								v-if="!readOnly"
								class="crm-settings-hub-passport-hero__edit"
								:style="AirButtonStyle.PLAIN"
								:size="ButtonSize.SMALL"
								:left-icon="Outline.EDIT_M"
								:text="titleLabel ? loc(titleLabel) : titleText"
								collapsed
								:dataset="{ testid: 'crm-settings-hub-passport-hero-edit' }"
								@click="startEdit"
							/>
						</template>
					</div>
					<div
						v-if="isEditing || description || descriptionPlaceholder || $slots.description"
						class="crm-settings-hub-passport-hero__description"
					>
						<span
							v-if="descriptionReadOnly && (description || descriptionPlaceholder)"
							class="crm-settings-hub-passport-hero__description-text --read-only"
							data-testid="crm-settings-hub-passport-hero-description"
						>{{ description || loc(descriptionPlaceholder) }}</span>
						<BInput
							v-else-if="isEditing"
							ref="descriptionInput"
							:model-value="description"
							:placeholder="descriptionPlaceholder ? loc(descriptionPlaceholder) : ''"
							data-testid="crm-settings-hub-passport-hero-description-input"
							:rows-quantity="2"
							resize="vertical"
							stretched
							@update:modelValue="handleDescriptionInput"
							@keydown="handleDescriptionKeydown"
						/>
						<button
							v-else-if="description || descriptionPlaceholder"
							type="button"
							class="crm-settings-hub-passport-hero__description-text"
							:class="{ '--empty': !description }"
							:disabled="readOnly"
							data-testid="crm-settings-hub-passport-hero-description"
							@click="startEditDescription"
						>{{ description || loc(descriptionPlaceholder) }}</button>
						<slot v-else name="description"/>
					</div>
					<div v-if="$slots.meta" class="crm-settings-hub-passport-hero__meta">
						<slot name="meta"/>
					</div>
					<!--
						Placement lives in the content column, under the description, and not in the tinted
						__location row below: the wizard mockup gives it a plain button that lines up with the
						name and the description (432:99411).
					-->
					<div v-if="$slots.placement" class="crm-settings-hub-passport-hero__placement">
						<slot name="placement"/>
					</div>
				</div>
			</div>
			<div v-if="locationTitle || $slots.action" class="crm-settings-hub-passport-hero__location">
				<BIcon class="crm-settings-hub-passport-hero__location-icon" :name="locationIcon" :size="24"/>
				<TextXs accent class="crm-settings-hub-passport-hero__location-title">{{ loc(locationTitle) }}</TextXs>
				<div class="crm-settings-hub-passport-hero__location-action">
					<slot name="action"/>
				</div>
			</div>
			<div v-if="$slots.details" class="crm-settings-hub-passport-hero__details">
				<slot name="details"/>
			</div>
		</div>
	`,
});
