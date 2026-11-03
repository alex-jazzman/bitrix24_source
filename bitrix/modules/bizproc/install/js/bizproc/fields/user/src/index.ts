import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Dom, Extension, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BaseField, FieldRegistry, splitTopLevelValues, type RenderedControl } from 'bizproc.fields';

import {
	decorateNode,
	type LegacySelector,
	type LegacySelectorConfig,
} from './legacy-selector';

const EXTENSION_ID: string = 'bizproc.fields.user';

/** Emitted synchronously, unlike the onAfter* pair - see #handleTagChange. */
const TAG_EVENTS: string[] = ['onTagAdd', 'onTagRemove'];

/**
 * The keys of the widget configuration this type owns rather than the property. Six of them the
 * legacy backend owned as well and no setting could reach any of the six: it writes them before
 * `$config += $settings`, which leaves an already set key alone (basetype/user.php:224-236).
 * `groups` is the one this type parts with legacy over: legacy writes it after the merge, but only
 * where `GetAllowableUserGroups()` answers with something (basetype/user.php:238-259), so on a
 * document type it answers nothing for, a `groups` setting did reach the widget. Stripping it is a
 * deliberate departure: `groups` and `items` are the two keys this type never sets, and the settings
 * are the only way in left for them.
 *
 * The last two keys are of another kind still: they choose what the widget is rather than what it
 * shows. `isOnlyDialogMode` sends the widget constructor to prepareDialogOnly(), which builds
 * neither a tag selector nor a value node (user_selector.js:26,33-40,137-163) - the type would
 * then subscribe to nothing and throw writing the value, out of renderControl() and so out of the
 * render of every other field of the collection. `callbacks` is read in that mode alone and
 * belongs to a caller opening a dialog of its own, not to a field of a form.
 */
const SERVICE_CONFIG_KEYS: string[] = [
	'valueInputName',
	'value',
	'items',
	'multiple',
	'required',
	'canUseHumanResources',
	'groups',
	'isOnlyDialogMode',
	'callbacks',
];

/**
 * The longest value the widget is asked to parse. Its parsing regular expression is quadratic in
 * the length of one comma-separated pair (user_selector.js:326): one pair of 20 KB blocks the main
 * thread for 0.63 s, one of 120 KB for 22.7 s - the thread of whoever opens the form, not of
 * whoever wrote the value. A full name with an identifier is some 70 characters, so the ceiling
 * holds over a hundred employees in one field, while the worst shape it still admits - the whole
 * value as a single pair - costs about a fifth of a second.
 */
const MAX_PARSED_VALUE_LENGTH: number = 10000;

/**
 * User field type. The control itself is the legacy user selector widget: the type only
 * builds the nodes around it, hands one of them over and adapts what the widget produces
 * to the BaseField contract. The whole selection - single or multiple - lives in one
 * widget, hence rendersOwnMultiple().
 */
class UserField extends BaseField
{
	#widgetContainer: HTMLElement | null = null;
	/** The widget of the current render, whole: the tags are written through it and so is the value. */
	#selector: LegacySelector | null = null;
	/** Raised while the type writes the value itself - see #handleTagChange. */
	#suppressChange: boolean = false;

	/**
	 * The whole selection is one control, and one control is not a group: the core neither
	 * builds rows around it nor announces the field as a group of controls.
	 */
	rendersOwnMultiple(): boolean
	{
		return true;
	}

	/**
	 * The type declines the insertion decorator instead of leaving it to the caller: the
	 * decorator would replace the value node with a copy of it, while the widget keeps a
	 * direct reference to the node it created (user_selector.js:166) and would go on
	 * writing into the detached one.
	 */
	decoratesSelection(): boolean
	{
		return false;
	}

	/**
	 * The named node is the `group` around the widget, and ARIA 1.2 allows `aria-required` on the
	 * input family of roles alone - on a group the attribute is dropped and the field would be
	 * announced as optional. The requirement is spelled into the accessible name instead
	 * (see accessibleName).
	 */
	protected namedNodeCarriesRequired(): boolean
	{
		return false;
	}

	renderControl(value: string | string[] | null): RenderedControl
	{
		const valueString = this.#toValueString(value);

		// `bizproc-field-control-{name}` marks the control a person operates, and every other type
		// has that be its value node (base-field.ts:92, text-control.ts:100,113, bool/src:55). Here
		// the value node is the hidden input of the widget: never on screen, never clicked, not
		// something a test can even see. So the marker names what the person does operate - this
		// node, the widget and the insert button inside it. The container handed to the widget
		// stays unmarked on purpose: it is addressed by role and accessible name, and a marker
		// there would let a test pass around the accessibility contract it is there to check.
		const root: HTMLElement = Tag.render`
			<div
				class="bizproc-fields-user"
				data-testid="${Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			></div>
		`;

		// A node of its own for the widget: it wipes the classList of what it decorates and
		// sets its own class (user_selector.js:84-85), so the markup of the type has to live
		// on the root above it.
		const widgetContainer: HTMLElement = Tag.render`<div></div>`;
		Dom.append(widgetContainer, root);

		// No anchor is declared and the decorator is declined unconditionally (decoratesSelection
		// above), so where the field allows insertion at all, this button is the only one there
		// can be - nothing left to ask the base about.
		if (this.isSelectable() && !this.isReadOnly())
		{
			Dom.append(this.renderInsertButton(), root);
		}

		const selector = decorateNode(widgetContainer, this.#buildConfig(valueString));

		if (Type.isNull(selector))
		{
			const fallbackNode = this.#renderFallbackValueNode(widgetContainer, valueString);
			this.#applyAccessibility(widgetContainer);

			return {root, valueNode: fallbackNode, namedNode: widgetContainer};
		}

		this.#attachWidget(widgetContainer, selector);

		if (this.isReadOnly())
		{
			// setReadonly, not setLocked: locking sets `inert` on the node and takes the field out
			// of the accessibility tree, while a read-only field still has to be readable. The
			// legacy render knows no read-only at all, hence it is applied here, right after the
			// widget was initialised.
			selector.tagSelector.setReadonly(true);
			// setReadonly only paints the container and drops its focus zone (tag-selector.ts:419-429),
			// and the `--air` styles outrank the rule that would hide the add button, so the button
			// stays on screen and opens the selection dialog - a read-only field would be editable.
			selector.tagSelector.hideAddButton();
		}

		// Last, on purpose: the widget creates the value node empty and reassembles its value
		// from the tags it parsed (user_selector.js:89-90), which normalizes the string and
		// drops the id of a structure node (`Name [HRR7]` -> `Name`). The field answers with
		// the string it was given.
		selector.valueNode.value = valueString;

		// After the widget: setReadonly repaints the container it was handed, so the ARIA of the
		// field is written once the widget is done with that node.
		this.#applyAccessibility(widgetContainer);

		return {root, valueNode: selector.valueNode, namedNode: widgetContainer};
	}

	/**
	 * Makes the node the core names an object of the accessibility tree. Left a bare `<div>` it
	 * has the role `generic`, which is announced as nothing: the `<label for>` of the core cannot
	 * name a div, and the `aria-describedby` the core points at the caption goes nowhere.
	 *
	 * The role is `group` and not one of the input family: the node holds the tags, the search
	 * field and the add button of the widget - a composite container, not a control. `combobox`
	 * or `listbox` would promise a keyboard contract this type does not implement.
	 */
	#applyAccessibility(container: HTMLElement): void
	{
		Dom.attr(container, 'role', 'group');
		// Dom.attr wraps setAttribute (a DOM API, not an HTML sink): no Text.encode, or the screen
		// reader would read literal entities.
		Dom.attr(container, 'aria-label', this.accessibleName());

		if (this.isReadOnly())
		{
			// A native `disabled` has no effect on a <div> and `aria-readonly` is not allowed on a
			// group; aria-disabled is global and holds whatever the role is.
			Dom.attr(container, 'aria-disabled', 'true');
		}
	}

	/**
	 * What a screen reader calls this field. The requirement is part of the name (WCAG H90)
	 * because no ARIA state can carry it here - see namedNodeCarriesRequired - and the asterisk
	 * the core draws beside the name is aria-hidden.
	 *
	 * Only that addition belongs to the type: the name itself - trimmed, falling through to the
	 * field name where the property names the field with nothing - is the core's own rule, and
	 * naming this field by another rule than the rest is not what the requirement asks for.
	 */
	protected accessibleName(): string
	{
		const name = super.accessibleName();

		if (!this.isRequired())
		{
			return name;
		}

		// A phrase that was never loaded comes back as an empty string, not as null (core.js:4167-4172),
		// so `??` would leave the only carrier of the requirement empty.
		const requiredName = Loc.getMessage('BIZPROC_FIELDS_USER_REQUIRED_LABEL', {'#NAME#': name});

		return Type.isStringFilled(requiredName) ? requiredName : name;
	}

	/**
	 * The whole selection is one string in one node, never the list a multiple field reads: the
	 * one place this type narrows `BaseField.getValue()`, which answers a multiple field with a
	 * `string[]` of its rows. The widget holds every entity of the selection in a single value node,
	 * so there is no list to answer with. The narrowed return type says as much to whoever holds
	 * this type; a consumer branching on isMultiple() over a `BaseField` reference sees the union
	 * alone, hence the note here and on the base method.
	 */
	getValue(): string
	{
		const node = this.getValueNodes()[0];

		if (Type.isUndefined(node))
		{
			return '';
		}

		return (node as HTMLInputElement).value ?? '';
	}

	/**
	 * Written the same way round as the first render: the widget first, the value string last.
	 * The base would spread a multiple value over one node per entity, while the whole selection
	 * of this type lives in a single node of a single widget.
	 */
	protected applyValue(value: string | string[]): void
	{
		const text = this.#toValueString(value);

		// The whole selection is one string in one node, and the tags of the widget are assembled
		// from that very string: an equal string means the widget already shows this selection, so
		// rebuilding the tags would only remove and re-add every one of them. Safe to leave early -
		// the value the next render is built from is kept by setValue(), not here, and the widget
		// value node already holds the string this would write.
		if (text === this.getValue())
		{
			return;
		}

		this.#suppressChange = true;

		try
		{
			this.#syncTags(text);

			const node = this.getValueNodes()[0];

			if (!Type.isUndefined(node))
			{
				// Last: syncing the tags has the widget rewrite the value node from them, which
				// normalizes the string; the field answers with the one it was given.
				(node as HTMLInputElement).value = text;
			}
		}
		finally
		{
			// A throw from the widget must not leave the flag raised: the field would then stay
			// silent about every change the user makes afterwards.
			this.#suppressChange = false;
		}
	}

	protected release(): void
	{
		const selector = this.#selector;

		if (!Type.isNull(selector))
		{
			const tagSelector = selector.tagSelector;

			TAG_EVENTS.forEach((event) => {
				EventEmitter.unsubscribe(tagSelector, event, this.#handleTagChange);
			});

			// The dialog the widget built writes itself into a plain module Map of
			// ui.entity-selector and leaves it in destroy() alone (dialog.ts:266,292): a strong
			// reference, so dropping the node keeps every dialog of every render alive together
			// with the detached widget subtree behind it. Neither the legacy widget nor the tag
			// selector destroys it, so the type destroys what its own render created.
			tagSelector.getDialog()?.destroy();

			this.#selector = null;
		}

		// The container is let go with the subscription: the core calls release() first thing in
		// render(), while a consumer writes the value both before and after a re-render
		// (FieldManager.applyProperty) - a stale container would have applyValue() sync the tags
		// of a widget the field no longer owns.
		this.#widgetContainer = null;
	}

	/** Takes the freshly initialised widget over: what the field writes into and listens to. */
	#attachWidget(container: HTMLElement, selector: LegacySelector): void
	{
		this.#widgetContainer = container;
		this.#selector = selector;

		TAG_EVENTS.forEach((event) => {
			EventEmitter.subscribe(selector.tagSelector, event, this.#handleTagChange);
		});
	}

	/**
	 * The widget writes the selection straight into the value node without firing anything, so a
	 * change is announced from the tag events instead. Only onTagAdd/onTagRemove are listened to:
	 * the onAfter* pair is emitted from a promise (tag-selector.ts:313,367), by which time the
	 * synchronous flag below is down and a programmatic write would announce itself.
	 */
	#handleTagChange = (): void => {
		if (this.#suppressChange)
		{
			return;
		}

		this.emitChange();
	};

	/** Brings the tags shown by the widget onto the value the field was handed. */
	#syncTags(text: string): void
	{
		const container = this.#widgetContainer;
		const selector = this.#selector;

		// Both are taken over and let go together (see #attachWidget and release), so a widget
		// this field no longer owns is never written into.
		if (Type.isNull(container) || Type.isNull(selector))
		{
			return;
		}

		// Every tag taken off has the widget hand the browser focus to the next focusable node of
		// its own container, without ever asking where the focus is now (tag-selector.ts:355-365 ->
		// focus-navigator.ts:359-371). A write from code belongs to the caller and not to the person
		// at the keyboard, so the focus is left the way it was found - see #restoreFocus.
		const focusBefore = this.#focusedElement();

		selector.tagSelector.removeTags();

		const parsable = this.#parsableValue(text);

		// Nothing is parsed out of an empty string - the widget reads an empty value the same way
		// (user_selector.js:69), while parseValue('') would answer with one nameless tag.
		if (Type.isStringFilled(parsable))
		{
			selector.parseValue(parsable).forEach((item) => {
				// A value written from code is not an entity the user just picked, and the appearance
				// animation is not only cosmetic here: with it addTag reads and writes the geometry of
				// the container once the animation is over (tag-selector.ts:308-312).
				selector.tagSelector.addTag({...item, animate: false});
			});
		}

		this.#restoreFocus(container, focusBefore);
	}

	/**
	 * Leaves the browser focus the way #syncTags found it. What the widget took from elsewhere goes
	 * back there; where the focus was on nothing at all, the widget does not get to keep what the
	 * write took from no one - a write not started by a click (on load, on a timer, on an ajax
	 * answer) would otherwise scroll the form to the widget and move the point Tab continues from.
	 * Focus that already was inside the widget is left alone: moving it there is its own business.
	 * A remembered node no longer in the document is treated as the third case rather than the
	 * first: nothing can be focused there, so what the widget took is dropped instead of kept.
	 */
	#restoreFocus(container: HTMLElement, focusBefore: HTMLElement | null): void
	{
		if (!Type.isNull(focusBefore))
		{
			if (container.contains(focusBefore))
			{
				return;
			}

			if (document.activeElement !== focusBefore)
			{
				focusBefore.focus();
			}

			// A node taken out of the document between the snapshot and here - a neighbour field
			// re-rendered by the very event this write came with - cannot be focused at all, so the
			// focus is still where the widget put it and there is nowhere to hand it back to.
			if (document.activeElement === focusBefore)
			{
				return;
			}
		}

		this.#dropFocusTakenBy(container);
	}

	/** Undoes the focus the widget helped itself to where there is nobody to return it to. */
	#dropFocusTakenBy(container: HTMLElement): void
	{
		const focusTaken = this.#focusedElement();

		if (!Type.isNull(focusTaken) && container.contains(focusTaken))
		{
			focusTaken.blur();
		}
	}

	/**
	 * The element the browser focus is on, or null where it is on nothing. `document.activeElement`
	 * answers with `body` when nothing is focused (and with null while the document is being taken
	 * apart), and `body.focus()` is not an operation on a node without `tabindex` - taken for a
	 * place to return the focus to, either would silently leave it wherever the widget put it.
	 */
	#focusedElement(): HTMLElement | null
	{
		const focused = document.activeElement;

		if (!Type.isElementNode(focused) || focused === document.body || focused === document.documentElement)
		{
			return null;
		}

		return focused;
	}

	/**
	 * The value the widget gets. Explicit keys win over Property.Settings, which only fills
	 * the gaps - the order the legacy backend assembles the same config in (`$config +=
	 * $settings`, basetype/user.php:233-236). Spreading the settings last would let a
	 * property override the name of the value input and the value itself, and spreading them
	 * whole would hand the widget the service keys this type does not set at all - see
	 * SERVICE_CONFIG_KEYS.
	 */
	#buildConfig(value: string): LegacySelectorConfig
	{
		const settings = this.getProperty().Settings ?? {};
		const gapFillers: Record<string, unknown> = {};

		Object.keys(settings).forEach((key) => {
			if (!SERVICE_CONFIG_KEYS.includes(key))
			{
				gapFillers[key] = settings[key];
			}
		});

		return {
			...gapFillers,
			// Not getControlName(): it appends `[]` for a multiple field, and the legacy value
			// parsing expects the flat name.
			valueInputName: this.getFieldName(),
			// The config value is what the widget parses its tags out of, so it is capped; the
			// value node gets the whole string afterwards either way (see renderControl).
			value: this.#parsableValue(value),
			multiple: this.isMultiple(),
			required: this.isRequired(),
			canUseHumanResources: Extension.getSettings(EXTENSION_ID).get('canUseHumanResources') === true,
		};
	}

	/**
	 * The part of the value the widget is given to parse. Over the ceiling nothing is: the field
	 * keeps the value and answers with it, only the tags of it are not drawn - losing a value the
	 * field was handed would be a worse answer to a slow parse than showing it untagged.
	 */
	#parsableValue(value: string): string
	{
		if (value.length <= MAX_PARSED_VALUE_LENGTH)
		{
			return value;
		}

		console.warn(
			`[bizproc.fields.user] value of "${this.getFieldName()}" is ${value.length} characters long, over the `
			+ `${MAX_PARSED_VALUE_LENGTH} the legacy widget is asked to parse; the value is kept, its tags are not shown`,
		);

		return '';
	}

	/** Keeps the field collectable by the form where the legacy widget is not on the page. */
	#renderFallbackValueNode(container: HTMLElement, value: string): HTMLInputElement
	{
		const node: HTMLInputElement = Tag.render`
			<input type="hidden" name="${Text.encode(this.getFieldName())}"/>
		`;
		node.value = value;
		Dom.append(node, container);

		return node;
	}

	/** The whole selection travels as one comma-separated string, never as the core's list. */
	#toValueString(value: string | string[] | null): string
	{
		// Empty elements are dropped the way the base drops them (base-field.ts:298-300): the
		// widget takes an empty pair between two commas down to its last parse branch, where it
		// makes a tag out of it unconditionally (user_selector.js:396-401) - a nameless tag on
		// screen for a slot the user never filled.
		const text = Type.isArray<string>(value)
			? value.filter((item) => item !== '').join(',')
			: (value ?? '');

		return this.#toOwnMultiplicity(text);
	}

	/**
	 * The value string cut down to the multiplicity of the field. A single field holds one entity
	 * and the widget only holds itself to that on screen: in single mode addTag() removes the tags
	 * it has before adding one (tag-selector.ts:297-299), so a longer string would leave the field
	 * showing one employee while answering the form with every one of them.
	 *
	 * Where a property stops being Multiple the value is carried over by the core, which collapses
	 * a list to its first filled item (FieldManager.#adaptValue) - the string this type answers
	 * with even when Multiple is the one shape that never reaches that branch, hence the same
	 * collapsing here, by the same rule. What counts as one entity is #splitEntities: the comma the
	 * widget reads the value by (user_selector.js:321), taken at the top level alone.
	 */
	#toOwnMultiplicity(text: string): string
	{
		if (this.isMultiple())
		{
			return text;
		}

		return this.#splitEntities(text).find((item) => Type.isStringFilled(item)) ?? '';
	}

	/**
	 * The entities of a value string, cut on the commas between them and on no other: an entity may
	 * be an expression rather than an employee, and an expression carries commas of its own (see
	 * splitTopLevelValues, where the rule lives for every type that reads a list off a scalar).
	 *
	 * The counter behind it knows nothing of quotes, so the brace of `{{=concat("{", A)}}` opens a
	 * depth that never closes and the rest stays one entity. Escaping the separator is what would
	 * settle that, and it is not this type's to introduce - the value format is the legacy widget's
	 * (user_selector.js:321).
	 */
	#splitEntities(text: string): string[]
	{
		return splitTopLevelValues(text);
	}
}

FieldRegistry.register('user', UserField);

export { UserField };
