import { Dom } from 'main.core';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import { DEFAULT_SIZE, Hint, type HintOptions, type HintSize, type HintTooltipOptions } from 'ui.system.hint';

// Types only: the runtime dictionaries are already global on BX.UI.System.Hint through the rel, and
// re-exporting them into the shared namespace would risk name shadowing (CF1015).
export type * from 'ui.system.hint';

// The bubble of the hint as the component takes it: everything the class reads but the content, which is no
// prop and never will be - what the bubble shows is the node of the slot. The option that makes a string
// content markup goes with it: a node is a node whatever the flag says.
export type BHintTooltipOptions = Omit<HintTooltipOptions, 'content' | 'html'>;

// The fields of the bubble as the change of the options is measured on them. Written out by hand rather than
// read off the value handed over, because a field the consumer stopped binding is a change as well, and a
// value carries nothing of the keys it lost.
const BUBBLE_OPTIONS: readonly (keyof BHintTooltipOptions)[] = Object.freeze([
	'maxWidth',
	'position',
	'trigger',
	'showDelay',
	'hideDelay',
]);

type BHintData = {
	contentNode: HTMLElement | null;
	hint: Hint | null;
	appliedOptions: Record<string, unknown>;
};

// Two flat records of the same keys told apart field by field: everything the options are made of is a
// primitive, so identity is the whole of the answer.
const isSameOptions = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
	const names = Object.keys(left);

	return names.length === Object.keys(right).length
		&& names.every((name) => Object.is(left[name], right[name]));
};

// Thin Vue wrapper over the imperative Hint. The button belongs to the class - the glyph, the modifiers, the
// accessible name and the whole bridge to ui.system.tooltip come from there - and the component answers for
// what Vue answers for: a host the button lives in, the node of the slot the bubble shows, and the props of
// the surface.
//
// The instance is kept non-reactive (markRaw) because a Vue proxy breaks access to private #-fields. The
// content node is created in created() and belongs to the component: Teleport needs an existing target, and
// the node outlives every instance the options build - which is what makes a change of the options a hint
// built anew and no work of the slot at all.
export const BHint = defineComponent({
	name: 'BHint',
	props: {
		size: {
			type: String as PropType<HintSize>,
			default: DEFAULT_SIZE,
		},
		filled: {
			type: Boolean,
			default: false,
		},
		// The mode of the hint: null - the button carries a callback and answers a click with the click event;
		// an object - it carries a bubble, and the content of that bubble is the slot.
		tooltipOptions: {
			type: Object as PropType<BHintTooltipOptions | null>,
			default: null,
		},
		// An empty string is no name at all: the class falls back to the phrase of the extension, exactly as it
		// does for an option nobody gave.
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['click', 'show', 'hide'],
	data(): BHintData
	{
		return {
			contentNode: null,
			hint: null,
			appliedOptions: markRaw({}),
		};
	},
	computed: {
		// The whole contract in one flat record, and the state a change is measured against. The content is no
		// part of it: the slot renders into a node that stands whatever the options do.
		liveOptions(): Record<string, unknown>
		{
			const bubble = this.tooltipOptions;
			const options: Record<string, unknown> = {
				size: this.size,
				filled: this.filled,
				ariaLabel: this.ariaLabel,
				// The mode itself: no field of the bubble tells a hint without one from a hint with an empty one.
				bubble: bubble !== null,
			};

			BUBBLE_OPTIONS.forEach((name) => {
				options[name] = bubble?.[name];
			});

			return options;
		},
	},
	watch: {
		// A render of the parent hands over a new object for `:tooltip-options="{ ... }"` every time, so being
		// called is no change by itself: syncHint() measures the value against the applied state.
		liveOptions(): void
		{
			this.syncHint();
		},
	},
	created(): void
	{
		// Teleport needs an existing target from the first render on.
		this.contentNode = markRaw(document.createElement('div'));
	},
	mounted(): void
	{
		// The host is in place and Teleport has already rendered the slot into the content node, so the bubble
		// of the very first show carries it.
		this.createHint();
	},
	unmounted(): void
	{
		this.destroyHint();
	},
	methods: {
		createHint(): void
		{
			const host = this.$refs.host as HTMLElement | undefined;
			const contentNode = this.contentNode;
			if (this.hint !== null || !host || contentNode === null)
			{
				return;
			}

			const bubble = this.tooltipOptions;
			const options: HintOptions = {
				size: this.size,
				filled: this.filled,
				ariaLabel: this.ariaLabel,
				tooltipOptions: bubble === null ? null : { ...bubble, content: contentNode },
				// Given in the action mode alone: a hint with a bubble answers a click with that bubble, and the
				// class speaks up about a callback handed over next to one. Left out rather than emptied - the
				// option is one the contract allows to be absent, and absent is exactly what it means here.
				onClick: bubble === null ? this.handleClick : undefined,
				events: {
					onShow: this.handleShow,
					onHide: this.handleHide,
				},
			};

			this.hint = markRaw(new Hint(options));

			// What the constructor has just been given is the applied state: every later value is measured
			// against it, and the first real change is the first rebuild.
			this.appliedOptions = markRaw({ ...this.liveOptions });

			Dom.append(this.hint.render(), host);
		},
		destroyHint(): void
		{
			const hint = this.hint;

			this.hint = null;
			this.appliedOptions = markRaw({});

			hint?.destroy();
		},
		// The options reach the class at its constructor and nowhere else, so a change of them is a hint built
		// anew. What that costs is the button node, and the two things hanging off it are carried over by hand:
		// the slot renders into the same content node either way, and the keyboard focus follows the button.
		syncHint(): void
		{
			if (this.hint === null || isSameOptions(this.liveOptions, this.appliedOptions))
			{
				return;
			}

			const focused = document.activeElement === this.hint.getContainer();

			this.destroyHint();
			this.createHint();

			if (focused)
			{
				this.hint?.getContainer().focus();
			}
		},
		handleClick(): void
		{
			this.$emit('click');
		},
		handleShow(): void
		{
			this.$emit('show');
		},
		handleHide(): void
		{
			this.$emit('hide');
		},
	},
	// The button of the class goes inside the host, and the slot renders into the content node the bubble is
	// given. The guard is what Teleport needs: a target that exists.
	template: `
		<span ref="host">
			<Teleport v-if="contentNode" :to="contentNode">
				<slot/>
			</Teleport>
		</span>
	`,
});
