import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Dom, Event, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import {
	Popover,
	type PopoverClassName,
	type PopoverDesignContext,
	type PopoverOptions,
	type PopoverPositioning,
	type PopoverTarget,
} from 'ui.system.popover';

// Types only: the runtime dictionaries are already global on BX.UI.System.Popover through the rel, and
// re-exporting them into the shared namespace would risk name shadowing (CF1015).
export type * from 'ui.system.popover';

// A listener as it went on the node, kept under the key it came from: the key carries the modifiers, so two
// keys of the same event (onClick and onClickCapture) are two subscriptions and never one.
//
// handlers is what the key carried, listener is what the node got. The two differ once a key carries several
// functions: Vue merges the handlers of one event coming from different places (a v-bind of an object next to
// an @click of the tag, a parent forwarding its own on top of a child) into an array, and one subscription
// calling them in order is what an element rendered by Vue would get. The function that went on the node is
// kept because it is the only one removeEventListener answers to - a wrapper built anew would leave the old
// subscription on the node for good.
type AppliedListener = {
	event: string;
	handlers: EventListener[];
	listener: EventListener;
	options: AddEventListenerOptions;
};

type BPopoverData = {
	contentNode: HTMLElement | null;
	popover: Popover | null;
	appliedOptions: Record<string, unknown>;
	appliedAttributes: string[];
	appliedListeners: Record<string, AppliedListener>;
	appliedStyle: Record<string, string>;
};

// A name written the way CSS and the DOM read it: the case boundary of a camel-cased name becomes a hyphen and
// the whole is lowercased, so backgroundColor arrives as background-color and MouseOver as mouse-over.
const hyphenate = (name: string): string => name.replaceAll(/\B([A-Z])/g, '-$1').toLowerCase();

// The instance as the synchronisation of the options needs it. Named by the methods rather than by the class,
// because the popover is kept in the data of the component and what comes back out of there is the shape of
// the instance and not the instance type - the private fields of a class are no part of a shape.
type PopoverSetters = Pick<
	Popover,
	| 'setTarget'
	| 'setPositioning'
	| 'setClassName'
	| 'setDesignContext'
	| 'setCloseByClickOutside'
	| 'setCloseByEsc'
>;

type OptionSetter = {
	name: string;
	apply: (popover: PopoverSetters, value: unknown) => void;
};

// Every option that can change after the constructor, next to the call that changes it - and in the order one
// pass applies them, which is what makes a tick with several changed options a single piece of work. First
// the two that only switch a subscription, then the two that recompute the position in place, and last the
// two that relaunch the cycle: so the tick ends on the cycle the last of them starts, and that cycle already
// reads the root and the bubble as the appearance options have left them. The other way round the relaunch
// would compute against the old classes and the recompute of the appearance would land on a cycle a frame
// old. An undefined value is handed over as it is: the class reads every one of them through the same
// normalisation the constructor uses, so a key the consumer stopped binding returns the option to what it is
// without one.
const OPTION_SETTERS: OptionSetter[] = [
	{ name: 'closeByClickOutside', apply: (popover, value) => popover.setCloseByClickOutside(value !== false) },
	{ name: 'closeByEsc', apply: (popover, value) => popover.setCloseByEsc(value !== false) },
	{ name: 'className', apply: (popover, value) => popover.setClassName(value as PopoverClassName) },
	{ name: 'designContext', apply: (popover, value) => popover.setDesignContext(value as PopoverDesignContext) },
	{ name: 'target', apply: (popover, value) => popover.setTarget(value as PopoverTarget) },
	{ name: 'positioning', apply: (popover, value) => popover.setPositioning(value as PopoverPositioning) },
];

// A copy of the value as it stood when it was applied. The plain objects and the arrays are copied through, so
// that a later change of one of them in place is a change against this copy and not against itself; everything
// else is kept as it came - an element, a function and a virtual anchor of the consumer are the things they
// are, and a copy of one would be another thing entirely.
const snapshotValue = (value: unknown): unknown => {
	if (Type.isArray(value))
	{
		return (value as unknown[]).map((item) => snapshotValue(item));
	}

	if (Type.isPlainObject(value))
	{
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, snapshotValue(item)]),
		);
	}

	return value;
};

// Two values told apart the way a binding of the consumer changes them: the plain objects and the arrays are
// read through, because `:options="{ ... }"` builds a new one on every render of the parent and an equal one is
// no change at all. Everything else answers to identity, an element and a function included - a node is the
// node it is, and no reading of its fields tells one from another.
const isSameValue = (left: unknown, right: unknown): boolean => {
	if (Object.is(left, right))
	{
		return true;
	}

	if (Type.isArray(left) && Type.isArray(right))
	{
		const leftItems = left as unknown[];
		const rightItems = right as unknown[];

		return leftItems.length === rightItems.length
			&& leftItems.every((item, index) => isSameValue(item, rightItems[index]));
	}

	if (Type.isPlainObject(left) && Type.isPlainObject(right))
	{
		const leftEntries = Object.entries(left as Record<string, unknown>);
		const rightFields = right as Record<string, unknown>;

		return leftEntries.length === Object.keys(rightFields).length
			&& leftEntries.every(([key, item]) => {
				return Object.hasOwn(rightFields, key) && isSameValue(item, rightFields[key]);
			});
	}

	return false;
};

// The settable options of a value of the prop, each of them copied: the applied state the next change is
// measured against.
const readOptions = (options: Record<string, unknown>): Record<string, unknown> => {
	return Object.fromEntries(OPTION_SETTERS.map(({ name }) => [name, snapshotValue(options[name])]));
};

// The name is read in the lower case, because that is the case it lands in: setAttribute lowercases the name
// it is given, so STYLE arrives as style and rewrites the whole inline style of the bubble, the service
// properties of the popover among it. Whatever case it came in, such a key goes the property by property way.
const isStyleKey = (name: string): boolean => name.toLowerCase() === 'style';

// A name the engine knows as an event handler of an element, and the lower case is the case it is asked in:
// setAttribute lowercases the name it is given, so onclick, Onclick and ONCLICK are one and the same handler
// once they are on the node. The DOM is asked rather than the shape of the name, and that is the whole
// difference between onclick and once: the first is a handler of every element, the other two letters make
// an attribute of the consumer, and so do only and onboarding-id.
const isInlineHandlerName = (name: string): boolean => {
	return name.startsWith('on') && name in HTMLElement.prototype;
};

// Both shapes of a listener key Vue reads: onClick, and on:click, the form it keeps for an event whose name
// has to reach the DOM exactly as written. Read in the case they are written in, because the case is what
// tells them apart from an attribute - onClick and onboarding-id both open with "on", and only the first is
// a listener to Vue. A key written in a case Vue itself would not read is taken as a listener all the same,
// as long as the browser would turn it into an inline handler: none of those may reach setAttribute.
const isListenerKey = (name: string): boolean => {
	return /^on[:A-Z]/.test(name) || isInlineHandlerName(name.toLowerCase());
};

// The modifiers Vue allows at the end of a key, stripped off one by one: onClickOnce and onScrollPassiveCapture
// are the shapes of the tail.
const LISTENER_MODIFIER = /(Once|Passive|Capture)$/;

// A key of a listener taken apart the way Vue takes it apart: the modifiers of the tail become the options of
// the subscription, and what is left after "on" is the name of the event, hyphenated and lowercased, so
// onClick becomes click and onMouseover becomes mouseover. Behind the colon of the on: form the name is taken
// as it stands, case and all - that is what the form is for, and a custom event named myEvent is reachable no
// other way.
const readListenerKey = (key: string): { event: string; options: AddEventListenerOptions } => {
	const options: AddEventListenerOptions = {};
	let name = key;

	for (
		let modifier = LISTENER_MODIFIER.exec(name);
		modifier !== null;
		modifier = LISTENER_MODIFIER.exec(name)
	)
	{
		if (modifier[1] === 'Once')
		{
			options.once = true;
		}
		else if (modifier[1] === 'Passive')
		{
			options.passive = true;
		}
		else
		{
			options.capture = true;
		}

		name = name.slice(0, -modifier[1].length);
	}

	return { event: name[2] === ':' ? name.slice(3) : hyphenate(name.slice(2)), options };
};

// The functions a key of a listener carries, in the order they were written in: one on its own, or the array
// Vue merges several of them into - an @click of the tag next to a v-bind that carries one, a parent adding
// its own on top of a child. Everything that is no function is left out, the whole key with it if nothing is
// left: that is the fork Vue takes on an element of its own, and it is what keeps a string of a handler away
// from setAttribute.
const readHandlers = (value: unknown): EventListener[] => {
	const items = Type.isArray(value) ? (value as unknown[]) : [value];

	return items.filter((item) => Type.isFunction(item)) as EventListener[];
};

const sameHandlers = (left: EventListener[] | undefined, right: EventListener[]): boolean => {
	return left !== undefined
		&& left.length === right.length
		&& left.every((handler, index) => handler === right[index]);
};

// One function on the node for one key, whatever the key carried. A single handler goes on as itself - there
// is nothing to wrap and no reason to hide it from anybody reading the node. Several are called in the order
// they came, with the node as their this, which is what a listener of the DOM is given.
const buildListener = (handlers: EventListener[]): EventListener => {
	if (handlers.length === 1)
	{
		return handlers[0];
	}

	// Typed through EventListener rather than by naming the event: Event in this file is the one imported from
	// main.core, and the DOM event of a listener is another type entirely.
	const listener: EventListener = (event): void => {
		handlers.forEach((handler) => handler.call(event.currentTarget, event));
	};

	return listener;
};

// A name that is a member of Object.prototype is never subscribed. Event.bind of main.core looks the name of
// the event up in its table of synonyms with the in operator, and the table is a plain object literal, so the
// whole prototype chain answers for it: constructor is "found" there and what comes back is the Object
// function rather than a list of names. The forEach over it throws before anything is subscribed, and the
// exception leaves the listeners behind it and the whole style unsynchronised. The place to mend that is
// main.core (an own-property check instead of in); here such a key is dropped, and no page goes down over it.
const isBindableEvent = (event: string): boolean => !(event in Object.prototype);

// The name of a single property and nothing else, and the engine is the one asked rather than a list kept
// here: a name reaches the node only if the CSS has a property of that name. The object form is what makes
// this question worth asking - it reaches the node with no parser in between, so a key of it is written on
// the style object as it stands, while a string goes through the CSS parser and arrives as declarations
// already. That way a member of the style object never passes for a property, whatever it is called and in
// whatever case. cssText is the whole inline style at once, and writing it would take the service
// properties of the popover along; length and parentRule are read-only, and an assignment to one of them
// throws; a method, written over, is shadowed by an own field of the object, and the next write of a custom
// property calls a string. An indexed name (0, 1 and on) reads out a declaration already written and takes no
// writing either, and the same question turns it down - the CSS has no property named by a number. Any of them
// would have left the declarations behind it unwritten.
//
// initial is the value the question is asked with because every property takes it, so the answer turns on the
// name alone. A custom property is asked about the very same way and the engine knows those too: it takes any
// name a CSS identifier allows behind the -- prefix, and that is a wider set than it looks - a digit right
// after the prefix, an underscore, a letter of any alphabet. Spelling that set out here is what a list of
// allowed names always turns into, a narrower copy of a rule somebody else owns, and --popover_color would
// have been lost to it. The one thing not done to such a name is hyphenating it: a custom property is
// case-sensitive, --myColor and --my-color are two different properties, and the camel case of the object
// form belongs to the properties of the CSS alone.
const isStyleProperty = (name: string): boolean => {
	return CSS.supports(name.startsWith('--') ? name : hyphenate(name), 'initial');
};

// The boolean attributes of HTML, the list Vue keeps of them and the whole of it. On these and only these the
// value is the presence of the attribute: anything truthy (and an empty string, the shape <div hidden> arrives
// in) writes the attribute empty, anything else takes it off the node. Everywhere else false is written out as
// the string it is, because aria-expanded="false" is a state of its own and the absence of the attribute is
// another - a collapsed control and a control that does not expand at all.
//
// Not narrowed to the names a plain container would carry, for two reasons. The first is that the narrowing
// has no line to draw: hidden and inert answer for any element there is, and the wrapper is the same fork Vue
// takes on an element it renders itself - a list that keeps some of that fork and drops the rest reads as
// complete to whoever adds a name to it next. The second is the value of a bound false: whatever the element,
// disabled="false" is the attribute present and the state the binding denied.
const BOOLEAN_ATTRIBUTES = new Set([
	'allowfullscreen',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'formnovalidate',
	'hidden',
	'inert',
	'ismap',
	'itemscope',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'readonly',
	'required',
	'reversed',
	'scoped',
	'seamless',
	'selected',
]);

const isBooleanAttribute = (name: string): boolean => BOOLEAN_ATTRIBUTES.has(name.toLowerCase());

const isAttributePresent = (value: unknown): boolean => Boolean(value) || value === '';

// Properties of the bubble the extension owns: the margin it writes inline in prepareBody. That one is no
// default of the layout - the root is sized by its content, so a margin of the bubble would enter the size of
// the root and take the arrow, which hangs on the edge of the root, away from the bubble by exactly that much.
// Hence both ways at once: a declaration of the consumer named here is not written, and a property named here
// is not taken off by the cleanup either. Without the first the two writes would race - the fallthrough style
// goes on the node in created() and the service one in the first show(), so which of them stood on the node
// would depend on whether an update had come since; without the second a margin the consumer stopped binding
// would take the service one off the node with it. The outer gap has an address of its own, the offset option
// of the positioning. The shorthand and every longhand of it: margin-top alone detaches the arrow just as well.
const isServiceStyleProperty = (name: string): boolean => /^margin(-|$)/.test(hyphenate(name));

// Declarations of a fallthrough style, in either form it arrives in. A bound style and a static attribute of
// a template both come normalised into an object; a string is what a render function or a spread binding
// hands over, and there the CSS parser is asked instead of the string being taken apart here. Only the parser
// knows where one declaration ends: a semicolon inside a value (a data URL with a charset carries one) is no
// separator, and a property written twice is the cascade of an inline style, which it resolves. It is also
// the strictest reader of a property name there is - a name that names no property leaves no declaration
// behind, so nothing of what the object form has to be guarded against survives this way in.
//
// The element is detached and stays that way: assigning cssText parses the declarations and nothing else, and
// a url() of a background never reaches the network from a node outside the document.
const styleDeclarations = (value: unknown): Record<string, string> => {
	if (Type.isPlainObject(value))
	{
		return value as Record<string, string>;
	}

	if (!Type.isString(value))
	{
		return {};
	}

	const { style } = document.createElement('div');
	style.cssText = value;

	// The indexed names of a declaration block, custom properties among them.
	return Object.fromEntries([...style].map((name) => [name, style.getPropertyValue(name)]));
};

// Thin Vue wrapper over the imperative Popover: content comes through the slot, events become emits. The
// instance is kept non-reactive (markRaw) because a Vue proxy breaks access to private #-fields.
//
// Declarative in its options: a change of the options prop is carried over to the methods of the class, so a
// bound target, positioning, className, designContext, closeByClickOutside or closeByEsc is followed. The
// content is the one option that is not and cannot be - it is the slot, and the node it lives in is built once
// in created() and handed to the constructor; what changes inside that node is the render of Vue and reaches
// the popover without any option taking part. Two more are read once as well: container is the place of the
// mount, chosen when the popover is built, and events is the imperative way to subscribe, which has an address
// of its own here - the emits of the tag. The positioning is merged by the class rather than replaced, so a key
// taken out of the binding keeps the value it had; hand over the value you want instead of taking the key away.
export const BPopover = defineComponent({
	name: 'BPopover',
	// The bubble of the popover is the node created below and handed over as content, and Vue never renders
	// it - so it never applies the fallthrough attributes to it either, and on a Teleport root it would have
	// nowhere to put them anyway. They are carried over by hand instead: `<BPopover class="my-tip">` paints
	// the bubble. The className option is another address entirely - it puts classes on the service root of
	// the popover, the node that carries data-position and the positioning coordinates.
	inheritAttrs: false,
	props: {
		options: {
			type: Object as PropType<Omit<PopoverOptions, 'content'>>,
			default: (): Omit<PopoverOptions, 'content'> => ({}),
		},
	},
	emits: ['show', 'hide', 'stateChange', 'destroy'],
	data(): BPopoverData
	{
		return {
			contentNode: null,
			popover: null,
			appliedOptions: markRaw({}),
			appliedAttributes: [],
			appliedListeners: {},
			appliedStyle: {},
		};
	},
	watch: {
		// Read deep, because the two ways the prop changes look different from here: `:options="{ ... }"` hands
		// over a new object on every render of the parent, while a bound object of theirs changes in place and
		// is never handed over anew. Which of the two is a change of the popover and which is not is decided in
		// syncOptions(), by the content of every option on its own.
		options: {
			deep: true,
			handler(): void
			{
				this.syncOptions();
			},
		},
	},
	created(): void
	{
		// The content node is created before mounting: Teleport needs an existing target.
		const contentNode = document.createElement('div');
		const popover = markRaw(new Popover({ ...this.options, content: contentNode }));

		popover.subscribe('onShow', (event: BaseEvent): void => {
			this.$emit('show', event);
		});
		popover.subscribe('onHide', (event: BaseEvent): void => {
			this.$emit('hide', event);
		});
		popover.subscribe('onStateChange', (event: BaseEvent): void => {
			this.$emit('stateChange', event);
		});
		popover.subscribe('onDestroy', (event: BaseEvent): void => {
			this.$emit('destroy', event);
		});

		this.contentNode = markRaw(contentNode);
		this.popover = popover;
		// What the constructor has just been given is the applied state of the options: the watcher measures
		// every later value against it, and the first change is the first call of a method of the class.
		this.appliedOptions = markRaw(readOptions(this.options as Record<string, unknown>));
		this.syncAttributes();
	},
	mounted(): void
	{
		// Teleport has already rendered into the node, so the first measurement is not empty.
		this.popover?.show();
	},
	updated(): void
	{
		// The bubble is out of the render tree, so an update of the component is the only moment the wrapper
		// learns that a bound class or style of the consumer has changed.
		const changed = this.syncAttributes();

		// And the look of the bubble is read by the positioning: the arrow takes the computed background of
		// the bubble and keeps its distance from the corners by the computed radius, so a new background or a
		// new radius reaches the arrow through a recompute and no other way - the size did not change, and the
		// observer that watches it stays silent. In place and never a relaunch: the applied state and the
		// subscriptions survive, so there is nothing to see but the arrow coming out right.
		//
		// Only when the pass above actually wrote something, though. An update of the component is no news for
		// the positioning by itself: the content of the slot renders inside the bubble and the observers of
		// the cycle watch its size, and `:style="{ ... }"` in a template hands over a new object on every
		// render of the parent while the declarations in it stay the same. The pass says which of the two
		// happened, and it has already run - so the recompute reads the bubble as this very update left it.
		if (changed)
		{
			this.popover?.adjustPosition();
		}
	},
	unmounted(): void
	{
		// Listeners come off the node the same way they went on it: by hand. An empty set of attributes is
		// exactly the case of every key of a listener being gone at once.
		if (this.contentNode !== null)
		{
			this.syncListeners(this.contentNode, {});
		}

		this.popover?.destroy();
	},
	methods: {
		// Every changed option handed to the method of the class that owns it, and the unchanged ones left
		// alone. The comparison is by content and never by reference, because a relaunch is what most of these
		// methods cost: setPositioning() takes the subscriptions off, drops the applied state and spends a frame
		// with the container at visibility: hidden, so an object equal to the applied one would make the popover
		// blink for nothing. Each option is decided on its own for the same reason - a new class name has no
		// business restarting the positioning.
		//
		// One pass over the whole list per change of the prop, in the order the list is written in - see
		// OPTION_SETTERS for what that order is worth.
		syncOptions(): void
		{
			const popover = this.popover;
			if (popover === null)
			{
				return;
			}

			const options = this.options as Record<string, unknown>;
			const applied = { ...this.appliedOptions };

			OPTION_SETTERS.forEach(({ name, apply }) => {
				const value = snapshotValue(options[name]);
				if (isSameValue(value, applied[name]))
				{
					return;
				}

				applied[name] = value;
				apply(popover, value);
			});

			this.appliedOptions = markRaw(applied);
		},
		// Answers whether anything the positioning can read has moved on the bubble: an attribute written, an
		// attribute taken off, a declaration of the style changed. The listeners are no part of that answer -
		// a subscription changes nothing a computed style could tell.
		syncAttributes(): boolean
		{
			const node = this.contentNode;
			if (node === null)
			{
				return false;
			}

			const attributes = this.$attrs as Record<string, unknown>;
			const names = Object.keys(attributes).filter((name) => !isStyleKey(name) && !isListenerKey(name));
			let changed = false;

			// Names that were applied last time and are gone now: a class the consumer stopped binding must
			// leave the node with it.
			this.appliedAttributes
				.filter((name) => !names.includes(name))
				.forEach((name) => {
					changed = changed || node.hasAttribute(name);
					node.removeAttribute(name);
				});
			this.appliedAttributes = names;

			// The same fork Vue takes on an element it renders itself: null and undefined are the only values
			// that take an attribute off, a boolean attribute answers to the presence of its value instead, and
			// everything else is written out as the string of the value.
			names.forEach((name) => {
				const value = attributes[name];
				const boolean = isBooleanAttribute(name);

				if (Type.isNil(value) || (boolean && !isAttributePresent(value)))
				{
					changed = changed || node.hasAttribute(name);
					node.removeAttribute(name);

					return;
				}

				// What the write will leave on the node, asked of the node before the write: an attribute keeps
				// the string it was given, so a value of its own and the attribute are comparable as they are.
				// An object-like value is another matter - Dom.attr encodes those on terms of its own - so one
				// of them is not compared at all and counts as a change, exactly as every value did before.
				const written = boolean ? '' : String(value);
				changed = changed || Type.isObjectLike(value) || node.getAttribute(name) !== written;

				Dom.attr(node, name, boolean ? '' : value);
			});

			// The style is taken by the name it came under, whatever its case; the first of them wins, should a
			// binding somehow carry two.
			const styleKey = Object.keys(attributes).find((name) => isStyleKey(name));

			this.syncListeners(node, attributes);

			return this.syncStyle(node, styleKey === undefined ? null : attributes[styleKey]) || changed;
		},
		// Only a function becomes a listener, a value of any other shape is dropped: the same fork Vue takes on
		// an element it renders itself. Neither shape of such a key reaches setAttribute, whatever case it is
		// written in - a string written there under a name the browser knows as a handler would run in the page,
		// and one under a name it does not would sit on the node as the source text of a function of the
		// consumer, saying nothing and read by nobody. A key carrying an array is read function by function by
		// the same rule, so a string among them is dropped and the functions next to it are heard.
		syncListeners(node: HTMLElement, attributes: Record<string, unknown>): void
		{
			const listeners: Record<string, AppliedListener> = {};
			Object.keys(attributes)
				.filter((name) => isListenerKey(name))
				.forEach((name) => {
					const handlers = readHandlers(attributes[name]);
					if (handlers.length === 0)
					{
						return;
					}

					const { event, options } = readListenerKey(name);
					if (!isBindableEvent(event))
					{
						return;
					}

					// A composition that has not changed keeps the very function that went on the node: the
					// array itself is built anew by every render of the parent, and a wrapper built anew with it
					// would resubscribe the key on every update - and, worse, leave the previous subscription
					// behind, since nothing but that function takes it off.
					const previous = this.appliedListeners[name];
					const listener = sameHandlers(previous?.handlers, handlers)
						? previous.listener
						: buildListener(handlers);

					listeners[name] = { event, handlers, listener, options };
				});

			// A listener leaves the node once its value has changed or its key is gone; the one that stayed the
			// same is left alone, so an update of the component does not resubscribe it. It comes off with the
			// options it went on with: a capturing listener answers to nothing else.
			Object.entries(this.appliedListeners)
				.filter(([key, applied]) => listeners[key]?.listener !== applied.listener)
				.forEach(([, applied]) => Event.unbind(node, applied.event, applied.listener, applied.options));

			Object.entries(listeners)
				.filter(([key, applied]) => this.appliedListeners[key]?.listener !== applied.listener)
				.forEach(([, applied]) => Event.bind(node, applied.event, applied.listener, applied.options));

			this.appliedListeners = listeners;
		},
		// Written property by property and never as a whole style attribute: the popover keeps a service
		// property of its own on this very node (the margin that holds the arrow on the edge of the bubble),
		// and a rewritten attribute would take it along. The property itself is left out of the sync in both
		// directions - see isServiceStyleProperty.
		//
		// Answers whether a declaration moved. The comparison goes against the values applied last time and
		// not against the node, because the node answers with the value as the CSS serialises it: url(x) comes
		// back as url("x"), and a declaration equal to the one already there would read as changed for good.
		syncStyle(node: HTMLElement, value: unknown): boolean
		{
			const declarations = styleDeclarations(value);
			const properties = Object.keys(declarations)
				.filter((name) => isStyleProperty(name) && !isServiceStyleProperty(name));

			const applied = this.appliedStyle;
			let changed = false;

			Object.keys(applied)
				.filter((property) => !properties.includes(property))
				.forEach((property) => {
					changed = true;
					Dom.style(node, property, null);
				});

			const next: Record<string, string> = {};
			properties.forEach((property) => {
				const declaration = declarations[property];
				next[property] = declaration;
				if (applied[property] === declaration)
				{
					return;
				}

				changed = true;
				Dom.style(node, property, declaration);
			});

			this.appliedStyle = next;

			return changed;
		},
	},
	template: `
		<Teleport v-if="contentNode" :to="contentNode">
			<slot/>
		</Teleport>
	`,
});
