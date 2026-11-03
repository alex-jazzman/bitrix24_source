import { Dom, Event, Type } from 'main.core';

// Fallthrough $attrs carried by hand onto a node Vue never renders. A Vue wrapper over a class that owns its
// own DOM (the bubble of a popover, the card of a callout) gets no help from Vue here: the node is out of the
// render tree, so the attributes, the classes, the style and the listeners of the tag reach it only this way.
// The security-sensitive part of that is the whole reason this is one module and not one per wrapper - a key
// of a listener that reached setAttribute would be an inline handler running in the page.
//
// The node is shared with its owner, so the sync is additive throughout and never writes a whole attribute:
// the helper keeps what it applied itself, takes off nothing else, and passes the protected names of the owner
// by in both directions.

// A pattern of a protected name: the name as it stands, or an expression the name is matched against.
export type AttrsSyncPattern = string | RegExp;

export type AttrsSyncOptions = {
	getNode: () => HTMLElement | null;
	protectedAttributes?: AttrsSyncPattern[];
	protectedStyleProps?: AttrsSyncPattern[];
	protectedClasses?: AttrsSyncPattern[];
};

export type AttrsSync = {
	sync: (attrs: Record<string, unknown>) => boolean;
	clear: () => void;
};

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

// A name written the way CSS and the DOM read it: the case boundary of a camel-cased name becomes a hyphen and
// the whole is lowercased, so backgroundColor arrives as background-color and MouseOver as mouse-over.
const hyphenate = (name: string): string => name.replaceAll(/\B([A-Z])/g, '-$1').toLowerCase();

// Every name is read against the pattern from its beginning, and search() and not test() is what does that:
// an expression of the consumer may carry the g or the y flag, and test() of such a one starts where the
// previous name left it and keeps the place for the next. The names arrive one after another, so every other
// one of them would come back unmatched - a protected class taken for one of the consumer, and the service
// classes of the owner off the node with it. search() reads no lastIndex and leaves none behind, so the
// expression comes out of the match as it went in.
const matchesPattern = (name: string, patterns: AttrsSyncPattern[]): boolean => {
	return patterns.some((pattern) => (pattern instanceof RegExp ? name.search(pattern) !== -1 : pattern === name));
};

// The name is read in the lower case, because that is the case it lands in: setAttribute lowercases the name
// it is given, so STYLE arrives as style and rewrites the whole inline style of the node, the service
// properties of the owner among it. Whatever case it came in, such a key goes the property by property way.
const isStyleKey = (name: string): boolean => name.toLowerCase() === 'style';

// And the same for the classes, which are synchronised token by token for the same reason: CLASS written
// through setAttribute is the whole class attribute of a node the owner dresses itself.
const isClassKey = (name: string): boolean => name.toLowerCase() === 'class';

// A name the engine knows as an event handler of an element, and the lower case is the case it is asked in:
// setAttribute lowercases the name it is given, so onclick, Onclick and ONCLICK are one and the same handler
// once they are on the node. The DOM is asked rather than the shape of the name, and that is the whole
// difference between onclick and once: the first is a handler of every element, the other two letters make
// an attribute of the consumer, and so do only and onboarding-id.
//
// The node itself is the one asked, because the handlers of an element are the ones of its own kind: onmessage
// and onstorage answer on a body and on nothing else, and a table of the base class would have let them
// through to setAttribute on the very element that runs them. Before there is a node the base class is all
// there is to ask.
const isInlineHandlerName = (name: string, node: HTMLElement | null): boolean => {
	return name.startsWith('on') && name in (node ?? HTMLElement.prototype);
};

// Both shapes of a listener key Vue reads: onClick, and on:click, the form it keeps for an event whose name
// has to reach the DOM exactly as written. Read in the case they are written in, because the case is what
// tells them apart from an attribute - onClick and onboarding-id both open with "on", and only the first is
// a listener to Vue. A key written in a case Vue itself would not read is taken as a listener all the same,
// as long as the browser would turn it into an inline handler: none of those may reach setAttribute.
const isListenerKey = (name: string, node: HTMLElement | null): boolean => {
	return /^on[:A-Z]/.test(name) || isInlineHandlerName(name.toLowerCase(), node);
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

// The name of a single property as CSS spells it. A custom property keeps the case it came in - --myColor and
// --my-color are two different properties, and the camel case of the object form belongs to the properties of
// the CSS alone.
const stylePropertyName = (name: string): string => (name.startsWith('--') ? name : hyphenate(name));

// The name of a single property and nothing else, and the engine is the one asked rather than a list kept
// here: a name reaches the node only if the CSS has a property of that name. The object form is what makes
// this question worth asking - it reaches the node with no parser in between, so a key of it is written on
// the style object as it stands, while a string goes through the CSS parser and arrives as declarations
// already. That way a member of the style object never passes for a property, whatever it is called and in
// whatever case. cssText is the whole inline style at once, and writing it would take the service
// properties of the owner along; length and parentRule are read-only, and an assignment to one of them
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
// have been lost to it.
const isStyleProperty = (name: string): boolean => CSS.supports(name, 'initial');

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

const isAttributePresent = (value: unknown): boolean => Boolean(value) || value === '';

// The tokens of a class binding, in every shape one arrives in: a string of names, an array of any of these,
// and the map form, where a name counts as long as its value is truthy.
const classTokens = (value: unknown): string[] => {
	if (Type.isString(value))
	{
		return value.split(/\s+/).filter((token) => token.length > 0);
	}

	if (Type.isArray(value))
	{
		return (value as unknown[]).flatMap((item) => classTokens(item));
	}

	if (Type.isPlainObject(value))
	{
		return Object.entries(value as Record<string, unknown>)
			.filter(([, enabled]) => Boolean(enabled))
			.flatMap(([name]) => classTokens(name));
	}

	return [];
};

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

// What one pass leaves behind: the state the next pass measures against, and whether the node itself moved.
type Applied<TState> = {
	state: TState;
	changed: boolean;
};

// The keys are read in the lower case, the case setAttribute lands them in: ROLE and role name one and the
// same attribute, so they are one entry of the applied state and one answer of the protected list.
const applyAttributes = (
	node: HTMLElement,
	attrs: Record<string, unknown>,
	applied: string[],
	protectedNames: AttrsSyncPattern[],
): Applied<string[]> => {
	const values = new Map<string, unknown>();
	Object.keys(attrs)
		.filter((key) => !isStyleKey(key) && !isClassKey(key) && !isListenerKey(key, node))
		.forEach((key) => {
			const name = key.toLowerCase();
			if (!matchesPattern(name, protectedNames))
			{
				values.set(name, attrs[key]);
			}
		});

	let changed = false;

	// Names that were applied last time and are gone now: an attribute the consumer stopped binding must
	// leave the node with it.
	applied
		.filter((name) => !values.has(name))
		.forEach((name) => {
			changed = changed || node.hasAttribute(name);
			node.removeAttribute(name);
		});

	// The same fork Vue takes on an element it renders itself: null and undefined are the only values that
	// take an attribute off, a boolean attribute answers to the presence of its value instead, and everything
	// else is written out as the string of the value.
	values.forEach((value, name) => {
		const boolean = BOOLEAN_ATTRIBUTES.has(name);

		if (Type.isNil(value) || (boolean && !isAttributePresent(value)))
		{
			changed = changed || node.hasAttribute(name);
			node.removeAttribute(name);

			return;
		}

		// What the write will leave on the node, asked of the node before the write: an attribute keeps the
		// string it was given, so a value of its own and the attribute are comparable as they are. An
		// object-like value is another matter - Dom.attr encodes those on terms of its own - so one of them
		// is not compared at all and counts as a change.
		const written = boolean ? '' : String(value);
		changed = changed || Type.isObjectLike(value) || node.getAttribute(name) !== written;

		Dom.attr(node, name, boolean ? '' : value);
	});

	return { state: [...values.keys()], changed };
};

// Token by token and never as a whole class attribute: the node belongs to the owner, and its own classes
// (the block class of the extension, the modifiers, the state classes of a running cycle) are written there
// by nobody's binding. Hence the applied state - only a token this helper put on the node comes off again, so
// a class that stood there before the sync stays where it is even when a binding of the consumer happens to
// carry the same name. A token named by the protected list is passed by in both directions: it is never
// added, never tracked and never removed, so a collision with a service class of the owner cannot arise at
// all.
const applyClasses = (
	node: HTMLElement,
	attrs: Record<string, unknown>,
	applied: string[],
	protectedNames: AttrsSyncPattern[],
): Applied<string[]> => {
	const key = Object.keys(attrs).find((name) => isClassKey(name));
	const tokens = key === undefined
		? []
		: [...new Set(classTokens(attrs[key]))].filter((token) => !matchesPattern(token, protectedNames));

	let changed = false;

	applied
		.filter((token) => !tokens.includes(token))
		.forEach((token) => {
			changed = changed || Dom.hasClass(node, token);
			Dom.removeClass(node, token);
		});

	const state = tokens.filter((token) => {
		if (Dom.hasClass(node, token))
		{
			return applied.includes(token);
		}

		changed = true;
		Dom.addClass(node, token);

		return true;
	});

	return { state, changed };
};

// Written property by property and never as a whole style attribute: the owner keeps service properties of
// its own on this node, and a rewritten attribute would take them along. A property named by the protected
// list is left out of the sync in both directions - a declaration of the consumer under that name is not
// written, and the property is not taken off by the cleanup either. Without the first the two writes would
// race; without the second a property the consumer stopped binding would take the service one off the node
// with it.
//
// Answers whether a declaration moved. The comparison goes against the values applied last time and not
// against the node, because the node answers with the value as the CSS serialises it: url(x) comes back as
// url("x"), and a declaration equal to the one already there would read as changed for good.
const applyStyle = (
	node: HTMLElement,
	attrs: Record<string, unknown>,
	applied: Record<string, string>,
	protectedNames: AttrsSyncPattern[],
): Applied<Record<string, string>> => {
	// The style is taken by the name it came under, whatever its case; the first of them wins, should a
	// binding somehow carry two.
	const key = Object.keys(attrs).find((name) => isStyleKey(name));
	const declarations = styleDeclarations(key === undefined ? null : attrs[key]);

	const next: Record<string, string> = {};
	Object.entries(declarations).forEach(([name, declaration]) => {
		const property = stylePropertyName(name);
		if (isStyleProperty(property) && !matchesPattern(property, protectedNames))
		{
			next[property] = declaration;
		}
	});

	let changed = false;

	Object.keys(applied)
		.filter((property) => !Object.hasOwn(next, property))
		.forEach((property) => {
			changed = true;
			Dom.style(node, property, null);
		});

	Object.entries(next).forEach(([property, declaration]) => {
		if (applied[property] === declaration)
		{
			return;
		}

		changed = true;
		Dom.style(node, property, declaration);
	});

	return { state: next, changed };
};

// Only a function becomes a listener, a value of any other shape is dropped: the same fork Vue takes on an
// element it renders itself. Neither shape of such a key reaches setAttribute, whatever case it is written in
// - a string written there under a name the browser knows as a handler would run in the page, and one under a
// name it does not would sit on the node as the source text of a function of the consumer, saying nothing and
// read by nobody. A key carrying an array is read function by function by the same rule, so a string among
// them is dropped and the functions next to it are heard.
//
// No part of the answer of sync(): a subscription changes nothing a computed style could tell.
const applyListeners = (
	node: HTMLElement,
	attrs: Record<string, unknown>,
	applied: Record<string, AppliedListener>,
): Record<string, AppliedListener> => {
	const listeners: Record<string, AppliedListener> = {};
	Object.keys(attrs)
		.filter((name) => isListenerKey(name, node))
		.forEach((name) => {
			const handlers = readHandlers(attrs[name]);
			if (handlers.length === 0)
			{
				return;
			}

			const { event, options } = readListenerKey(name);
			if (!isBindableEvent(event))
			{
				return;
			}

			// A composition that has not changed keeps the very function that went on the node: the array
			// itself is built anew by every render of the parent, and a wrapper built anew with it would
			// resubscribe the key on every update - and, worse, leave the previous subscription behind, since
			// nothing but that function takes it off.
			const previous = applied[name];
			const listener = sameHandlers(previous?.handlers, handlers)
				? previous.listener
				: buildListener(handlers);

			listeners[name] = { event, handlers, listener, options };
		});

	// A listener leaves the node once its value has changed or its key is gone; the one that stayed the same
	// is left alone, so an update of the component does not resubscribe it. It comes off with the options it
	// went on with: a capturing listener answers to nothing else.
	Object.entries(applied)
		.filter(([key, listener]) => listeners[key]?.listener !== listener.listener)
		.forEach(([, listener]) => Event.unbind(node, listener.event, listener.listener, listener.options));

	Object.entries(listeners)
		.filter(([key, listener]) => applied[key]?.listener !== listener.listener)
		.forEach(([, listener]) => Event.bind(node, listener.event, listener.listener, listener.options));

	return listeners;
};

export const useAttrsSync = (options: AttrsSyncOptions): AttrsSync => {
	const protectedAttributes = options.protectedAttributes ?? [];
	const protectedClasses = options.protectedClasses ?? [];
	const protectedStyleProps = options.protectedStyleProps ?? [];

	let appliedAttributes: string[] = [];
	let appliedClasses: string[] = [];
	let appliedStyle: Record<string, string> = {};
	let appliedListeners: Record<string, AppliedListener> = {};

	// Answers whether anything a computed style can read has moved on the node: an attribute written, an
	// attribute taken off, a class token, a declaration of the style changed. Every pass runs before the
	// answer is put together, so none of them is short-circuited away.
	const sync = (attrs: Record<string, unknown>): boolean => {
		const node = options.getNode();
		if (!node)
		{
			return false;
		}

		const attributes = applyAttributes(node, attrs, appliedAttributes, protectedAttributes);
		const classes = applyClasses(node, attrs, appliedClasses, protectedClasses);
		const style = applyStyle(node, attrs, appliedStyle, protectedStyleProps);

		appliedListeners = applyListeners(node, attrs, appliedListeners);
		appliedAttributes = attributes.state;
		appliedClasses = classes.state;
		appliedStyle = style.state;

		return attributes.changed || classes.changed || style.changed;
	};

	return {
		sync,
		// Everything the helper put on the node comes off the way it went on: an empty set of attributes is
		// exactly the case of every key being gone at once, and nothing outside the applied state is named by
		// it. The protected names were never applied and are not touched here either.
		clear: (): void => {
			sync({});
		},
	};
};
