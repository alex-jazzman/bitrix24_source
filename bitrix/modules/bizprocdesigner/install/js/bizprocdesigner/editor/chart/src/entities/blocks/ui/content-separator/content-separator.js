import { Event } from 'main.core';
import { useHighlightedBlocks } from 'ui.block-diagram';
import { FRAME_TEXT_ALIGN_OPTIONS } from '../../constants';

import './content-separator.css';

type ContentSeparatorData = {
	isResizing: boolean,
	containerScreenX: number,
	containerScreenY: number,
	chromeWidth: number,
	chromeHeight: number,
	firstPartSize: number,
	secondPartSize: number,
};

const CONTENT_SEPARATOR_CLASS_NAMES = {
	base: 'chart-editor-content-separator',
	column: '--column',
};

const CONTENT_WRAPPER_CLASS_NAMES = {
	base: 'chart-editor-content-separator__wrapper',
	column: '--column',
	resizing: '--resizing',
};

const SEPARATOR_CLASS_NAMES = {
	base: 'chart-editor-content-separator__separator',
	column: '--column',
	resizing: '--resizing',
};

const SLOT_NAMES = {
	CONTENT: 'content',
	VIEW: 'view',
};

const FIRST_PART_CLASS_NAMES = {
	base: 'chart-editor-content-separator__first-part',
	resizing: '--resizing',
	column: '--column',
	fill: '--fill',
};

const SECOND_PART_CLASS_NAMES = {
	base: 'chart-editor-content-separator__second-part',
	resizing: '--resizing',
	column: '--column',
	fill: '--fill',
};

const FIRST_PART_SEPARATOR_TMP_CLASS_NAMES = {
	base: 'chart-editor-content-separator__first-part-separator-tmp',
	show: '--show',
	column: '--column',
};

const SECOND_PART_SEPARATOR_TMP_CLASS_NAMES = {
	base: 'chart-editor-content-separator__second-part-separator-tmp',
	show: '--show',
	column: '--column',
};

export const SEPARATOR_SIZE = 13;

// @vue/component
export const ContentSeparator = {
	name: 'ContentSeparator',
	props: {
		blockId: {
			type: String,
			required: true,
		},
		width: {
			type: Number,
			default: 100,
		},
		height: {
			type: Number,
			default: 100,
		},
		minContentWidth: {
			type: Number,
			default: 380,
		},
		minContentHeight: {
			type: Number,
			default: 380,
		},
		contentPosition: {
			type: String,
			default: FRAME_TEXT_ALIGN_OPTIONS.LEFT,
			required: true,
		},
		separatorPosition: {
			type: Number,
			default: 0,
		},
		contentScrollable: {
			type: Boolean,
			default: false,
		},
		zoom: {
			type: Number,
			default: 1,
		},
		resizing: {
			type: Boolean,
			default: false,
		},
		contentAttributes: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['update:separatorPosition'],
	setup(): {...}
	{
		const highlightedBlocks = useHighlightedBlocks();

		return {
			highlightedBlocks,
		};
	},
	data(): ContentSeparatorData
	{
		return {
			isResizing: false,
			// Screen pixels, unlike the sizes below: a mouse event is measured from them.
			containerScreenX: 0,
			containerScreenY: 0,
			// Canvas coordinates: how much larger the block is than the separator container.
			chromeWidth: 0,
			chromeHeight: 0,
			firstPartSize: 0,
			secondPartSize: 0,
		};
	},
	computed: {
		isColumn(): boolean
		{
			return ([
				FRAME_TEXT_ALIGN_OPTIONS.TOP,
				FRAME_TEXT_ALIGN_OPTIONS.BOTTOM,
			])
				.includes(this.contentPosition);
		},
		isFirstContainerActive(): boolean
		{
			return ([
				FRAME_TEXT_ALIGN_OPTIONS.TOP,
				FRAME_TEXT_ALIGN_OPTIONS.LEFT,
			])
				.includes(this.contentPosition);
		},
		isSecondContainerActive(): boolean
		{
			return ([
				FRAME_TEXT_ALIGN_OPTIONS.BOTTOM,
				FRAME_TEXT_ALIGN_OPTIONS.RIGHT,
			])
				.includes(this.contentPosition);
		},
		isNone(): boolean
		{
			return this.contentPosition === FRAME_TEXT_ALIGN_OPTIONS.NONE;
		},
		contentSeparatorClassNames(): { [string]: boolean }
		{
			return {
				[CONTENT_SEPARATOR_CLASS_NAMES.base]: true,
				[CONTENT_SEPARATOR_CLASS_NAMES.column]: this.isColumn,
			};
		},
		contentWrapperClassNames(): { [string]: boolean }
		{
			return {
				[CONTENT_WRAPPER_CLASS_NAMES.base]: true,
				[CONTENT_WRAPPER_CLASS_NAMES.column]: this.isColumn,
				[CONTENT_WRAPPER_CLASS_NAMES.resizing]: this.resizing,
			};
		},
		separatorClassNames(): { [string]: boolean }
		{
			return {
				[SEPARATOR_CLASS_NAMES.base]: true,
				[SEPARATOR_CLASS_NAMES.column]: this.isColumn,
				[SEPARATOR_CLASS_NAMES.resizing]: this.resizing,
			};
		},
		firstPartClassNames(): { [string]: boolean }
		{
			return {
				[FIRST_PART_CLASS_NAMES.base]: true,
				[FIRST_PART_CLASS_NAMES.resizing]: this.resizing && this.isTopOrLeftContentPosition(this.contentPosition),
				[FIRST_PART_CLASS_NAMES.column]: this.isColumn,
				[FIRST_PART_CLASS_NAMES.fill]: !this.isFirstContainerActive,
			};
		},
		firstPartAttributes(): Object
		{
			return this.firstPartSlotName === SLOT_NAMES.CONTENT ? this.contentAttributes : {};
		},
		secondPartClassNames(): { [string]: boolean }
		{
			return {
				[SECOND_PART_CLASS_NAMES.base]: true,
				[SECOND_PART_CLASS_NAMES.resizing]: this.resizing && this.isBottomOrRightContentPosition(this.contentPosition),
				[SECOND_PART_CLASS_NAMES.column]: this.isColumn,
				[SECOND_PART_CLASS_NAMES.fill]: !this.isSecondContainerActive,
			};
		},
		secondPartAttributes(): Object
		{
			return this.secondPartSlotName === SLOT_NAMES.CONTENT ? this.contentAttributes : {};
		},
		firstPartSlotName(): string {
			return ([
				FRAME_TEXT_ALIGN_OPTIONS.TOP,
				FRAME_TEXT_ALIGN_OPTIONS.LEFT,
			]).includes(this.contentPosition)
				? SLOT_NAMES.CONTENT
				: SLOT_NAMES.VIEW;
		},
		secondPartSlotName(): string {
			return ([
				FRAME_TEXT_ALIGN_OPTIONS.BOTTOM,
				FRAME_TEXT_ALIGN_OPTIONS.RIGHT,
			]).includes(this.contentPosition)
				? SLOT_NAMES.CONTENT
				: SLOT_NAMES.VIEW;
		},
		firstPartStyle(): { [string]: string }
		{
			return this.getPartStyle(this.firstPartSize);
		},
		secondPartStyle(): { [string]: string }
		{
			return this.getPartStyle(this.secondPartSize);
		},
		contentNoneStyle(): { [string]: string }
		{
			return {
				width: `${this.width}px`,
				height: `${this.height}px`,
			};
		},
		firstPartSlotWidthProp(): number
		{
			if (this.isColumn)
			{
				return this.width;
			}

			return this.firstPartSize;
		},
		firstPartSlotHeightProp(): number
		{
			if (this.isColumn)
			{
				return this.firstPartSize;
			}

			return this.height;
		},
		secondPartSlotWidthProp(): number
		{
			if (this.isColumn)
			{
				return this.width;
			}

			return this.secondPartSize;
		},
		secondPartSlotHeightProp(): number
		{
			if (this.isColumn)
			{
				return this.secondPartSize;
			}

			return this.height;
		},
		firstPartSeparatorTmpClassNames(): { [string]: boolean }
		{
			return {
				[FIRST_PART_SEPARATOR_TMP_CLASS_NAMES.base]: true,
				[FIRST_PART_SEPARATOR_TMP_CLASS_NAMES.show]: this.resizing && this.isFirstContainerActive,
				[FIRST_PART_SEPARATOR_TMP_CLASS_NAMES.column]: this.isColumn,
			};
		},
		secondPartSeparatorTmpClassNames(): { [string]: boolean }
		{
			return {
				[SECOND_PART_SEPARATOR_TMP_CLASS_NAMES.base]: true,
				[SECOND_PART_SEPARATOR_TMP_CLASS_NAMES.show]: this.resizing && this.isSecondContainerActive,
				[SECOND_PART_SEPARATOR_TMP_CLASS_NAMES.column]: this.isColumn,
			};
		},
	},
	watch: {
		width(): void
		{
			this.recomputeParts();
		},
		height(): void
		{
			this.recomputeParts();
		},
		contentPosition(newContentPosition: string): void
		{
			// The parts are laid out in the same render flush the new axis is drawn in, so they are
			// recomputed here and not with the measurement below.
			this.recomputeParts();
			this.scheduleGeometryUpdate();

			this.$nextTick(() => {
				this.setPartWheelHandlers(newContentPosition, this.contentScrollable);
			});
		},
		resizing(isResizing: boolean): void
		{
			if (isResizing)
			{
				this.scheduleGeometryUpdate();
			}
		},
		isResizing(value: boolean): void
		{
			if (value)
			{
				this.highlightedBlocks.clear();
				this.highlightedBlocks.add(this.blockId);
			}
		},
		contentScrollable(isScrollable: boolean): void
		{
			this.$nextTick(() => {
				this.setPartWheelHandlers(this.contentPosition, isScrollable);
			});
		},
	},
	mounted(): void
	{
		this.updateGeometry();
		this.setPartWheelHandlers(this.contentPosition, this.contentScrollable);
	},
	unmounted(): void
	{
		Event.unbind(this.$refs.firstPartContainer, 'wheel', this.onWheelContent);
		Event.unbind(this.$refs.secondPartContainer, 'wheel', this.onWheelContent);
		Event.unbind(this.$refs.noneAlignPartContainer, 'wheel', this.onWheelContent);
	},
	methods: {
		isTopOrLeftContentPosition(position: string): boolean
		{
			return ([FRAME_TEXT_ALIGN_OPTIONS.TOP, FRAME_TEXT_ALIGN_OPTIONS.LEFT])
				.includes(position);
		},
		isBottomOrRightContentPosition(position: string): boolean
		{
			return ([FRAME_TEXT_ALIGN_OPTIONS.BOTTOM, FRAME_TEXT_ALIGN_OPTIONS.RIGHT])
				.includes(position);
		},
		setPartWheelHandlers(contentPosition: string, isScrollable: boolean = true): void
		{
			const {
				firstPartContainer = null,
				secondPartContainer = null,
				noneAlignPartContainer = null,
			} = this.$refs;

			const isFirstPartContainer = ([
				FRAME_TEXT_ALIGN_OPTIONS.TOP,
				FRAME_TEXT_ALIGN_OPTIONS.LEFT,
			])
				.includes(contentPosition) && firstPartContainer !== null;
			const isSecondPartContainer = ([
				FRAME_TEXT_ALIGN_OPTIONS.BOTTOM,
				FRAME_TEXT_ALIGN_OPTIONS.RIGHT,
			])
				.includes(contentPosition) && secondPartContainer !== null;

			Event.unbind(firstPartContainer, 'wheel', this.onWheelContent);
			Event.unbind(secondPartContainer, 'wheel', this.onWheelContent);
			Event.unbind(noneAlignPartContainer, 'wheel', this.onWheelContent);

			if (isScrollable && isFirstPartContainer)
			{
				Event.bind(firstPartContainer, 'wheel', this.onWheelContent);
			}
			else if (isScrollable && isSecondPartContainer)
			{
				Event.bind(secondPartContainer, 'wheel', this.onWheelContent);
			}
		},
		onWheelContent(event: MouseEvent): void
		{
			event.stopPropagation();
		},
		getPartStyle(size: number): { [string]: string }
		{
			return this.isColumn
				? { height: `${size}px`, width: '100%' }
				: { width: `${size}px`, height: '100%' };
		},
		getAxisSize(): number
		{
			// The block is larger than the separator container by the block border and the layout
			// padding. The canvas scales the block with a CSS transform, so in canvas coordinates
			// that correction stays the same at any zoom and while the block is being resized —
			// the container never has to be measured during the gesture.
			return this.isColumn
				? this.height - this.chromeHeight
				: this.width - this.chromeWidth;
		},
		getMinContentSize(): number
		{
			return this.isColumn ? this.minContentHeight : this.minContentWidth;
		},
		recomputeParts(rawTextSize: number = this.separatorPosition): void
		{
			const axisSize = this.getAxisSize();
			const minContentSize = this.getMinContentSize();

			let textSize = Math.max(minContentSize, rawTextSize);
			textSize = Math.min(textSize, axisSize - SEPARATOR_SIZE);
			const emptySize = axisSize - SEPARATOR_SIZE - textSize;

			if (this.isFirstContainerActive)
			{
				this.firstPartSize = textSize;
				this.secondPartSize = emptySize;
			}
			else
			{
				this.firstPartSize = emptySize;
				this.secondPartSize = textSize;
			}
		},
		getTextSizeFromEvent(event: MouseEvent): number
		{
			const axisSize = this.getAxisSize();
			const minContentSize = this.getMinContentSize();
			const cursorPosition = (
				this.isColumn
					? event.clientY - this.containerScreenY
					: event.clientX - this.containerScreenX
			) / this.zoom;
			// The line is drawn in the middle of the separator, so the separator has to start
			// half its size before the cursor for the line to end up under it.
			const separatorStart = cursorPosition - (SEPARATOR_SIZE / 2);

			const textSize = this.isFirstContainerActive
				? separatorStart
				: axisSize - SEPARATOR_SIZE - separatorStart;

			// Rounded after the limits, not before: the module declares the saved position an
			// integer, and rounding a clamped value keeps it inside the limits.
			return Math.round(
				Math.min(
					Math.max(textSize, minContentSize),
					axisSize - SEPARATOR_SIZE,
				),
			);
		},
		updateContainerRect(): void
		{
			const container = this.$refs.containerSeparator ?? null;
			const width = container?.offsetWidth ?? 0;
			const height = container?.offsetHeight ?? 0;

			if (width <= 0 || height <= 0)
			{
				// A container mounted in a hidden subtree measures zero. Keeping the previous
				// correction is safer than storing one equal to the whole block size.
				return;
			}

			const { x = 0, y = 0 } = container.getBoundingClientRect();

			// The rect is in screen pixels: a mouse event is measured from it.
			this.containerScreenX = x;
			this.containerScreenY = y;
			// offsetWidth/offsetHeight are the border box in layout pixels. The canvas scales the
			// block with a CSS transform, which those never see, so they are already in canvas
			// coordinates — unlike the rect, they do not have to be read against a zoom that the
			// state may hold a frame before the DOM does.
			this.chromeWidth = this.width - width;
			this.chromeHeight = this.height - height;
		},
		updateGeometry(): void
		{
			this.updateContainerRect();
			this.recomputeParts();
		},
		scheduleGeometryUpdate(): void
		{
			// The container reaches its new size in the same render flush the props change in, so
			// it can only be measured once that flush is over. Measuring reads the layout back, so
			// it happens only where the correction may have changed: on mount, on a layout switch
			// and at the start of a resize — never on the steps of the gesture itself.
			this.$nextTick(this.updateGeometry);
		},
		applySeparatorDrag(event: MouseEvent): void
		{
			const textSize = this.getTextSizeFromEvent(event);

			this.recomputeParts(textSize);
			this.$emit('update:separatorPosition', textSize);
		},
		onMouseDownSeparator(event: MouseEvent): void
		{
			this.isResizing = true;
			Event.bind(document, 'mousemove', this.onMouseMoveSeparator);
			Event.bind(document, 'mouseup', this.onMouseUpSeparator);

			this.updateContainerRect();
			this.applySeparatorDrag(event);
		},
		onMouseMoveSeparator(event: MouseEvent): void
		{
			if (!this.isResizing)
			{
				return;
			}

			this.applySeparatorDrag(event);
		},
		onMouseUpSeparator(event: MouseEvent): void
		{
			event.stopImmediatePropagation();
			Event.unbind(document, 'mousemove', this.onMouseMoveSeparator);
			Event.unbind(document, 'mouseup', this.onMouseUpSeparator);
			this.isResizing = false;
		},
	},
	template: `
		<div
			ref="containerSeparator"
			:class="contentSeparatorClassNames"
			:data-test-id="$testId('contentSeparator', blockId)"
		>
			<div
				v-if="!isNone"
				:class="contentWrapperClassNames"
			>
				<div
					:style="firstPartStyle"
					ref="firstPartContainer"
					:class="firstPartClassNames"
					v-bind="firstPartAttributes"
					:data-test-id="$testId('contentSeparatorFirstPart', blockId)"
				>
					<div :class="firstPartSeparatorTmpClassNames"/>
					<slot
						:name="firstPartSlotName"
						:width="firstPartSlotWidthProp"
						:height="firstPartSlotHeightProp"
					/>
				</div>
				<div
					ref="separator"
					:class="separatorClassNames"
					:data-test-id="$testId('contentSeparatorHandle', blockId)"
					@mousedown.stop="onMouseDownSeparator"
				>
				</div>
				<div
					:style="secondPartStyle"
					ref="secondPartContainer"
					:class="secondPartClassNames"
					v-bind="secondPartAttributes"
					:data-test-id="$testId('contentSeparatorSecondPart', blockId)"
				>
					<div :class="secondPartSeparatorTmpClassNames"/>
					<slot
						:name="secondPartSlotName"
						:width="secondPartSlotWidthProp"
						:height="secondPartSlotHeightProp"
					/>
				</div>
			</div>
			<div
				v-else
				:style="contentNoneStyle"
				ref="noneAlignPartContainer"
				class="chart-editor-content-separator__content"
			>
				<slot
					name="noneContent"
					:width="width"
					:height="height"
				/>
			</div>
		</div>
	`,
};
