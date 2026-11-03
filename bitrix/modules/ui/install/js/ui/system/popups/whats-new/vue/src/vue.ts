import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import {
	WhatsNew,
	WhatsNewActionsAlign,
	WhatsNewBackdrop,
	WhatsNewColor,
	WhatsNewGalleryNav,
	WhatsNewMediaPosition,
	WhatsNewSize,
	type WhatsNewGallerySlide,
	type WhatsNewItem,
	type WhatsNewOptions,
	type WhatsNewScene,
	type WhatsNewVideo,
} from 'ui.system.popups.whats-new';

// A ready button of the consumer, as the class takes it. Read off the options instead of being imported from
// ui.buttons: the type is all that is needed here, and the extension is already a dependency of the class.
type WhatsNewAction = NonNullable<WhatsNewOptions['actions']>[number];

// The slides of the gallery arrive as slots named after the place of the slide in the ring.
const SLIDE_SLOT = /^slide-(\d+)$/;

const isOneOf = (dictionary: Readonly<Record<string, string>>, value: string): boolean => {
	return Object.values(dictionary).includes(value);
};

/**
 * Thin Vue wrapper over the imperative WhatsNew. It draws no markup of the window: the class owns the whole
 * of it, and the only nodes of the wrapper are the containers the slots render into through Teleport.
 *
 * The instance is built in created() and kept outside the reactive state - a Vue proxy breaks access to the
 * private #-fields of the class. Of the props only those the class has a setter for reach a live window
 * (currentStep, currentSlide, backdropColor, items, actions); the rest are read once, when the instance is
 * built.
 *
 * The window is opened by the consumer: `this.$refs.dialog.show()`.
 */
export const BWhatsNew = defineComponent({
	name: 'BWhatsNew',
	props: {
		size: {
			type: String as PropType<WhatsNewSize>,
			default: WhatsNewSize.Md,
			validator: (value: string): boolean => isOneOf(WhatsNewSize, value),
		},
		mediaPosition: {
			type: String as PropType<WhatsNewMediaPosition>,
			default: WhatsNewMediaPosition.Top,
			validator: (value: string): boolean => isOneOf(WhatsNewMediaPosition, value),
		},
		actionsAlign: {
			type: String as PropType<WhatsNewActionsAlign>,
			default: WhatsNewActionsAlign.Right,
			validator: (value: string): boolean => isOneOf(WhatsNewActionsAlign, value),
		},
		stepCount: {
			type: Number,
			default: 1,
		},
		currentStep: {
			type: Number,
			default: 0,
		},
		label: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		// A word of the title painted with the gradient of the brand; every occurrence of it is painted.
		titleBrand: {
			type: String,
			default: '',
		},
		subtitle: {
			type: String,
			default: '',
		},
		// A change is a new array: the watchers below answer to the value handed over and not to a row edited
		// in place, because the class rebuilds the content of the window from what it is given.
		items: {
			type: Array as PropType<WhatsNewItem[]>,
			default: (): WhatsNewItem[] => [],
		},
		// The graphics of the announcement: a list of layers the component lays out and moves. It stands in the
		// zone of the media.
		scene: {
			type: [Array, Object] as PropType<WhatsNewScene | null>,
			default: null,
		},
		// The video of the announcement, a refinement of the same place as well.
		video: {
			type: Object as PropType<WhatsNewVideo | null>,
			default: null,
		},
		// The slides of the gallery, the richest refinement of the same place.
		gallery: {
			type: Array as PropType<WhatsNewGallerySlide[]>,
			default: (): WhatsNewGallerySlide[] => [],
		},
		galleryNav: {
			type: String as PropType<WhatsNewGalleryNav>,
			default: WhatsNewGalleryNav.Sides,
			validator: (value: string): boolean => isOneOf(WhatsNewGalleryNav, value),
		},
		// The slide the gallery stands on, counted from zero. A number turns the controlled mode on; left alone,
		// the gallery turns by itself.
		currentSlide: {
			type: Number as PropType<number | null>,
			default: null,
		},
		// Whether the composition of the scene follows the pointer.
		parallax: {
			type: Boolean,
			default: true,
		},
		// Effect of the backdrop. An effect that cannot be drawn falls back to the static composition.
		backdrop: {
			type: String as PropType<WhatsNewBackdrop>,
			default: WhatsNewBackdrop.None,
			validator: (value: string): boolean => isOneOf(WhatsNewBackdrop, value),
		},
		backdropColor: {
			type: String as PropType<WhatsNewColor>,
			default: WhatsNewColor.DarkBlue,
			validator: (value: string): boolean => isOneOf(WhatsNewColor, value),
		},
		actions: {
			type: Array as PropType<WhatsNewAction[]>,
			default: (): WhatsNewAction[] => [],
		},
		hasOverlay: {
			type: Boolean,
			default: true,
		},
		disableScrolling: {
			type: Boolean,
			default: true,
		},
		closeByEsc: {
			type: Boolean,
			default: true,
		},
		closeByClickOutside: {
			type: Boolean,
			default: true,
		},
		hasCloseButton: {
			type: Boolean,
			default: true,
		},
		// Not an option of the class but a switch of the shown window: whether the user may close it right now.
		closable: {
			type: Boolean,
			default: true,
		},
	},
	emits: [
		'show',
		'afterShow',
		'close',
		'hide',
		'afterHide',
		'itemClick',
		'stepChange',
		'slideChange',
		'backdropColorChange',
	],
	watch: {
		currentStep(value: number): void
		{
			this.dialog?.setCurrentStep(value);
		},
		// The prop is nullable, and its two states are two modes of the ring: a number is the slide of the
		// consumer and null hands the ring back to itself. Both go to the setter as they are.
		currentSlide(value: number | null): void
		{
			this.dialog?.setCurrentSlide(value);
		},
		backdropColor(value: WhatsNewColor): void
		{
			this.dialog?.setBackdropColor(value);
		},
		items(value: WhatsNewItem[]): void
		{
			this.dialog?.setItems(value);
		},
		actions(value: WhatsNewAction[]): void
		{
			this.dialog?.setActions(value);
		},
		closable(value: boolean): void
		{
			this.dialog?.setClosable(value);
		},
	},
	data(): { dialog: WhatsNew | null, slideNodes: Record<string, HTMLElement> }
	{
		return {
			dialog: null,
			slideNodes: {},
		};
	},
	created(): void
	{
		// Teleport needs an existing target from the first render on, and the class keeps the very nodes it was
		// given through every rebuild of the content - so a slot renders into the window and stays there.
		//
		// Both fields are marked raw: a Vue proxy over the instance breaks access to the private #-fields of
		// the class, and a proxy over a node is not the node Teleport was handed.
		this.slideNodes = markRaw(this.buildSlideNodes());
		const dialog: WhatsNew = markRaw(new WhatsNew(this.buildOptions()));
		// The switch is not an option of the constructor: a window mounted already held closed is told so here.
		if (!this.closable)
		{
			dialog.setClosable(false);
		}

		this.dialog = dialog;
	},
	unmounted(): void
	{
		this.dialog?.destroy();
		this.dialog = null;
	},
	methods: {
		// A container per filled `slide-<n>` slot, in the order of the ring: the class takes the slides as a
		// list, so the place of a slide is the number of its slot and not the order the slots were declared in.
		buildSlideNodes(): Record<string, HTMLElement>
		{
			const nodes: Record<string, HTMLElement> = {};

			Object.keys(this.$slots)
				.filter((name: string) => SLIDE_SLOT.test(name))
				.sort((one: string, two: string) => {
					return Number(SLIDE_SLOT.exec(one)![1]) - Number(SLIDE_SLOT.exec(two)![1]);
				})
				.forEach((name: string) => {
					nodes[name] = document.createElement('div');
				});

			return nodes;
		},
		buildOptions(): WhatsNewOptions
		{
			const slides: WhatsNewGallerySlide[] = Object.values(this.slideNodes);

			return {
				size: this.size,
				mediaPosition: this.mediaPosition,
				actionsAlign: this.actionsAlign,
				stepCount: this.stepCount,
				currentStep: this.currentStep,
				label: this.label,
				title: this.title,
				titleBrand: this.titleBrand,
				subtitle: this.subtitle,
				items: this.items,
				scene: this.scene,
				video: this.video,
				// Filled slide slots are the gallery; without them the prop is passed on as it came.
				gallery: slides.length > 0 ? slides : this.gallery,
				galleryNav: this.galleryNav,
				// No slide of the consumer means no controlled mode: the option has to arrive absent and not as a
				// slide of its own.
				currentSlide: this.currentSlide ?? undefined,
				parallax: this.parallax,
				backdrop: this.backdrop,
				backdropColor: this.backdropColor,
				actions: this.actions,
				hasOverlay: this.hasOverlay,
				disableScrolling: this.disableScrolling,
				closeByEsc: this.closeByEsc,
				closeByClickOutside: this.closeByClickOutside,
				hasCloseButton: this.hasCloseButton,
				events: {
					onShow: (event) => this.$emit('show', event),
					onAfterShow: (event) => this.$emit('afterShow', event),
					onClose: (event) => this.$emit('close', event),
					onHide: (event) => this.$emit('hide', event),
					onAfterHide: (event) => this.$emit('afterHide', event),
					onItemClick: (event) => this.$emit('itemClick', event),
					onStepChange: (event) => this.$emit('stepChange', event),
					onSlideChange: (event) => this.$emit('slideChange', event),
					onBackdropColorChange: (event) => this.$emit('backdropColorChange', event),
				},
			};
		},
		show(): void
		{
			this.dialog?.show();
		},
		hide(): void
		{
			this.dialog?.hide();
		},
	},
	template: `
		<Teleport v-for="(node, name) in slideNodes" :key="name" :to="node">
			<slot :name="name"></slot>
		</Teleport>
	`,
});
