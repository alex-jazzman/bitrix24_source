import { Text } from 'main.core';
import { UI } from 'ui.notification';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { LiveAnnouncer } from 'ui.a11y';
import { LocMixin } from 'sign.v2.b2e.vue-util';
import { SectionType } from '../types';
import { panelRegion } from '../extension-settings';
import { copyToClipboard } from '../clipboard';
import { buildCopyCodeEvent } from '../copy-analytics';
import { assembledCode, buildCode, toggle } from '../modifiers/code-builder';
import { orderGroups } from '../modifiers/group-order';
import type { ModifierGroup, ModifierSelection, ModifierVariant } from '../modifiers/types';
import { ModifierAccordion } from './modifier-accordion';

const COPIED_STATE_DURATION = 1500;
const NOTIFICATION_HIDE_DELAY = 4000;
// An unavailable clipboard refuses every copy, so the toasts of the refusals replace one another.
const COPY_FAILED_NOTIFICATION_ID = 'sign-placeholders-copy-failed';

// @vue/component
export const PlaceholderItem = {
	name: 'PlaceholderItem',
	components: {
		BIcon,
		ModifierAccordion,
	},
	mixins: [LocMixin],
	props: {
		placeholder: {
			type: Object,
			required: true,
		},
		/** Functional identity of the row: the accordion of the panel opens and closes by it. */
		itemId: {
			type: String,
			default: '',
		},
		testId: {
			type: String,
			default: '',
		},
		sectionType: {
			type: String,
			default: '',
		},
		/**
		 * The open accordion travels as a state of the row and not as the identity of the open one: the
		 * value of a row the user did not touch stays the same, so raising one accordion patches two
		 * rows and not the whole catalog.
		 */
		expanded: {
			type: Boolean,
			default: false,
		},
		/**
		 * The set the row starts with and comes back to: a row of the history is drawn with the set it
		 * was copied with, a row of the list with none.
		 */
		storedSelection: {
			/** @type ModifierSelection */
			type: Object,
			default: (): ModifierSelection => ({}),
		},
		/** A row of the recent fields block offers no deletion: the history is no place to manage fields from. */
		deletable: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['toggle-expand', 'delete-field'],
	inject: ['analytics', 'recordFieldUsage'],
	setup(): Object
	{
		return {
			Outline,
			region: panelRegion(),
			// The timer of the state is kept out of the reactive state: nothing renders its descriptor, and
			// a proxy of one is no descriptor the environment would take back.
			copiedState: { timerId: null },
		};
	},
	data(): Object
	{
		return {
			isCopied: false,
			selection: { ...this.storedSelection },
		};
	},
	computed: {
		hasCode(): boolean
		{
			return Boolean(this.placeholder.value);
		},
		/**
		 * Groups the type of the field is offered; an empty list leaves the row without an accordion.
		 * An unknown type of the field is one of the reasons, and the user is not told about it.
		 */
		modifierGroups(): ModifierGroup[]
		{
			return orderGroups(this.placeholder, this.region);
		},
		hasModifiers(): boolean
		{
			return this.modifierGroups.length > 0;
		},
		isExpanded(): boolean
		{
			return this.hasCode && this.expanded;
		},
		/**
		 * The server marks the items it lets the user delete: the identifier of the user field comes
		 * with the item only then. The zone is a shortcut, not a permission: the delete action checks
		 * the right again.
		 */
		canDelete(): boolean
		{
			return this.deletable && Boolean(this.placeholder.fieldId);
		},
		hasExpandZone(): boolean
		{
			return this.hasCode && this.hasModifiers;
		},
		copyZoneClasses(): Object
		{
			return {
				'sign-placeholders-item-copy-zone': true,
				'--clickable': this.hasCode,
			};
		},
		expandZoneClasses(): Object
		{
			return {
				'sign-placeholders-item-expand-zone': true,
				'--expanded': this.isExpanded,
				'--covered': this.isCopied,
			};
		},
		deleteZoneClasses(): Object
		{
			return {
				'sign-placeholders-item-delete-zone': true,
				'--covered': this.isCopied,
			};
		},
		typeIconClasses(): Object
		{
			const iconType = Object.values(SectionType).includes(this.sectionType) ? this.sectionType : 'default';

			return {
				'sign-placeholders-type-icon': true,
				[`sign-placeholders-type-icon--${iconType}`]: true,
			};
		},
	},
	watch: {
		/**
		 * Opening and closing the accordion bring the row back to the set it was given: a row of the list
		 * starts over with nothing chosen, a row of the history with the set it was copied with.
		 */
		isExpanded(): void
		{
			this.selection = { ...this.storedSelection };
		},
	},
	beforeUnmount(): void
	{
		clearTimeout(this.copiedState.timerId);
	},
	methods: {
		/**
		 * The name of the field belongs to the accessible name of every zone and to every announcement
		 * of the row: the rows of the list differ by it alone, and a nameless delete is dangerous.
		 */
		withFieldName(phraseCode: string): string
		{
			return this.loc(phraseCode, { '#FIELD_NAME#': this.placeholder.name });
		},
		handleCopy(): void
		{
			if (!this.hasCode)
			{
				return;
			}

			void this.copyCode(this.selection);
		},
		handleToggleExpand(): void
		{
			this.$emit('toggle-expand', this.itemId);
		},
		handleDelete(): void
		{
			this.$emit('delete-field', this.placeholder);
		},
		handleModifierSelect({ group, variant }: { group: ModifierGroup, variant: ModifierVariant }): void
		{
			this.selection = toggle(this.selection, group, variant);
			void this.copyCode(this.selection);
		},
		// Both the copy zone and a chip copy the code of the set the row holds right now.
		async copyCode(selection: ModifierSelection): Promise<void>
		{
			const code = buildCode(this.placeholder.value, selection);
			const isCopied = await copyToClipboard(code);

			this.analytics.send(buildCopyCodeEvent({
				fieldType: this.placeholder.type ?? null,
				groupIds: Object.keys(selection),
				isCopied,
			}));

			// The field was used even when the clipboard refused it: the toast still hands the code over.
			// The history takes the assembled code, so the row it draws copies what was copied here.
			void this.recordFieldUsage(assembledCode(this.placeholder.value, selection));

			if (!isCopied)
			{
				this.notifyToCopyManually(code);

				return;
			}

			this.showCopiedState();
			LiveAnnouncer.announce(this.withFieldName('PLACEHOLDER_LIST_COPIED_ANNOUNCEMENT'));
		},
		/**
		 * A repeated copy restarts the state instead of laying a second timer over the first one. The
		 * panel is rebuilt as a whole after a field is created or deleted, so the timer of a row must
		 * not outlive it either.
		 */
		showCopiedState(): void
		{
			clearTimeout(this.copiedState.timerId);
			this.isCopied = true;
			this.copiedState.timerId = setTimeout(() => {
				this.isCopied = false;
				this.copiedState.timerId = null;
			}, COPIED_STATE_DURATION);
		},
		// An unavailable clipboard must not lose the built code: the toast shows it in full.
		notifyToCopyManually(code: string): void
		{
			UI.Notification.Center.notify({
				id: COPY_FAILED_NOTIFICATION_ID,
				content: this.loc('PLACEHOLDER_LIST_COPY_FAILED_NOTIFICATION', { '#CODE#': Text.encode(code) }),
				autoHideDelay: NOTIFICATION_HIDE_DELAY,
			});

			// The toast is no live region and it takes the only copy of the code away with it, so the
			// announcement of the refusal carries the code itself.
			LiveAnnouncer.announce(
				this.loc('PLACEHOLDER_LIST_COPY_FAILED_NOTIFICATION', { '#CODE#': code }),
				'assertive',
			);
		},
	},
	// The copied state is laid over the strip of the zones instead of replacing it: a zone activated
	// from the keyboard must keep the focus. The zones the state hides take no input while it is shown,
	// the copy zone stays live; `null` keeps `inert` out of the markup, `inert="false"` would still
	// leave the zone inert. The pointer is kept out by the class as well - a browser that knows no
	// `inert` would let a blind click through to the deletion of a field.
	template: `
		<div class="sign-placeholders-item" :data-testid="testId">
			<div class="sign-placeholders-item-zones">
				<div
					:class="copyZoneClasses"
					:role="hasCode ? 'button' : null"
					:tabindex="hasCode ? 0 : null"
					:aria-label="hasCode ? withFieldName('PLACEHOLDER_LIST_COPY_CODE_LABEL_MSGVER_1') : null"
					:data-testid="hasCode ? testId + '-copy' : null"
					@click="handleCopy"
					@keydown.enter="handleCopy"
					@keydown.space.prevent="handleCopy"
				>
					<span :class="typeIconClasses" :title="placeholder.value"></span>
					<span class="sign-placeholders-item-name">{{ placeholder.name }}</span>
				</div>
				<div
					v-if="canDelete"
					:class="deleteZoneClasses"
					role="button"
					tabindex="0"
					:inert="isCopied || null"
					:aria-label="withFieldName('PLACEHOLDER_LIST_DELETE_FIELD_LABEL_MSGVER_1')"
					:data-testid="testId + '-delete'"
					@click="handleDelete"
					@keydown.enter="handleDelete"
					@keydown.space.prevent="handleDelete"
				>
					<BIcon :name="Outline.TRASHCAN" :size="20" color="var(--ui-color-accent-main-alert)"/>
				</div>
				<template v-if="hasExpandZone">
					<span class="sign-placeholders-item-zones-divider"></span>
					<div
						:class="expandZoneClasses"
						role="button"
						tabindex="0"
						:inert="isCopied || null"
						:aria-expanded="isExpanded"
						:aria-label="withFieldName('PLACEHOLDER_LIST_MODIFIERS_LABEL_MSGVER_1')"
						:data-testid="testId + '-expand'"
						@click="handleToggleExpand"
						@keydown.enter="handleToggleExpand"
						@keydown.space.prevent="handleToggleExpand"
					>
						<BIcon
							class="sign-placeholders-item-expand-chevron"
							:name="Outline.CHEVRON_DOWN_M"
							:size="20"
							color="var(--ui-color-base-2)"
						/>
					</div>
				</template>
				<div v-if="isCopied" class="sign-placeholders-copied" aria-hidden="true">
					<BIcon
						class="sign-placeholders-copied-icon"
						:name="Outline.CHECK_M"
						:size="20"
						color="var(--ui-color-accent-main-primary)"
					/>
					<span class="sign-placeholders-copied-message">
						{{ loc('PLACEHOLDER_LIST_COPIED_LABEL_MSGVER_1') }}
					</span>
				</div>
			</div>
			<div v-if="isExpanded" class="sign-placeholders-item-accordion">
				<span class="sign-placeholders-item-accordion-divider"></span>
				<ModifierAccordion
					:groups="modifierGroups"
					:selection="selection"
					@select="handleModifierSelect"
				/>
			</div>
		</div>
	`,
};
