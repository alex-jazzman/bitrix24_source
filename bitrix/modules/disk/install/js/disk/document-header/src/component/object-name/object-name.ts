import { Dom, Loc, Text, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { Icon, Main, Outline } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.outline';
import { NotificationPanel } from 'ui.notification-panel';
import { TextLg } from 'ui.system.typography.vue';
import { defineComponent, inject, markRaw } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';
import { mapState } from 'ui.vue3.pinia';

import { HeaderElement } from '../../const/element';
import { NameAsPageHeadingInjectionKey } from '../../const/injection';
import { HeaderTestId } from '../../const/testid';
import { RenameRefusal, renameObject, type RenameResult } from '../../feature/rename-object/rename-object';
import { ButtonSpinner } from '../../lib/button-spinner/button-spinner';
import { type DeferredInput, loadInput } from '../../lib/deferred-ui/deferred-ui';
import { toEditableName } from '../../lib/editable-name/editable-name';
import { hideHint, showHint } from '../../lib/hint-keyboard/hint-keyboard';
import { useCompositionStore } from '../../model/composition/composition';

import './object-name.css';

type HintBinding = {
	text: string,
	popupOptions: Object,
};

type ObjectNameContext = {
	shouldRenderNameAsPageHeading: boolean,
	HeaderTestId: typeof HeaderTestId,
	CheckIcon: string,
	CheckSize: number,
	PencilIcon: string,
	PencilSize: number,
};

type ObjectNameState = {
	draft: string,
	errorMessage: string,
	fieldWidth: number,
	isEditing: boolean,
	isSaving: boolean,
	isShortened: boolean,
	unobserve: (() => void) | null,
	/** The field of the design system arrives on the first rename and stays for the next ones. */
	field: DeferredInput | null,
	isFieldLoading: boolean,
	spinner: ButtonSpinner | null,
	/** The address the field points at its reason by; one header can share a page with another. */
	errorId: string,
};

/** The pencil of the mockup is smaller than the icon set draws it by default. */
const PencilSize = 20;
const CheckSize = 24;
/** The class the block puts on the field of the design system, and so the way to its rendered nodes. */
const FieldSelector = '.disk-document-header-object-name__field';

let refusalPanel: NotificationPanel | null = null;

/**
 * Name of the opened object: shown without its extension, shortened when it does not fit and
 * restored in full by the hint. Renaming is offered only when the composition carries that element.
 */
export const ObjectName = defineComponent({
	name: 'DiskDocumentHeaderObjectName',
	components: {
		BIcon,
		TextLg,
	},
	directives: {
		hint,
	},
	props: {
		documentSessionHash: {
			type: String,
			default: '',
		},
	},
	setup(): ObjectNameContext
	{
		return {
			shouldRenderNameAsPageHeading: inject(NameAsPageHeadingInjectionKey, false),
			HeaderTestId,
			CheckIcon: Outline.CHECK_L,
			CheckSize,
			PencilIcon: Outline.EDIT_L,
			PencilSize,
		};
	},
	data(): ObjectNameState
	{
		return {
			draft: '',
			errorMessage: '',
			fieldWidth: 0,
			isEditing: false,
			isSaving: false,
			isShortened: false,
			unobserve: null,
			field: null,
			isFieldLoading: false,
			spinner: null,
			errorId: `disk-document-header-name-error-${Text.getRandom()}`,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['composition', 'hasElement']),
		isPresent(): boolean
		{
			return this.hasElement(HeaderElement.Name);
		},
		canRename(): boolean
		{
			return this.hasElement(HeaderElement.Rename);
		},
		/**
		 * A header standing on a page of its own gives that page the only heading it has - the name of
		 * what is open. In a shell of an editor the page is not the header's to name, and the name is
		 * text like the rest of the strip.
		 */
		nameTag(): string
		{
			return this.shouldRenderNameAsPageHeading ? 'h1' : 'span';
		},
		/** A heading is flow content, so what holds it cannot stay a span. */
		triggerTag(): string
		{
			return this.shouldRenderNameAsPageHeading ? 'div' : 'span';
		},
		extension(): string
		{
			return this.composition?.object.extension ?? '';
		},
		/** The stored name carries the extension, the header shows the name without it. */
		displayName(): string
		{
			return toEditableName(this.composition?.object.name ?? '', this.extension);
		},
		triggerLabel(): string | null
		{
			return this.canRename
				? Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_ACTION', { '#NAME#': this.displayName }) ?? ''
				: null
			;
		},
		fieldLabel(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_NAME_FIELD_LABEL') ?? '';
		},
		/** The checkmark carries out an action and is named by it, not by the field standing next to it. */
		submitLabel(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_SUBMIT') ?? '';
		},
		measurementText(): string
		{
			return this.draft === '' ? '\u00a0' : this.draft;
		},
		/**
		 * Only a name the header had to shorten has something to tell, so a name shown in full opens
		 * nothing at all. The bubble is raised above the frame of the editor, which lies right under
		 * the header and would otherwise leave nothing of it but the angle.
		 */
		hintParams(): HintBinding | null
		{
			return this.isShortened
				? { text: this.displayName, popupOptions: { zIndexOptions: { alwaysOnTop: true } } }
				: null
			;
		},
	},
	watch: {
		// the reason belongs to the value it was given for, not to the one being typed now
		draft(): void
		{
			this.errorMessage = '';
			void this.$nextTick(() => this.syncFieldWidth());
		},
		errorMessage(): void
		{
			void this.$nextTick(() => this.syncFieldError());
		},
		displayName(): void
		{
			void this.$nextTick(() => this.measureName());
		},
		isEditing(): void
		{
			void this.$nextTick(() => {
				this.measureName();
				this.syncFieldWidth();
			});
		},
	},
	mounted(): void
	{
		this.observeWidth();
	},
	beforeUnmount(): void
	{
		this.unobserve?.();
		this.unobserve = null;
		this.destroySpinner();
		hideRefusalPanel();
	},
	methods: {
		observeWidth(): void
		{
			if (!(this.$el instanceof HTMLElement))
			{
				return;
			}

			const observer = new ResizeObserver(() => this.measureName());
			observer.observe(this.$el);
			this.unobserve = () => observer.disconnect();
		},
		measureName(): void
		{
			const node = resolveNode(this.$refs.text);
			this.isShortened = node !== null && node.scrollWidth > node.clientWidth;
		},
		syncFieldWidth(): void
		{
			const measure = resolveNode(this.$refs.fieldMeasure);
			if (measure !== null)
			{
				// Two pixels leave room for the caret without making the field visibly wider than its text.
				this.fieldWidth = Math.ceil(measure.getBoundingClientRect().width) + 2;
			}
		},
		/**
		 * The field is not a part of the opening and arrives with the extension of its own on the first
		 * rename. Until it is here the name stays a name: the same node keeps the focus it was activated
		 * by, and only when the field is ready does it take the place - and the focus - of that node.
		 */
		async startRename(): Promise<void>
		{
			if (!this.canRename || this.isEditing || this.isFieldLoading)
			{
				return;
			}

			if (this.field === null)
			{
				this.isFieldLoading = true;
				this.syncSpinner();

				const field = await loadInput();

				this.isFieldLoading = false;
				this.field = field === null ? null : markRaw(field);
				this.syncSpinner();
			}

			// a field which never arrived leaves the name alone: the next activation asks for it again
			if (this.field === null)
			{
				return;
			}

			this.draft = this.displayName;
			this.errorMessage = '';
			this.isEditing = true;
		},
		/**
		 * Closing takes the field off the page, and the field is what the keyboard was on: the name it
		 * grew out of gets the focus back. A closing which followed the focus leaving the block on its
		 * own - a press somewhere else - takes nothing back.
		 */
		closeField(): void
		{
			const holdsFocus = this.holdsFocus();

			this.isEditing = false;
			this.errorMessage = '';

			if (holdsFocus)
			{
				void this.$nextTick(() => resolveNode(this.$refs.trigger)?.focus());
			}
		},
		holdsFocus(): boolean
		{
			const active = document.activeElement;

			return active === null
				|| active === document.body
				|| (this.$el instanceof HTMLElement && this.$el.contains(active))
			;
		},
		/**
		 * Leaving the field for something else stores the entered name. Escape is the other thing entirely:
		 * it closes the field, and the field is taken off the page with the focus on it, so the blur which
		 * follows belongs to a closing that has already happened and has nothing left to store.
		 */
		handleFieldBlur(event: FocusEvent): void
		{
			if (!this.isEditing)
			{
				return;
			}

			const nextTarget = event.relatedTarget;
			if (
				nextTarget instanceof Node
				&& this.$el instanceof HTMLElement
				&& this.$el.contains(nextTarget)
			)
			{
				return;
			}

			void this.submitRename();
		},
		async submitRename(): Promise<void>
		{
			if (this.isSaving)
			{
				return;
			}

			this.isSaving = true;
			// the extension is not edited here and is not sent: it is appended by the server
			const result: RenameResult = await renameObject(this.documentSessionHash, this.draft);
			this.isSaving = false;

			if (result.success)
			{
				this.closeField();

				return;
			}

			// the entered value stays in the field: it is the value the person has to correct
			if (result.refusal === RenameRefusal.InvalidName)
			{
				this.errorMessage = result.message;
				// the field of the design system draws the reason next to itself and tells nothing about it
				LiveAnnouncer.announce(result.message, 'assertive');

				return;
			}

			showRefusalPanel(result.message);
		},
		/**
		 * The field of the design system draws the reason next to itself and ties it to nothing: a person on
		 * the field is told the name of the field and no word of why the entered one was refused. The state
		 * and the address of the reason are put onto the rendered nodes, as the names of the buttons are.
		 */
		syncFieldError(): void
		{
			const field = this.fieldNode();
			if (field === null)
			{
				return;
			}

			const input = field.querySelector('input, textarea');
			if (!(input instanceof HTMLElement))
			{
				return;
			}

			const message = this.errorMessage === '' ? null : messageNode(field, this.errorMessage);
			if (message !== null)
			{
				Dom.attr(message, 'id', this.errorId);
			}

			Dom.attr(input, 'aria-invalid', this.errorMessage === '' ? null : 'true');
			Dom.attr(input, 'aria-describedby', message === null ? null : this.errorId);
			Dom.attr(input, 'aria-errormessage', message === null ? null : this.errorId);
		},
		fieldNode(): HTMLElement | null
		{
			const node = this.$el instanceof HTMLElement ? this.$el.querySelector(FieldSelector) : null;

			return node instanceof HTMLElement ? node : null;
		},
		syncSpinner(): void
		{
			const trigger = resolveNode(this.$refs.trigger);
			if (trigger === null)
			{
				return;
			}

			Dom.attr(trigger, 'aria-busy', String(this.isFieldLoading));

			if (this.isFieldLoading)
			{
				this.spinner ??= markRaw(new ButtonSpinner());
				this.spinner.showOver(trigger);

				return;
			}

			this.destroySpinner();
		},
		destroySpinner(): void
		{
			this.spinner?.destroy();
			this.spinner = null;
		},
		showHint,
		hideHint,
	},
	template: `
		<div
			v-if="isPresent"
			class="disk-document-header-object-name"
			:class="{ '--editing': isEditing }"
		>
			<component
				:is="field?.component"
				v-if="isEditing"
				v-model="draft"
				class="disk-document-header-object-name__field"
				:data-testid="HeaderTestId.NameField"
				:style="{ width: fieldWidth + 'px' }"
				:size="field.size"
				:design="field.design"
				:error="errorMessage"
				:ariaLabel="fieldLabel"
				active
				@keydown.enter="submitRename"
				@keydown.esc="closeField"
				@blur="handleFieldBlur"
			/>
			<span
				v-if="isEditing"
				ref="fieldMeasure"
				aria-hidden="true"
				class="disk-document-header-object-name__measure"
			>{{ measurementText }}</span>
			<button
				v-if="isEditing"
				type="button"
				class="disk-document-header-object-name__submit"
				:data-testid="HeaderTestId.NameSubmit"
				:aria-label="submitLabel"
				:aria-busy="isSaving ? 'true' : 'false'"
				:aria-disabled="isSaving ? 'true' : null"
				@mousedown.prevent
				@click="submitRename"
			>
				<BIcon
					:name="CheckIcon"
					:size="CheckSize"
					color="var(--ui-color-accent-main-primary)"
				/>
			</button>
			<component
				:is="triggerTag"
				v-else
				ref="trigger"
				v-hint="hintParams"
				class="disk-document-header-object-name__trigger"
				:class="{ '--renamable': canRename }"
				:data-testid="HeaderTestId.Name"
				:tabindex="canRename ? 0 : null"
				:role="canRename ? 'button' : null"
				:aria-label="triggerLabel"
				@click="startRename"
				@keydown.enter="startRename"
				@keydown.space.prevent="startRename"
				@keydown.esc="hideHint"
				@focus="showHint"
				@blur="hideHint"
			>
				<TextLg
					ref="text"
					:tag="nameTag"
					class="disk-document-header-object-name__text"
					wrap="truncate"
				>{{ displayName }}</TextLg>
				<BIcon
					v-if="canRename"
					class="disk-document-header-object-name__pencil"
					:name="PencilIcon"
					:size="PencilSize"
				/>
			</component>
		</div>
	`,
});

/** The name is drawn by a component of the design system, so its node is reached through it. */
function resolveNode(reference: unknown): HTMLElement | null
{
	const node = (reference as { $el?: unknown } | null)?.$el ?? reference;

	return node instanceof HTMLElement ? node : null;
}

/**
 * The reason is drawn by the field of the design system in a node of its own, and that node is the one
 * carrying its text. It is looked for that way and not by the classes of the design system: those are
 * internals of somebody else and change with it, while the text is what the field was given here.
 */
function messageNode(field: HTMLElement, message: string): HTMLElement | null
{
	const drawn = [...field.querySelectorAll('*')]
		.filter((node: Element) => node.childElementCount === 0 && (node.textContent ?? '').trim() === message)
		.at(-1)
	;

	return drawn instanceof HTMLElement ? drawn : null;
}

/** A refusal of the attempt itself belongs away from the field - the entered value is not its cause. */
function showRefusalPanel(message: string): void
{
	hideRefusalPanel();

	const text = Type.isStringFilled(message)
		? message
		: Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_ERROR') ?? ''
	;

	// the panel of the design system carries no live region of its own
	LiveAnnouncer.announce(text, 'assertive');

	const panel: NotificationPanel = new NotificationPanel({
		id: null,
		styleClass: '',
		// the panel puts its content into the DOM as markup, so the text of the server is encoded here
		content: Text.encode(text),
		backgroundColor: 'var(--ui-color-accent-main-alert)',
		textColor: 'var(--ui-color-base-white-fixed)',
		crossColor: 'var(--ui-color-base-white-fixed)',
		leftIcon: new Icon({
			icon: Main.WARNING_ALARM,
			color: 'var(--ui-color-base-white-fixed)',
		}),
		rightButtons: [],
		showCloseIcon: true,
		zIndex: null,
		events: null,
	});

	panel.subscribe('onHide', () => {
		if (refusalPanel === panel)
		{
			refusalPanel = null;
		}
	});

	refusalPanel = panel;
	panel.show();
}

function hideRefusalPanel(): void
{
	if (refusalPanel !== null)
	{
		refusalPanel.hide();
		refusalPanel = null;
	}
}
