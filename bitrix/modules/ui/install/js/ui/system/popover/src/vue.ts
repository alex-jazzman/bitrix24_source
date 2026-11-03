import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import {
	BUBBLE_ATTRIBUTE,
	Popover,
	type PopoverClassName,
	type PopoverDesignContext,
	type PopoverOptions,
	type PopoverPositioning,
	type PopoverTarget,
} from 'ui.system.popover';

import { useAttrsSync, type AttrsSync } from './vue-attrs';

// Types only: the runtime dictionaries are already global on BX.UI.System.Popover through the rel, and
// re-exporting them into the shared namespace would risk name shadowing (CF1015).
export type * from 'ui.system.popover';

// The fallthrough sync is the shared part of every Vue wrapper over a class that owns its own DOM, so it is
// published from here rather than kept private: the wrapper of another extension of the family carries the
// same attributes onto its own node, and a second copy of that code would be a second copy of its security
// rules.
export { useAttrsSync } from './vue-attrs';
export type { AttrsSync, AttrsSyncOptions, AttrsSyncPattern } from './vue-attrs';

type BPopoverData = {
	contentNode: HTMLElement | null;
	popover: Popover | null;
	appliedOptions: Record<string, unknown>;
	attrsSync: AttrsSync | null;
};

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
			attrsSync: null,
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

		// The bubble is the node of the consumer and the popover keeps two things of its own on it: the
		// attribute the layout defaults of popover.css are addressed to, and the margin that holds the arrow
		// on the edge of the bubble - the root is sized by its content, so a margin of the consumer would
		// enter the size of the root and take the arrow away from the bubble by exactly that much. Both are
		// protected in either direction: a binding of that name is not written, and a name the consumer
		// stopped binding does not take the service value off the node with it. The outer gap has an address
		// of its own, the offset option of the positioning. The shorthand and every longhand of the margin:
		// margin-top alone detaches the arrow just as well. No protected class - the extension puts its
		// classes on the service root, and the bubble stays free of them.
		const attrsSync = useAttrsSync({
			getNode: () => this.contentNode,
			protectedAttributes: [BUBBLE_ATTRIBUTE],
			protectedStyleProps: [/^margin(-|$)/],
			protectedClasses: [],
		});

		this.contentNode = markRaw(contentNode);
		this.popover = popover;
		this.attrsSync = markRaw(attrsSync);
		// What the constructor has just been given is the applied state of the options: the watcher measures
		// every later value against it, and the first change is the first call of a method of the class.
		this.appliedOptions = markRaw(readOptions(this.options as Record<string, unknown>));
		attrsSync.sync(this.$attrs as Record<string, unknown>);
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
		const changed = this.attrsSync?.sync(this.$attrs as Record<string, unknown>) ?? false;

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
		// The fallthrough came onto the bubble by hand and comes off the same way, the listeners among it:
		// Vue never rendered that node and takes nothing off it.
		this.attrsSync?.clear();

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
	},
	template: `
		<Teleport v-if="contentNode" :to="contentNode">
			<slot/>
		</Teleport>
	`,
});
