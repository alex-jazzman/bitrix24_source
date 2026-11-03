import { defineComponent, markRaw, type Directive, type PropType } from 'ui.vue3';
import { Dom, Type } from 'main.core';

import { DEFAULT_MAX_WIDTH, Tooltip, TooltipPosition, TooltipTrigger } from 'ui.system.tooltip';

// Types only: the runtime dictionaries are already global on BX.UI.System.Tooltip through the rel, and
// re-exporting them into the shared namespace would risk name shadowing (CF1015).
export type * from 'ui.system.tooltip';

const WARNING_NAMESPACE = 'BX.UI.System.Tooltip.Vue';

// Everything of the contract that reaches the live instance through setOptions(). The content is no part of
// it and never will be: the component always hands the class its content node, and a text handed over in its
// stead would switch the class to an output of its own and empty that very node.
type LiveOptions = {
	maxWidth: number;
	position: TooltipPosition;
	offset: number;
	crossOffset: number;
	trigger: TooltipTrigger | TooltipTrigger[];
	showDelay: number;
	hideDelay: number;
};

// The value of the directive in either shape it takes: the fields of the tooltip options without the target,
// which is always the element the directive hangs on. The content of a directive is a string, so the option
// that makes a string markup belongs here and to no prop of the component: what the component shows is the
// node of its slot.
export type BTooltipDirectiveOptions = LiveOptions & { content: string | HTMLElement; html: boolean };
export type BTooltipDirectiveValue = string | Partial<BTooltipDirectiveOptions>;

// The defaults of the tooltip options, written out here because the props are the contract of the surface: a
// binding the consumer drops has to return the option to its default, and only a value actually handed over
// does that. The ceiling of the width comes from the extension itself - the class tells the option from its
// default by that very number, and two numbers of the same meaning would drift apart.
const DEFAULT_POSITION: TooltipPosition = TooltipPosition.Top;
const DEFAULT_OFFSET: number = 4;
const DEFAULT_TRIGGER: TooltipTrigger[] = [TooltipTrigger.Hover, TooltipTrigger.Focus];

const buildDefaultOptions = (): BTooltipDirectiveOptions => ({
	content: '',
	html: false,
	maxWidth: DEFAULT_MAX_WIDTH,
	position: DEFAULT_POSITION,
	offset: DEFAULT_OFFSET,
	crossOffset: 0,
	trigger: [...DEFAULT_TRIGGER],
	showDelay: 0,
	hideDelay: 0,
});

type BTooltipData = {
	contentNode: HTMLElement | null;
	tooltip: Tooltip | null;
	appliedOptions: Record<string, unknown>;
	appliedAttributes: string[];
	warnedAttributes: string[];
};

// A copy of the value as it stood when it was applied: an array of the consumer changed in place afterwards
// is then a change against this copy and not against itself.
const snapshotValue = (value: unknown): unknown => (Type.isArray(value) ? [...(value as unknown[])] : value);

// Two values told apart the way a binding of the consumer changes them: an array is read through, because
// `:trigger="[...]"` builds a new one on every render of the parent and an equal one is no change at all.
// Everything else answers to identity - an element is the element it is.
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
			&& leftItems.every((item, index) => Object.is(item, rightItems[index]));
	}

	return false;
};

const snapshotOptions = (options: Record<string, unknown>): Record<string, unknown> => {
	return Object.fromEntries(Object.entries(options).map(([name, value]) => [name, snapshotValue(value)]));
};

// The instance as the synchronisation of the options needs it. Named by the method rather than by the class,
// because the tooltip is kept in the data of the component and what comes back out of there is the shape of
// the instance and not the instance type - the private fields of a class are no part of a shape.
type TooltipSetters = Pick<Tooltip, 'setOptions'>;

// The changed fields carried to the live instance in a single call, and the applied state the next change is
// measured against. Nothing is called when nothing changed: a render of the parent hands over a new array for
// `:trigger="[...]"` every time, and setOptions() with an equal one costs the subscriptions of the triggers.
const applyOptions = (
	tooltip: TooltipSetters,
	applied: Record<string, unknown>,
	options: Record<string, unknown>,
): Record<string, unknown> => {
	const snapshot = snapshotOptions(options);
	const changed = Object.fromEntries(
		Object.entries(snapshot).filter(([name, value]) => !isSameValue(value, applied[name])),
	);

	if (Object.keys(changed).length > 0)
	{
		tooltip.setOptions(changed);
	}

	return snapshot;
};

// The two names a look would arrive under, and neither of them reaches the bubble: the look of the tooltip
// belongs to the extension. Read in the lower case, because that is the case a write would land in -
// setAttribute lowercases the name it is given.
const LOOK_ATTRIBUTES: Set<string> = new Set(['class', 'style']);

const isLookKey = (name: string): boolean => LOOK_ATTRIBUTES.has(name.toLowerCase());

// Both shapes of a listener key Vue reads, and anything the browser would take as an inline handler on top:
// none of them may reach setAttribute, where a string of the consumer would run in the page. The bubble
// carries no listeners of the consumer at all - what they render into the slot is where their handlers go.
const isListenerKey = (name: string): boolean => {
	const lowercased = name.toLowerCase();

	return /^on[:A-Z]/.test(name) || (lowercased.startsWith('on') && lowercased in HTMLElement.prototype);
};

// Names the class keeps on the bubble and no fallthrough value may take. The identifier is the one the element
// points at through aria-describedby, and it is written on show - before this pass runs, so a value of the
// consumer would leave that reference hanging. The role is what the bubble is announced as, and the absence of
// a tabindex is what keeps it out of the tab order.
const RESERVED_ATTRIBUTES: Set<string> = new Set(['id', 'role', 'tabindex']);

const isReservedKey = (name: string): boolean => RESERVED_ATTRIBUTES.has(name.toLowerCase());

// A name setAttribute takes. The DOM measures it against the XML name production and answers everything else
// with an InvalidCharacterError, and a fallthrough name arrives here unchecked: v-bind spreads whatever object
// the place of use hands it, keys and all. A name that never reaches the node is far better than a throw in
// the middle of the pass, which would leave the bubble half written and the rest of the update undone.
//
// Narrower than the production on purpose: a name outside ASCII is one nobody writes, and the answer has to
// come from a pattern rather than from a probe element built on every update of every tooltip.
const WRITABLE_NAME = /^[:A-Z_a-z][\w.:-]*$/;

const isWritableName = (name: string): boolean => WRITABLE_NAME.test(name);

const quotedNames = (names: string[]): string => names.map((name) => `"${name}"`).join(', ');

// Thin Vue wrapper over the imperative Tooltip. The content node is created in created() and belongs to the
// component: Teleport needs an existing target, and the node lives on whether an instance exists or not. The
// instance is another matter - it is built only for a target that is there, and it is kept non-reactive
// (markRaw) because a Vue proxy breaks access to private #-fields.
//
// Two nodes not to be confused: the bubble is built by the class and carries the block class of the
// extension; the content node is created here, lies inside the bubble and is where Vue renders. The component
// works through the content option and never hands the text over to the class - see LiveOptions.
export const BTooltip = defineComponent({
	name: 'BTooltip',
	// The bubble is no part of what Vue renders, so it never gets the fallthrough attributes either. They are
	// carried over by hand instead: `<BTooltip data-testid="tip">` marks the visible block of the tooltip,
	// which is the node an autotest of the place of use looks for.
	inheritAttrs: false,
	props: {
		target: {
			type: Object as PropType<Element | null>,
			default: null,
		},
		text: {
			type: String,
			default: '',
		},
		maxWidth: {
			type: Number,
			default: DEFAULT_MAX_WIDTH,
		},
		position: {
			type: String as PropType<TooltipPosition>,
			default: DEFAULT_POSITION,
		},
		offset: {
			type: Number,
			default: DEFAULT_OFFSET,
		},
		crossOffset: {
			type: Number,
			default: 0,
		},
		trigger: {
			type: [String, Array] as PropType<TooltipTrigger | TooltipTrigger[]>,
			default: (): TooltipTrigger[] => [...DEFAULT_TRIGGER],
		},
		showDelay: {
			type: Number,
			default: 0,
		},
		hideDelay: {
			type: Number,
			default: 0,
		},
	},
	emits: ['show', 'hide', 'destroy'],
	data(): BTooltipData
	{
		return {
			contentNode: null,
			tooltip: null,
			appliedOptions: markRaw({}),
			appliedAttributes: [],
			warnedAttributes: [],
		};
	},
	computed: {
		liveOptions(): LiveOptions
		{
			return {
				maxWidth: this.maxWidth,
				position: this.position,
				offset: this.offset,
				crossOffset: this.crossOffset,
				trigger: this.trigger,
				showDelay: this.showDelay,
				hideDelay: this.hideDelay,
			};
		},
	},
	watch: {
		// Read deep, because the two ways a binding changes look different from here: `:trigger="[...]"` hands
		// over a new array on every render of the parent, while a bound array of theirs changes in place and is
		// never handed over anew. Which of the two is a change of the tooltip is decided in syncOptions().
		liveOptions: {
			deep: true,
			handler(): void
			{
				this.syncOptions();
			},
		},
		target(value: Element | null): void
		{
			this.syncTarget(value);
		},
	},
	created(): void
	{
		// Teleport needs an existing target from the first render on.
		this.contentNode = markRaw(document.createElement('div'));
	},
	mounted(): void
	{
		// Teleport has already rendered into the content node, so a tooltip built here shows the content of the
		// slot from its very first show.
		this.ensureTooltip();
	},
	updated(): void
	{
		// The bubble is out of the render tree, so an update of the component is the only moment the wrapper
		// learns that a bound attribute of the consumer has changed.
		//
		// And an attribute is something a rule of the page may stand on: the pointer takes the computed
		// background of the bubble and keeps its distance from the corners by the computed radius, so a rule
		// that has just begun to match reaches the pointer through a recompute and no other way - the size did
		// not change, and the observer that watches it stays silent. Only when the pass actually wrote
		// something, though: the text and the slot render inside the bubble, and the observers of the cycle
		// answer for those themselves.
		if (this.syncBubble())
		{
			this.tooltip?.adjustPosition();
		}
	},
	unmounted(): void
	{
		this.destroyTooltip();
	},
	methods: {
		// Built once for a target that is there, and never again for the same one: a render of the parent must
		// not cost the tooltip its instance.
		ensureTooltip(): void
		{
			const target = this.target;
			const contentNode = this.contentNode;
			if (this.tooltip !== null || target === null || contentNode === null)
			{
				return;
			}

			this.tooltip = markRaw(new Tooltip({
				...this.liveOptions,
				target,
				content: contentNode,
				events: {
					onShow: this.handleShow,
					onHide: this.handleHide,
					onDestroy: this.handleDestroy,
				},
			}));

			// What the constructor has just been given is the applied state: the watcher measures every later
			// value against it, and the first change is the first call of setOptions().
			this.appliedOptions = markRaw(snapshotOptions(this.liveOptions as unknown as Record<string, unknown>));

			// The class shows the tooltip from inside its constructor over an element already under the cursor
			// or holding the keyboard focus, and the bubble of that show is built before the instance lands in
			// the field above: the pass of handleShow() found nothing to write on and left the bubble bare.
			// Hence the pass here - without it the first show stands without the fallthrough values, and the
			// bubble of a tooltip shown right at the mount is the one an autotest of the place of use looks for.
			//
			// No recompute is asked for, for the reason handleShow() gives: this runs in the same task as the
			// show inside the constructor, and the cycle of the positioning reads the bubble no earlier than the
			// microtask after it.
			this.syncBubble();
		},
		// The applied state of the bubble goes with the instance: the next one builds a bubble of its own, and
		// nothing of what was written on the old one is there to be found.
		destroyTooltip(): void
		{
			const tooltip = this.tooltip;

			this.tooltip = null;
			this.appliedOptions = markRaw({});
			this.appliedAttributes = [];
			this.warnedAttributes = [];

			tooltip?.destroy();
		},
		syncOptions(): void
		{
			const tooltip = this.tooltip;
			if (tooltip === null)
			{
				return;
			}

			this.appliedOptions = markRaw(applyOptions(
				tooltip,
				this.appliedOptions,
				this.liveOptions as unknown as Record<string, unknown>,
			));
		},
		// The target is the owner of the tooltip and not merely an option of it: the class has no life without
		// one, so the instance follows the value in and out of existence. Between two elements it is an option
		// like another - the tooltip moves over and keeps everything it had.
		syncTarget(value: Element | null): void
		{
			if (value === null)
			{
				this.destroyTooltip();

				return;
			}

			if (this.tooltip === null)
			{
				this.ensureTooltip();

				return;
			}

			this.tooltip.setOptions({ target: value });
		},
		// Answers whether anything the positioning can read has moved on the bubble. Nothing is written before
		// the first show: the bubble is built there, and until then there is no node to carry anything over to.
		syncBubble(): boolean
		{
			const bubble = this.tooltip?.getBubble() ?? null;
			if (!bubble)
			{
				return false;
			}

			return this.syncAttributes(bubble, this.$attrs as Record<string, unknown>);
		},
		// The fallthrough set as the bubble takes it: null and undefined take an attribute off, every other
		// value is written out as the string of it - an ARIA state is a string, and aria-expanded="false" is a
		// state of its own. A key of a listener is dropped rather than written: see isListenerKey. The class
		// and the style, the names the class keeps for itself and the ones the DOM would refuse are dropped as
		// well, and the place of use is told of each: see LOOK_ATTRIBUTES, RESERVED_ATTRIBUTES and
		// isWritableName.
		//
		// Every name left is one the write cannot fail on, and that is what lets the applied state be written
		// down before the loop: it claims exactly what the loop puts on the node.
		syncAttributes(bubble: HTMLElement, attributes: Record<string, unknown>): boolean
		{
			const carried = Object.keys(attributes).filter((name) => !isListenerKey(name));
			const names = carried.filter((name) => {
				return !isLookKey(name) && !isReservedKey(name) && isWritableName(name);
			});
			let changed = false;

			this.warnLook(carried.filter((name) => isLookKey(name)));
			this.warnReserved(carried.filter((name) => isReservedKey(name)));
			this.warnUnwritable(carried.filter((name) => !isReservedKey(name) && !isWritableName(name)));

			// Names that were applied last time and are gone now: an attribute the consumer stopped binding must
			// leave the node with it.
			this.appliedAttributes
				.filter((name) => !names.includes(name))
				.forEach((name) => {
					changed = changed || bubble.hasAttribute(name);
					bubble.removeAttribute(name);
				});
			this.appliedAttributes = names;

			names.forEach((name) => {
				const value = attributes[name];
				if (Type.isNil(value))
				{
					changed = changed || bubble.hasAttribute(name);
					bubble.removeAttribute(name);

					return;
				}

				const written = String(value);
				changed = changed || bubble.getAttribute(name) !== written;
				Dom.attr(bubble, name, written);
			});

			return changed;
		},
		// Dropped in silence, a value of the place of use would read as applied and be nowhere.
		warnLook(names: string[]): void
		{
			const unseen = this.takeUnwarned(names);
			if (unseen.length === 0)
			{
				return;
			}

			console.warn(
				`${WARNING_NAMESPACE}: ${quotedNames(unseen)} of <BTooltip> does not reach the bubble - the look `
				+ 'of the tooltip belongs to the extension.',
			);
		},
		warnReserved(names: string[]): void
		{
			const unseen = this.takeUnwarned(names);
			if (unseen.length === 0)
			{
				return;
			}

			console.warn(
				`${WARNING_NAMESPACE}: ${quotedNames(unseen)} of <BTooltip> does not reach the bubble - the `
				+ 'identifier it is announced by, its role and its place outside the tab order belong to the '
				+ 'tooltip.',
			);
		},
		warnUnwritable(names: string[]): void
		{
			const unseen = this.takeUnwarned(names);
			if (unseen.length === 0)
			{
				return;
			}

			console.warn(
				`${WARNING_NAMESPACE}: ${quotedNames(unseen)} of <BTooltip> is no attribute name the DOM takes `
				+ 'and does not reach the bubble - a name begins with a letter and carries no spaces.',
			);
		},
		// The names of the given ones that have not been spoken of yet, and they count as spoken of from here
		// on: the pass runs on every update of the component, and a binding that stands still would otherwise
		// fill the console.
		takeUnwarned(names: string[]): string[]
		{
			const unseen = names.filter((name) => !this.warnedAttributes.includes(name));
			this.warnedAttributes = [...this.warnedAttributes, ...unseen];

			return unseen;
		},
		// The bubble exists from the first show on, and the fallthrough values reach it here. No recompute is
		// asked for: the cycle of the positioning has just been launched and reads the bubble as this pass
		// leaves it.
		handleShow(): void
		{
			this.syncBubble();
			this.$emit('show');
		},
		handleHide(): void
		{
			this.$emit('hide');
		},
		handleDestroy(): void
		{
			this.$emit('destroy');
		},
	},
	// The slot is older than the text prop: a filled slot is the whole content of the tooltip, and the text is
	// what stands there when the place of use gave none. The fallback carries a node of its own, marked as the
	// text of the bubble: the wrapper always renders into a node, and a node inside the bubble reads as markup
	// unless it says otherwise - a "\n" of the text prop is a break of the place of use, exactly as it is on
	// the class and on the directive. See tooltip.css.
	template: `
		<Teleport v-if="contentNode" :to="contentNode">
			<slot><span class="ui-system-tooltip__text">{{ text }}</span></slot>
		</Teleport>
	`,
});

type DirectiveState = {
	tooltip: Tooltip;
	applied: Record<string, unknown>;
};

const directiveInstances: WeakMap<HTMLElement, DirectiveState> = new WeakMap();

// The value in either shape it takes, filled up to the whole contract: a field the value stopped carrying
// returns to its default, which is what a field taken out of a binding means. The target is never read from
// there - it is always the element the directive hangs on.
const readDirectiveValue = (value: BTooltipDirectiveValue | null | undefined): BTooltipDirectiveOptions => {
	const options = buildDefaultOptions();

	if (Type.isString(value))
	{
		return { ...options, content: value as string };
	}

	if (!Type.isPlainObject(value))
	{
		return options;
	}

	const given = value as Partial<BTooltipDirectiveOptions>;
	Object.keys(options).forEach((name) => {
		const field = given[name as keyof BTooltipDirectiveOptions];
		if (!Type.isUndefined(field))
		{
			options[name as keyof BTooltipDirectiveOptions] = field as never;
		}
	});

	return options;
};

const destroyDirectiveTooltip = (element: HTMLElement): void => {
	const state = directiveInstances.get(element);
	if (state === undefined)
	{
		return;
	}

	directiveInstances.delete(element);
	state.tooltip.destroy();
};

// An empty content is the shape of "no tooltip here": an empty string and an empty object both arrive as
// one, and the class has nothing to show without a content.
const createDirectiveTooltip = (element: HTMLElement, options: BTooltipDirectiveOptions): void => {
	if (options.content === '')
	{
		return;
	}

	directiveInstances.set(element, {
		tooltip: new Tooltip({ ...options, target: element }),
		applied: snapshotOptions(options as unknown as Record<string, unknown>),
	});
};

// A tooltip on the element the directive hangs on, and the value is its whole contract. Registered by the
// consumer as b-tooltip: `v-b-tooltip="'Text'"` or `v-b-tooltip="{ content, position, ... }"`.
export const vBTooltip: Directive<HTMLElement, BTooltipDirectiveValue> = {
	mounted(element: HTMLElement, { value }): void
	{
		createDirectiveTooltip(element, readDirectiveValue(value));
	},
	// Called on every render of the parent, so a value equal to the applied one has to cost nothing: the
	// changed fields alone reach the live instance, and an emptied value takes the tooltip away.
	updated(element: HTMLElement, { value }): void
	{
		const options = readDirectiveValue(value);
		const state = directiveInstances.get(element);

		if (options.content === '')
		{
			destroyDirectiveTooltip(element);

			return;
		}

		if (state === undefined)
		{
			createDirectiveTooltip(element, options);

			return;
		}

		state.applied = applyOptions(
			state.tooltip,
			state.applied,
			options as unknown as Record<string, unknown>,
		);
	},
	unmounted(element: HTMLElement): void
	{
		destroyDirectiveTooltip(element);
	},
};
