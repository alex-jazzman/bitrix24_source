import { Dom } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { FocusNavigator } from 'ui.a11y';
import { TagSelector, type ItemOptions, type TagItem } from 'ui.entity-selector';
import { defineComponent, markRaw, toRaw, type PropType } from 'ui.vue3';

import { Phrase } from '../../const';
import {
	createContact,
	getAddressBookDialogOptions,
	openContactOfTag,
} from '../../feature/address-book/address-book';
import {
	getRecipientEntities,
	RecipientDialogContext,
	toRecipientElements,
} from '../../lib/recipient/recipient';
import { type RecipientFieldKind, useComposeState } from '../../model/compose/compose';

import './recipient-field.css';

/** Selector sizes taken from the old form (`main.mail.form/templates/.default/script.js`). */
const TextBoxWidth = 220;
const TagMaxWidth = 400;

export const RecipientFieldPhrase: Record<RecipientFieldKind, string> = {
	to: Phrase.FieldTo,
	cc: Phrase.FieldCc,
	bcc: Phrase.FieldBcc,
};

/** Payload of `Search:onItemCreateAsync`. */
type SearchQueryData = {
	searchQuery?: {
		getQuery(): string,
	},
};

/**
 * One component for all three fields, told apart by `field`. The `TagSelector` is created with the entities
 * and the dialog context of the old form, so the address providers answer it unchanged.
 *
 * The instance and its dialog stay out of the reactive state: a proxy breaks access to their private fields.
 * The dialog is destroyed by hand, since it lives in a popup of its own rather than inside the element of
 * this component.
 */
// @vue/component
export const RecipientField = defineComponent({
	name: 'MailComposeRecipientField',

	props: {
		field: {
			type: String as PropType<RecipientFieldKind>,
			required: true,
		},
	},

	emits: ['pickerClose'],

	setup()
	{
		return {
			state: useComposeState(),
		};
	},

	data()
	{
		return {
			selector: null as TagSelector | null,
			isPickerOpen: false,
			restoreFocusAfterDraft: false,
		};
	},

	computed: {
		/** Only `to` is required for a message to be sent. */
		isRequired(): boolean
		{
			return this.field === 'to';
		},

		hasRecipients(): boolean
		{
			return this.state.recipients[this.field].length > 0;
		},
	},

	watch: {
		'state.draft.isLoading': {
			handler(loading: boolean, wasLoading: boolean): void
			{
				if (loading)
				{
					this.restoreFocusAfterDraft = (this.$refs.field as HTMLElement).contains(document.activeElement);

					return;
				}

				if (wasLoading && !loading)
				{
					const field = this.$refs.field as HTMLElement;
					this.destroySelector();
					this.createSelector();
					if (this.restoreFocusAfterDraft)
					{
						this.selector?.showTextBox();
						this.selector?.focusTextBox();
						window.requestAnimationFrame((): void => {
							window.requestAnimationFrame((): void => {
								field.querySelector<HTMLElement>('[data-testid="ui-tag-selector-input"]')?.focus();
							});
						});
					}
					this.restoreFocusAfterDraft = false;
				}
			},
		},
	},

	mounted(): void
	{
		this.createSelector();
	},

	beforeUnmount(): void
	{
		this.destroySelector();
	},

	methods: {
		createSelector(): void
		{
			const container = this.$refs.field as HTMLElement;

			const selector = markRaw(new TagSelector({
				id: this.selectorId(),
				textBoxWidth: TextBoxWidth,
				tagMaxWidth: TagMaxWidth,
				// An address book tag opens the contact behind it.
				tagClickable: true,
				// The row draws the control that opens the dialog itself, right where the layout puts it;
				// the built-in one would stand next to it as a second control with the same action.
				showAddButton: false,
				dialogOptions: {
					targetNode: container,
					id: this.selectorId(),
					context: RecipientDialogContext,
					entities: getRecipientEntities(),
					// The initial addresses are handed over here and never as a prop: the server sends
					// whole selector items, and re-resolving them by their id pair alone would lose
					// those of the address book. They are passed through unchanged.
					selectedItems: toRaw(this.state.recipients[this.field]) as ItemOptions[],
					...getAddressBookDialogOptions(),
					events: {
						'Search:onItemCreateAsync': (event: BaseEvent) => this.handleContactCreate(event),
					},
				},
				events: {
					onAfterTagAdd: () => this.syncRecipients(),
					onAfterTagRemove: () => this.syncRecipients(),
					'TagItem:onClick': (event: BaseEvent) => this.handleTagClick(event),
				},
			}));

			const dialog = selector.getDialog();
			dialog?.subscribe('onHide', this.handlePickerHide);

			this.selector = selector;
			selector.renderTo(container);

			if (this.isRequired)
			{
				// The wrapper around the selector is a plain container, and `aria-required` belongs on a
				// control that takes a value anyway: the dialog marks its text box `role="combobox"`
				// (`ui/.../entity-selector/src/dialog/dialog.ts:1727`), where the state is legal.
				Dom.attr(selector.getTextBox(), 'aria-required', 'true');
			}
		},

		destroySelector(): void
		{
			this.selector?.getDialog()?.destroy();
			this.selector = null;
			Dom.clean(this.$refs.field as HTMLElement);
		},

		selectorId(): string
		{
			return `mail-compose-form-recipient-${this.field}`;
		},

		/**
		 * The selected items are the source rather than the tags: a tag is built from the parts that are
		 * drawn and carries no custom data, and the custom data is the whole of what goes to the server.
		 */
		syncRecipients(): void
		{
			const dialog = this.selector?.getDialog();
			if (!dialog)
			{
				return;
			}

			this.state.recipients[this.field] = toRecipientElements(dialog.getSelectedItems());
			(this.$el as HTMLElement).dispatchEvent(new window.Event('input', { bubbles: true }));
		},

		/**
		 * The dialog searches by the text box of the selector and navigates its list by the keys of that
		 * same control, and the built-in control is what shows and focuses it
		 * (`ui/.../entity-selector/src/tag-selector/tag-selector.ts:984-991`). That control is hidden here,
		 * so opening by hand repeats the whole sequence: without the text box the dialog has no search at
		 * all, and without the focus on it the keyboard never reaches the dialog.
		 */
		openPicker(): void
		{
			const { $el, selector } = this;
			const dialog = selector?.getDialog();
			if (!selector || !dialog)
			{
				return;
			}

			// The class goes on by hand as well: an empty row is hidden, Vue would only apply the binding on
			// the next tick, and the focus below has to land on a control that is already shown.
			this.isPickerOpen = true;
			Dom.addClass($el as HTMLElement, '--editing');
			selector.showTextBox();
			selector.focusTextBox();
			dialog.show();
		},

		/**
		 * The dialog restores its own add control on close and puts the focus on it
		 * (`ui/.../entity-selector/src/dialog/dialog.ts:2514-2527`). The control is hidden here, so the row
		 * takes both over: it is hidden again, and the focus goes back to the control that opened the dialog.
		 * A focus the user has moved elsewhere meanwhile stays where it is.
		 */
		handlePickerHide(): void
		{
			const { $el, selector } = this;
			if (!selector)
			{
				return;
			}

			this.isPickerOpen = false;
			Dom.removeClass($el as HTMLElement, '--editing');
			selector.hideAddButton();

			const field = $el as HTMLElement;
			if (FocusNavigator.isFocusLost() || field.contains(FocusNavigator.getActiveElement()))
			{
				this.$emit('pickerClose');
			}
		},

		/** The returned promise goes back to the picker: it holds its own loader until that promise settles. */
		handleContactCreate(event: BaseEvent): Promise<void>
		{
			const dialog = this.selector?.getDialog();
			if (!dialog)
			{
				return Promise.reject(new Error('Recipient field selector dialog is not available.'));
			}

			const { searchQuery } = event.getData() as SearchQueryData;

			return createContact(dialog, searchQuery?.getQuery() ?? '');
		},

		/** Only address book tags open anything; `openContactOfTag()` tells them apart. */
		handleTagClick(event: BaseEvent): void
		{
			const dialog = this.selector?.getDialog();
			const { item } = event.getData() as { item?: TagItem };
			if (dialog && item)
			{
				openContactOfTag(dialog, item);
			}
		},

	},

	/**
	 * The wrapper only groups the chosen addresses under the label of the row: it takes no focus of its own
	 * and opens nothing. The dialog is opened by the button of the row, and the addresses are typed into the
	 * text box of the selector, so a tab stop here would say nothing and lead nowhere.
	 */
	template: `
		<div
			ref="field"
			class="mail-compose-recipient-field"
			:class="{
				'--empty': !hasRecipients,
				'--editing': isPickerOpen,
			}"
			role="group"
			:data-testid="'mail-compose-recipient-field-' + field"
		></div>
	`,
});
