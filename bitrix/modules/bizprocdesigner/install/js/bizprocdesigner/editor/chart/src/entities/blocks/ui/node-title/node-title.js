import { Event } from 'main.core';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { BlockTopTitle } from '../block-top-title/block-top-title';
import './node-title.css';

type NodeTitleData = {
	editedTitle: string,
	focusRestored: boolean,
};

const TEST_ID = 'bizprocdesigner-node-title';
const INPUT_TEST_ID = 'bizprocdesigner-node-title-input';
// The press, not the click, ends the editing: the control under the cursor gets its click only
// after this one, so it acts on a title that is already saved and already put into the history.
// Any button ends it, so a right press that opens the node context menu saves the title too.
const OUTSIDE_COMMIT_EVENT = 'mousedown';

// While an IME composes, Enter accepts the suggested variant and Escape drops it: both keys
// belong to the composition, not to the editor, and the field still holds the value from before
// it. Engines older than isComposing report the same state as keyCode 229.
function isComposingKey(event: KeyboardEvent): boolean
{
	return event.isComposing === true || event.keyCode === 229;
}

// @vue/component
export const NodeTitle = {
	name: 'NodeTitle',
	components: {
		BInput,
		BlockTopTitle,
	},
	props: {
		// several frames share the canvas, so their test ids differ by the block
		blockId: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		editing: {
			type: Boolean,
			default: false,
		},
		// only the consumer knows what kind of node it names
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['editRequest', 'confirm', 'cancel'],
	setup(): Object
	{
		return {
			InputDesign,
			InputSize,
		};
	},
	data(): NodeTitleData
	{
		return {
			editedTitle: this.title,
			focusRestored: false,
		};
	},
	computed: {
		// the group gets no name from its content, and a phrase that failed to load reaches the prop
		// as an empty string, so the visible title is the only name left to give
		accessibleName(): string
		{
			return this.ariaLabel === '' ? this.title : this.ariaLabel;
		},
		testIdSuffix(): string
		{
			return this.blockId === '' ? '' : `-${this.blockId}`;
		},
		rootTestId(): string
		{
			return `${TEST_ID}${this.testIdSuffix}`;
		},
		inputTestId(): string
		{
			return `${INPUT_TEST_ID}${this.testIdSuffix}`;
		},
	},
	watch: {
		editing(editing: boolean): void
		{
			if (editing)
			{
				this.startEditing();
			}
			else
			{
				this.stopEditing();
			}
		},
	},
	mounted(): void
	{
		// the edit mode may come with the very first render, not only as a prop change
		if (this.editing)
		{
			this.startEditing();
		}
	},
	beforeUnmount(): void
	{
		this.unbindOutsideCommit();
	},
	methods: {
		startEditing(): void
		{
			this.editedTitle = this.title;
			this.bindOutsideCommit();

			this.$nextTick(() => {
				this.$refs.titleInput?.focus();
				// BInput does not expose select(), so full selection goes through its own input
				this.$refs.titleInput?.$el?.querySelector('input')?.select();
			});
		},
		stopEditing(): void
		{
			// the focused input is about to be removed: the focus has to move to the title itself
			const holdsFocus = this.$el.contains(document.activeElement);
			this.unbindOutsideCommit();

			if (holdsFocus)
			{
				// the focus is given back, not navigated to: no ring of the keyboard navigation for it
				this.focusRestored = document.activeElement !== this.$el;
				this.$nextTick(() => {
					this.$el?.focus({ preventScroll: true });
					if (document.activeElement !== this.$el)
					{
						// only a blur of the title drops the mark, and a focus that never landed brings none
						this.focusRestored = false;
					}
				});
			}
		},
		bindOutsideCommit(): void
		{
			// capture: the press is caught before the pressed control stops it or acts on it
			Event.bind(document, OUTSIDE_COMMIT_EVENT, this.onPressOutside, { capture: true });
		},
		unbindOutsideCommit(): void
		{
			Event.unbind(document, OUTSIDE_COMMIT_EVENT, this.onPressOutside, { capture: true });
		},
		requestEdit(): void
		{
			if (this.editing)
			{
				return;
			}

			this.$emit('editRequest');
		},
		onConfirm(): void
		{
			this.$emit('confirm', this.editedTitle.trim());
		},
		onCancel(): void
		{
			this.$emit('cancel');
		},
		// the default action stays with the composition, so it is dropped only for a key the
		// editor itself takes
		onEnterKey(event: KeyboardEvent): void
		{
			if (isComposingKey(event))
			{
				return;
			}

			event.preventDefault();
			this.onConfirm();
		},
		onEscapeKey(event: KeyboardEvent): void
		{
			if (isComposingKey(event))
			{
				return;
			}

			event.preventDefault();
			this.onCancel();
		},
		onBlur(): void
		{
			// the title is left: the next focus on it is navigation again and shows the ring
			this.focusRestored = false;
		},
		onPressOutside(event: MouseEvent): void
		{
			if (!this.$el.contains(event.target))
			{
				this.onConfirm();
			}
		},
	},
	template: `
		<div
			class="editor-chart-node-title"
			:class="{ '--editing': editing, '--focus-restored': focusRestored }"
			:data-testid="rootTestId"
			role="group"
			tabindex="0"
			aria-keyshortcuts="Enter"
			:aria-label="accessibleName"
			@dblclick.stop="requestEdit"
			@keydown.enter.self.prevent="requestEdit"
			@blur="onBlur"
		>
			<BInput
				v-if="editing"
				ref="titleInput"
				v-model="editedTitle"
				class="editor-chart-node-title__input"
				:design="InputDesign.Naked"
				:size="InputSize.Sm"
				:ariaLabel="accessibleName"
				:data-testid="inputTestId"
				stretched
				@keydown.enter="onEnterKey"
				@keydown.esc="onEscapeKey"
			/>
			<BlockTopTitle
				v-else
				class="editor-chart-node-title__text"
				:title="title"
				:description="description"
			/>
		</div>
	`,
};
