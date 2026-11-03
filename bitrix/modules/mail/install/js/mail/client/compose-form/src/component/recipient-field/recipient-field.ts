import { Dom, Event } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector, type ItemOptions, type TagItem } from 'ui.entity-selector';
import { defineComponent, markRaw, toRaw, type PropType } from 'ui.vue3';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';
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

/** A field taller than this many rows of tags folds the rest behind a "+N" control. */
const CollapsedRowLimit = 3;
const TagHiddenClass = '--hidden-by-collapse';

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

	setup()
	{
		return {
			state: useComposeState(),
			// A plain node rather than state: it lives between the tags of the selector, outside the template.
			moreChip: null as HTMLElement | null,
			moreChipInstance: null as Button | null,
			// The document listener that folds the tags back on a click outside the field.
			outsideCollapseHandler: null as ((event: PointerEvent) => void) | null,
			// The width of the field is what the wrapping depends on, so the fold follows it.
			widthObserver: null as ResizeObserver | null,
			observedWidth: 0,
		};
	},

	data()
	{
		return {
			selector: null as TagSelector | null,
			isPickerOpen: false,
			restoreFocusAfterDraft: false,
			isTagsCollapsed: true,
		};
	},

	computed: {
		/** Only `to` is required for a message to be sent. */
		isRequired(): boolean
		{
			return this.field === 'to';
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
				// The built-in control stands in the flow of the tags, right after the last one.
				addButtonCaption: loc(Phrase.FieldAdd),
				addButtonCaptionMore: loc(Phrase.FieldAdd),
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
			dialog?.subscribe('onShow', this.handlePickerShow);
			dialog?.subscribe('onHide', this.handlePickerHide);

			// The tab labels expand into the free space to the left of the popup and are clipped without it
			// (`ui/.../entity-selector/src/dialog/dialog.ts:1635`), so the popup is pushed right by what the
			// labels lack. The shift goes in before the first show: the popup takes it when it is created,
			// while `onShow` runs after the show and would move a popup that is already up.
			if (dialog)
			{
				const fieldLeft = container.getBoundingClientRect().left;
				dialog.setOffsetLeft(Math.max(0, dialog.getMaxLabelWidth() - fieldLeft));
			}

			this.selector = selector;
			selector.renderTo(container);
			this.scheduleTagsCollapse();
			this.observeWidth(container);

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
			this.disarmOutsideCollapse();
			this.unobserveWidth();
			this.selector?.getDialog()?.destroy();
			this.selector = null;
			this.moreChip = null;
			this.moreChipInstance = null;
			Dom.clean(this.$refs.field as HTMLElement);
		},

		/**
		 * The slider is resized and goes full screen under the form, and the tags wrap anew every time.
		 * Only the width is answered: folding changes the height of the field itself, and following that
		 * would call the fold from its own result.
		 */
		observeWidth(container: HTMLElement): void
		{
			this.unobserveWidth();
			this.widthObserver = new ResizeObserver((entries: ResizeObserverEntry[]): void => {
				const width = entries[0]?.contentRect.width ?? 0;
				if (width === this.observedWidth)
				{
					return;
				}

				this.observedWidth = width;
				this.scheduleTagsCollapse();
			});
			this.widthObserver.observe(container);
		},

		unobserveWidth(): void
		{
			this.widthObserver?.disconnect();
			this.widthObserver = null;
			this.observedWidth = 0;
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
			this.scheduleTagsCollapse();
		},

		/** Editing works over the full set of addresses, so the fold opens for as long as the picker is up. */
		handlePickerShow(): void
		{
			this.disarmOutsideCollapse();
			this.isPickerOpen = true;
			this.collapseTags();
		},

		/** The focus is restored by the dialog itself: it returns to the built-in add control on close. */
		handlePickerHide(): void
		{
			const { selector } = this;
			if (!selector)
			{
				return;
			}

			this.isPickerOpen = false;
			this.isTagsCollapsed = true;
			this.scheduleTagsCollapse();
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

		scheduleTagsCollapse(): void
		{
			window.requestAnimationFrame((): void => {
				this.collapseTags();
			});
		},

		/**
		 * The rows are measured rather than counted: the tags wrap by their own widths, so only the layout
		 * knows where the third row ends. What has to fit into those rows is the whole row of the field —
		 * the tags, the "+N" control and the add control of the selector standing after the text box — so
		 * three rows of tags alone are not yet a reason to leave the set unfolded.
		 */
		collapseTags(): void
		{
			const selector = this.selector as TagSelector | null;
			if (!selector)
			{
				return;
			}

			const tags = selector.getTags();
			tags.forEach((tag: TagItem): void => {
				Dom.removeClass(tag.getContainer(), TagHiddenClass);
			});
			Dom.remove(this.moreChip);

			if (!this.isTagsCollapsed || this.isPickerOpen || tags.length === 0)
			{
				return;
			}

			const rowTops = [...new Set(tags.map((tag: TagItem): number => tag.getContainer().offsetTop))];
			if (rowTops.length < CollapsedRowLimit)
			{
				return;
			}

			const lastVisibleRowTop = rowTops[CollapsedRowLimit - 1];
			const addButton = selector.getAddButton();
			if (rowTops.length === CollapsedRowLimit && addButton.offsetTop <= lastVisibleRowTop)
			{
				return;
			}

			const chip = this.getMoreChip();
			Dom.insertBefore(chip, selector.getTextBox());

			/**
			 * Hiding more tags never pushes the row back down, so the fit grows with the count and the
			 * smallest fitting one is found by halving rather than by hiding the addresses one by one.
			 */
			let low = 1;
			let high = tags.length;
			while (low < high)
			{
				const middle = Math.floor((low + high) / 2);
				if (this.fitsCollapsedTo(tags, middle, addButton, lastVisibleRowTop))
				{
					high = middle;
				}
				else
				{
					low = middle + 1;
				}
			}

			this.applyCollapsedCount(tags, low);
		},

		/** One write and one read per probe: the whole range is hidden at once, the layout is asked once. */
		fitsCollapsedTo(tags: TagItem[], hidden: number, addButton: HTMLElement, lastVisibleRowTop: number): boolean
		{
			const chip = this.applyCollapsedCount(tags, hidden);

			return chip.offsetTop <= lastVisibleRowTop && addButton.offsetTop <= lastVisibleRowTop;
		},

		/** The caption is written before the measuring: an empty chip is narrower than the one that stays. */
		applyCollapsedCount(tags: TagItem[], hidden: number): HTMLElement
		{
			const firstHidden = tags.length - hidden;
			tags.forEach((tag: TagItem, index: number): void => {
				Dom.toggleClass(tag.getContainer(), TagHiddenClass, index >= firstHidden);
			});

			const chip = this.getMoreChip();
			this.moreChipInstance?.setText(`+${hidden}`);
			Dom.attr(chip, 'aria-label', loc(Phrase.RecipientsShowAll, { '#COUNT#': String(hidden) }));

			return chip;
		},

		expandTags(): void
		{
			this.isTagsCollapsed = false;
			this.collapseTags();
			this.armOutsideCollapse();
		},

		/** A click outside the field folds an unfolded set back, the way a popup gives way. */
		armOutsideCollapse(): void
		{
			if (this.outsideCollapseHandler)
			{
				return;
			}

			const handler = (event: PointerEvent): void => {
				if ((this.$el as HTMLElement).contains(event.target as Node))
				{
					return;
				}

				this.disarmOutsideCollapse();
				this.isTagsCollapsed = true;
				this.collapseTags();
			};
			this.outsideCollapseHandler = handler;
			Event.bind(document, 'pointerdown', handler, true);
		},

		disarmOutsideCollapse(): void
		{
			if (this.outsideCollapseHandler)
			{
				Event.unbind(document, 'pointerdown', this.outsideCollapseHandler, true);
				this.outsideCollapseHandler = null;
			}
		},

		/**
		 * The counter carries no surface of its own — neither a fill nor an outline — so it is a button of
		 * the design system in the plain accent style rather than a chip. The vanilla control is taken
		 * because the node goes into the markup of `TagSelector`, outside the tree of this component, and
		 * its width is measured the moment the caption is set: `getContainer()` and `setText()` of that
		 * control answer synchronously, and the node they give is a real `button`.
		 */
		getMoreChip(): HTMLElement
		{
			if (!this.moreChip)
			{
				const instance = markRaw(new Button({
					size: ButtonSize.SMALL,
					style: AirButtonStyle.PLAIN_ACCENT,
					useAirDesign: true,
					noCaps: true,
					dataset: { testid: 'mail-compose-recipient-more' },
					// `collapsedIcon` is required by the options type, and a button with no icon has none;
					// the cast is the way `mail.signature.editor` states the same about this control.
				} as unknown as ConstructorParameters<typeof Button>[0]));
				const chip = instance.getContainer();
				Event.bind(chip, 'click', (): void => {
					this.expandTags();
				});
				Dom.addClass(chip, 'mail-compose-recipient-field__more');
				this.moreChipInstance = instance;
				this.moreChip = chip;
			}

			return this.moreChip;
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
	 * and opens nothing. The dialog is opened by the built-in add control of the selector, and the addresses
	 * are typed into its text box, so a tab stop here would say nothing and lead nowhere.
	 */
	template: `
		<div
			ref="field"
			class="mail-compose-recipient-field"
			role="group"
			:data-testid="'mail-compose-recipient-field-' + field"
		></div>
	`,
});
