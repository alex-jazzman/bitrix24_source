import { Dom, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import { Callout, type CalloutOptions, type CalloutTarget } from 'ui.system.callout';
import { BUBBLE_ATTRIBUTE } from 'ui.system.popover';
import { useAttrsSync, type AttrsSync } from 'ui.system.popover.vue';

// The regions of the card a slot can take over, and the node of each of them. The markup belongs to the class
// throughout - the wrapper renders none of it and addresses the nodes it teleports into by the classes the
// card is built with.
type CalloutRegion = 'description' | 'leftSlot' | 'footer' | 'footerLeft';

const REGION_SELECTOR: Record<CalloutRegion, string> = {
	description: '.ui-system-callout__description',
	leftSlot: '.ui-system-callout__left',
	footer: '.ui-system-callout__footer',
	footerLeft: '.ui-system-callout__footer-left',
};

const REGIONS = Object.keys(REGION_SELECTOR) as CalloutRegion[];

// The subcontainer the class fills with the content of the props. Everything else standing in a region node is
// the slot of the consumer, which is how the two owners of one region are told apart.
const OWNED_CLASS = 'ui-system-callout__owned';

// What a mutation of a region has to say. A node came or went, or an attribute changed that decides whether an
// element counts as focusable content - and the effective mode of the card is computed from exactly that. The
// content of a slot renders straight into the region without an update of the wrapper, so this observer is the
// only way such a change is ever heard. style is on the list because v-show writes display: none into it, and
// a control taken out that way is no focusable content of the card; class is left off it on purpose - the
// transitions and the state bindings of Vue rewrite it frame by frame, and content hidden by a class of the
// consumer is read on the next commit or on refreshAccessibilityMode().
const REGION_MUTATIONS: MutationObserverInit = {
	childList: true,
	subtree: true,
	attributes: true,
	attributeFilter: [
		'href',
		'tabindex',
		'contenteditable',
		'controls',
		'disabled',
		'hidden',
		'inert',
		'type',
		'style',
	],
};

// The card is the bubble of the internal popover and belongs to the callout throughout: the accessibility model
// (the role, the name, the tabindex of a dialog), the id the aria-describedby of the anchor points at, the width
// the option writes, the service margin holding the arrow on the edge of the bubble and the classes of the
// extension are written by the class alone, and a binding of the consumer neither writes nor takes off any of
// them. contenteditable is protected for a reason of its own - it would make the root focusable and editable
// behind the back of the effective mode, which scans the regions of the consumer and nothing else.
const PROTECTED_ATTRIBUTES = ['id', 'role', 'tabindex', 'contenteditable', /^aria-/, BUBBLE_ATTRIBUTE];
const PROTECTED_STYLE_PROPS = [/^margin(-|$)/, 'width', 'max-width'];
const PROTECTED_CLASSES = [/^ui-system-callout/, /^--/];

// The state of the card as the wrapper holds it: every option that follows a prop, and the anchor. null and not
// undefined for that one - the anchor is dropped rather than reset, and null is the command to drop it.
type CalloutSnapshot = {
	title: CalloutOptions['title'];
	description: CalloutOptions['description'];
	leftSlot: CalloutOptions['leftSlot'];
	footer: CalloutOptions['footer'];
	footerLeft: CalloutOptions['footerLeft'];
	buttons: CalloutOptions['buttons'];
	showClose: CalloutOptions['showClose'];
	width: CalloutOptions['width'];
	positioning: CalloutOptions['positioning'];
	designContext: CalloutOptions['designContext'];
	closeByClickOutside: CalloutOptions['closeByClickOutside'];
	closeByEsc: CalloutOptions['closeByEsc'];
	ariaLabel: CalloutOptions['ariaLabel'];
	mode: CalloutOptions['mode'];
	target: CalloutTarget | null;
};

type BCalloutData = {
	callout: Callout | null;
	card: HTMLElement | null;
	regions: Record<CalloutRegion, HTMLElement | null>;
	attrsSync: AttrsSync | null;
	observer: MutationObserver | null;
	applied: CalloutSnapshot | null;
	// The regions the slots held when the state above was applied: a region changing owner moves no option and
	// is a change the class has to be told about all the same.
	appliedRegions: CalloutRegion[];
	// Whether a region was mutated since the last commit. Everything a mutation may decide - which element of a
	// slot counts as focusable content - is read off the DOM by the class, so such a commit carries no changed
	// option and is still no empty one.
	regionsMutated: boolean;
	commitScheduled: boolean;
	commitGeneration: number;
	// Whether the wrapper stands between its mount and its unmount. The public refresh answers to nothing
	// outside that span: before the mount the slots have not rendered yet and a commit would put the card up
	// ahead of them, and after it the class is destroyed.
	live: boolean;
};

// A copy of the value as it stood when it was applied. The plain objects and the arrays are copied through, so
// that a later change of one of them in place is a change against this copy and not against itself; everything
// else is kept as it came - an element, a factory of the consumer and a virtual anchor are the things they are,
// and a copy of one would be another thing entirely.
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
// read through, because `:positioning="{ ... }"` builds a new one on every render of the parent and an equal one
// is no change at all. Everything else answers to identity, an element and a function included.
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

// The keys that have moved and only them: applyOptions reads the presence of a key as the intention to change
// the option, so an untouched one is left out rather than handed over as it was.
const changedOptions = (next: CalloutSnapshot, applied: CalloutSnapshot): Partial<CalloutSnapshot> => {
	const partial: Partial<CalloutSnapshot> = {};

	(Object.keys(next) as Array<keyof CalloutSnapshot>).forEach(<Key extends keyof CalloutSnapshot>(key: Key) => {
		if (!isSameValue(next[key], applied[key]))
		{
			partial[key] = next[key];
		}
	});

	return partial;
};

// Both lists are built by a filter over REGIONS, so the order of the regions in them is the same one.
const sameRegions = (left: CalloutRegion[], right: CalloutRegion[]): boolean => {
	return left.length === right.length && left.every((region, index) => region === right[index]);
};

const readRegions = (card: HTMLElement | null): Record<CalloutRegion, HTMLElement | null> => {
	const regions = {} as Record<CalloutRegion, HTMLElement | null>;

	REGIONS.forEach((region) => {
		regions[region] = card === null ? null : card.querySelector<HTMLElement>(REGION_SELECTOR[region]);
	});

	return regions;
};

// Thin Vue wrapper over the imperative Callout: the props become the options of the card, the content slots are
// teleported into the regions of the card the class has built, and the events become emits. The instance is kept
// non-reactive (markRaw) because a Vue proxy breaks access to private #-fields.
//
// Declarative in the show as well: a mounted BCallout with a target is a shown card - an anchor of the consumer
// or `target="area"`, which puts the card against a region of the screen instead. There is no visible prop - the
// card is put up and taken down by the lifecycle of the component (`v-if` of the consumer), and a target dropped
// to null takes the shown card down until one comes back. Two options are read once, in the constructor, and
// never followed: container is the place of the mount, and autoFocus is a decision about the very first show.
export const BCallout = defineComponent({
	name: 'BCallout',
	// The card is the node the class creates and Vue renders none of it - so it never applies the fallthrough
	// attributes to it either. They are carried over by hand instead: `<BCallout class="my-hint">` paints the
	// card.
	inheritAttrs: false,
	// The one method of the wrapper the consumer has any business calling; everything else it holds is its own.
	expose: ['refreshAccessibilityMode'],
	props: {
		title: {
			type: String,
			default: undefined,
		},
		description: {
			type: [String, Object, Function] as PropType<CalloutOptions['description']>,
			default: undefined,
		},
		leftSlot: {
			type: [Object, Function] as PropType<CalloutOptions['leftSlot']>,
			default: undefined,
		},
		footer: {
			type: [Object, Function] as PropType<CalloutOptions['footer']>,
			default: undefined,
		},
		footerLeft: {
			type: [Object, Function] as PropType<CalloutOptions['footerLeft']>,
			default: undefined,
		},
		buttons: {
			type: Array as PropType<CalloutOptions['buttons']>,
			default: undefined,
		},
		// The default is written out although it is the absence of a value: a Boolean prop without one of its
		// own arrives as false, and the difference between "not given" and a false of the consumer is what the
		// mode default of the class hangs on.
		showClose: {
			type: Boolean,
			default: undefined,
		},
		width: {
			type: Number,
			default: undefined,
		},
		// An element, a point or a rect target, the string 'area' for a card standing against a region of the
		// screen, and null while the anchor of the consumer is not resolved yet - a template ref is null until
		// the parent has rendered, and the card waits for it instead of opening without one.
		target: {
			type: [Object, String] as PropType<CalloutTarget | null>,
			default: null,
		},
		positioning: {
			type: Object as PropType<CalloutOptions['positioning']>,
			default: undefined,
		},
		designContext: {
			type: String as PropType<CalloutOptions['designContext']>,
			default: undefined,
		},
		closeByClickOutside: {
			type: Boolean,
			default: undefined,
		},
		closeByEsc: {
			type: Boolean,
			default: undefined,
		},
		ariaLabel: {
			type: String,
			default: undefined,
		},
		mode: {
			type: String as PropType<CalloutOptions['mode']>,
			default: undefined,
		},
		container: {
			type: Object as PropType<HTMLElement | null>,
			default: null,
		},
		autoFocus: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['show', 'hide', 'close', 'destroy'],
	data(): BCalloutData
	{
		return {
			callout: null,
			card: null,
			regions: markRaw({ description: null, leftSlot: null, footer: null, footerLeft: null }),
			attrsSync: null,
			observer: null,
			applied: null,
			appliedRegions: [],
			regionsMutated: false,
			commitScheduled: false,
			commitGeneration: 0,
			live: false,
		};
	},
	computed: {
		// Every reactive prop in one value, each of them read through: reading a bound object of the consumer
		// field by field is what makes a change inside it - `buttons[0].loading`, a key of positioning - a change
		// of this value as well, and those never reach the wrapper any other way, since they render nothing.
		propsSnapshot(): CalloutSnapshot
		{
			return this.readProps();
		},
	},
	watch: {
		// One watcher over the whole snapshot and never one per prop: a transaction touching several of them is
		// one commit, and the commit is the single place any option reaches the class from. After the DOM, so
		// that a show started by a new anchor finds the slots of the same transaction already teleported.
		propsSnapshot: {
			flush: 'post',
			handler(): void
			{
				this.scheduleCommit();
			},
		},
	},
	created(): void
	{
		const initial = this.readProps();
		const callout = markRaw(new Callout({
			...initial,
			// The anchor is the one option the constructor is not given: the first commit hands it over, and
			// handing it over is what shows the card.
			target: undefined,
			container: this.container ?? undefined,
			autoFocus: this.autoFocus,
			events: {
				onShow: (event: BaseEvent): void => {
					this.$emit('show', event);
				},
				onHide: (event: BaseEvent): void => {
					this.$emit('hide', event);
				},
				onClose: (event: BaseEvent): void => {
					this.$emit('close', event);
				},
				onDestroy: (event: BaseEvent): void => {
					this.$emit('destroy', event);
				},
			},
		}));

		// The card is built before the mount: Teleport needs its targets to exist.
		const card = callout.getCard();

		this.callout = callout;
		this.card = card === null ? null : markRaw(card);
		this.regions = markRaw(readRegions(card));
		// What the constructor has just been given is the applied state, the anchor apart: every later value is
		// measured against it, and the first change is the first call of a method of the class.
		this.applied = markRaw({ ...initial, target: null });
		this.attrsSync = markRaw(useAttrsSync({
			getNode: () => this.card,
			protectedAttributes: PROTECTED_ATTRIBUTES,
			protectedStyleProps: PROTECTED_STYLE_PROPS,
			protectedClasses: PROTECTED_CLASSES,
		}));
		this.observer = markRaw(new MutationObserver(() => {
			this.regionsMutated = true;
			this.scheduleCommit();
		}));
	},
	mounted(): void
	{
		this.live = true;
		// The fallthrough of the tag reaches the card by hand, before it is shown: Vue renders none of that node.
		this.attrsSync?.sync(this.$attrs as Record<string, unknown>);
		// The initial commit: the regions the slots have taken over are given up by the props, the anchor is
		// handed over, and the card goes up with all of it already in place. The slots have rendered by now, so
		// the effective mode of the very first show is computed on the content that is actually there.
		this.runCommit();
	},
	updated(): void
	{
		// The card is out of the render tree, so an update of the component is the only moment the wrapper learns
		// that a bound class or style of the consumer has changed.
		const changed = this.attrsSync?.sync(this.$attrs as Record<string, unknown>) ?? false;

		// The look of the card is read by the positioning: the arrow takes the computed background of the card
		// and keeps its distance by the computed radius, so a new background reaches it through a recompute and
		// no other way. Only when the pass above wrote something - `:style="{ ... }"` hands over a new object on
		// every render of the parent while the declarations in it stay the same.
		if (changed)
		{
			this.callout?.adjustPosition();
		}

		// The render of a slot goes past every setter of the class: an update is the moment the ownership of a
		// region may have moved, and the commit is where that is decided.
		this.scheduleCommit();
	},
	beforeUnmount(): void
	{
		this.live = false;
		// A commit planned by this very update outlives the unmount (updated -> beforeUnmount -> unmounted -> the
		// callback), and the nodes it works on are gone by then: the generation turns it into a no-op.
		this.commitGeneration += 1;
		this.observer?.disconnect();
		this.observer = null;

		// While the teleported content is still alive: hiding is what returns the focus to the anchor, and the
		// tracker of the class reads the card as it stands.
		this.callout?.hide();
	},
	unmounted(): void
	{
		// What went onto the card by hand comes off the same way, the listeners among it.
		this.attrsSync?.clear();
		this.callout?.destroy();
	},
	methods: {
		// Brings the card in line with what actually stands in its regions right now. Call it after showing or
		// hiding the content of a slot by a class: the observer of the regions listens to the style attribute and
		// never to the class - the transitions and the state bindings of Vue rewrite that one frame by frame - so
		// a change made that way reaches the card through this call alone. Does nothing before the mount and
		// after the unmount.
		refreshAccessibilityMode(): void
		{
			if (!this.live)
			{
				return;
			}

			// Through the commit of the wrapper rather than straight to the class: the ownership of the regions is
			// settled there as well, and a commit carrying no changed option is made all the same once a region
			// counts as mutated.
			this.regionsMutated = true;
			this.runCommit();
		},
		// A copy of every prop as it stands now, ready to be measured against the applied state.
		readProps(): CalloutSnapshot
		{
			return snapshotValue({
				title: this.title,
				description: this.description,
				leftSlot: this.leftSlot,
				footer: this.footer,
				footerLeft: this.footerLeft,
				buttons: this.buttons,
				showClose: this.showClose,
				width: this.width,
				positioning: this.positioning,
				designContext: this.designContext,
				closeByClickOutside: this.closeByClickOutside,
				closeByEsc: this.closeByEsc,
				ariaLabel: this.ariaLabel,
				mode: this.mode,
				// Normalised on the border: a prop that stopped being bound is the command to drop the anchor,
				// and null is what that command is to the class.
				target: this.target ?? null,
			}) as CalloutSnapshot;
		},
		// The regions the slots hold right now. One region belongs to one owner at a time, and the slot is the
		// one that wins.
		slotRegions(): CalloutRegion[]
		{
			return REGIONS.filter((region) => this.hasSlotContent(region));
		},
		// The state the card is to be brought to: the props, with the content of a region a slot has taken over
		// given up - so a slot that appeared takes the prop content of its region away, and a slot that is gone
		// gives it back. Built on the snapshot the watcher was woken by: one deep copy of the props carries the
		// whole transaction.
		readOptions(slotted: CalloutRegion[]): CalloutSnapshot
		{
			const options = { ...this.propsSnapshot };

			slotted.forEach((region) => {
				options[region] = undefined;
			});

			return options;
		},
		// Whether the slot of a region has rendered anything. The node of the class is the one thing standing in a
		// region that is no slot. What a slot leaves behind when it renders nothing is no content: the anchors of
		// the teleport are text nodes without any characters, and the placeholder of a `v-if` is a comment, which
		// belongs to the compiler whatever it says - so elements and text are asked, and nothing else is.
		hasSlotContent(region: CalloutRegion): boolean
		{
			const node = this.regions[region];
			if (node === null)
			{
				return false;
			}

			return [...node.childNodes].some((child) => {
				if (Type.isElementNode(child))
				{
					return !Dom.hasClass(child, OWNED_CLASS);
				}

				return Type.isTextNode(child) && (child.textContent ?? '').trim() !== '';
			});
		},
		// The single entry point of the coordinator: the watcher of the props, an update of the component and a
		// mutation of a region all end here, and one flush cycle carries one commit whatever came in it. In the
		// next tick, after the patch of the teleport - so a slot rendered in this very transaction is part of
		// what the commit sees.
		scheduleCommit(): void
		{
			if (this.commitScheduled)
			{
				return;
			}

			this.commitScheduled = true;
			const generation = this.commitGeneration;

			void this.$nextTick(() => {
				this.commitScheduled = false;

				if (generation === this.commitGeneration)
				{
					this.runCommit();
				}
			});
		},
		// One pass over everything that may have moved: the changed options and the ownership of the regions
		// reach the class as a single applyOptions(), so a transaction costs exactly one recomputation of the
		// effective mode, one accessibility pass and one round of calls of the substrate - whatever it touched,
		// and with no intermediate state ever observable. A commit without a changed option is made all the
		// same when a region changed owner or was mutated: either asks for the mode to be computed anew, and
		// the commit is the one place that happens in.
		runCommit(): void
		{
			const callout = this.callout;
			const applied = this.applied;
			if (callout === null || applied === null)
			{
				return;
			}

			const mutated = this.regionsMutated;
			this.regionsMutated = false;

			const slotted = this.slotRegions();
			const options = this.readOptions(slotted);
			const partial = changedOptions(options, applied);
			// An anchor that has just appeared is what shows the card. One that has just gone takes the shown
			// card down, and that is the business of the class - it is the same call either way.
			const shows = Object.hasOwn(partial, 'target') && options.target !== null;

			this.applied = markRaw(options);

			// No option moved, no region changed hands and the DOM of the slots stood still: the class would
			// recompute its way to the state it is already in, and the observer would come off four nodes only
			// to be put back on the same four.
			if (!mutated && Object.keys(partial).length === 0 && sameRegions(slotted, this.appliedRegions))
			{
				return;
			}

			this.appliedRegions = slotted;

			// The anchor of the consumer reaches the class as it is, and never as the copy the snapshot is
			// measured against: a virtual one reads its own fields through `this`, and a point moved in place
			// has to stay the very object the card holds.
			if (Object.hasOwn(partial, 'target'))
			{
				partial.target = this.target ?? null;
			}

			// The observer hears the regions of the consumer alone: the DOM this very commit writes is none of
			// its business, and a commit planning itself anew would never come to an end.
			this.observer?.disconnect();

			try
			{
				callout.applyOptions(partial);

				if (shows)
				{
					callout.show();
				}
			}
			finally
			{
				this.observeRegions();
			}
		},
		observeRegions(): void
		{
			const observer = this.observer;
			if (observer === null)
			{
				return;
			}

			REGIONS.forEach((region) => {
				const node = this.regions[region];
				if (node !== null)
				{
					observer.observe(node, REGION_MUTATIONS);
				}
			});
		},
	},
	template: `
		<Teleport v-if="regions.description" :to="regions.description">
			<slot name="description"/>
		</Teleport>
		<Teleport v-if="regions.leftSlot" :to="regions.leftSlot">
			<slot name="leftSlot"/>
		</Teleport>
		<Teleport v-if="regions.footer" :to="regions.footer">
			<slot name="footer"/>
		</Teleport>
		<Teleport v-if="regions.footerLeft" :to="regions.footerLeft">
			<slot name="footerLeft"/>
		</Teleport>
	`,
});
