import { Event } from 'main.core';
import { useHighlightedBlocks } from 'ui.block-diagram';
import { FRAME_TEXT_ALIGN_OPTIONS } from '../../constants';

import './content-separator.css';

type ContentSeparatorData = {
	isResizing: boolean,
	containerX: number,
	containerY: number,
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
};

const SECOND_PART_CLASS_NAMES = {
	base: 'chart-editor-content-separator__second-part',
	resizing: '--resizing',
	column: '--column',
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
			resizeContainerWidth: 0,
			resizeContainerHeight: 0,
			resizeSeparatorPosition: 0,
			resizeFirstPartSize: 0,
			resizeSecondPartSize: 0,
			containerX: 0,
			containerY: 0,
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
		contentSeparatorStyle(): { [string]: string }
		{
			return {
				width: `${this.width}px`,
				height: `${this.height}px`,
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
			};
		},
		secondPartClassNames(): { [string]: boolean }
		{
			return {
				[SECOND_PART_CLASS_NAMES.base]: true,
				[SECOND_PART_CLASS_NAMES.resizing]: this.resizing && this.isBottomOrRightContentPosition(this.contentPosition),
				[SECOND_PART_CLASS_NAMES.column]: this.isColumn,
			};
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
			if (this.resizing)
			{
				if (this.isColumn)
				{
					return {
						height: `${this.resizeFirstPartSize}px`,
						width: '100%',
					};
				}

				return {
					width: `${this.resizeFirstPartSize}px`,
					height: '100%',
				};
			}

			if (this.isColumn)
			{
				return {
					height: `${this.firstPartSize}px`,
					width: '100%',
				};
			}

			return {
				width: `${this.firstPartSize}px`,
				height: '100%',
			};
		},
		secondPartStyle(): { [string]: string }
		{
			if (this.resizing)
			{
				if (this.isColumn)
				{
					return {
						height: `${this.resizeSecondPartSize}px`,
						width: '100%',
					};
				}

				return {
					width: `${this.resizeSecondPartSize}px`,
					height: '100%',
				};
			}

			if (this.isColumn)
			{
				return {
					height: `${this.secondPartSize}px`,
					width: '100%',
				};
			}

			return {
				width: `${this.secondPartSize}px`,
				height: '100%',
			};
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
			this.recomputeParts();

			this.$nextTick(() => {
				this.setPartWheelHandlers(newContentPosition, this.contentScrollable);
			});
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
		resizing(newValue: boolean, oldValue: boolean): void
		{
			if (newValue)
			{
				this.resizeContainerWidth = this.width;
				this.resizeContainerHeight = this.height;
				this.resizeSeparatorPosition = this.separatorPosition;

				this.resizeFirstPartSize = this.firstPartSize;
				this.resizeSecondPartSize = this.secondPartSize;

				console.table({
					resizeContainerWidth: this.resizeContainerWidth,
					resizeContainerHeight: this.resizeContainerHeight,
					resizeSeparatorPosition: this.resizeSeparatorPosition,
					firstPartSize: this.firstPartSize,
					secondPartSize: this.secondPartSize,
					bottomContent: this.resizeContainerHeight - this.resizeSeparatorPosition,
					preSecondPathColumn: this.resizeContainerHeight - this.resizeSeparatorPosition - SEPARATOR_SIZE,
					preSecondPath: this.resizeContainerWidth - this.resizeSeparatorPosition - SEPARATOR_SIZE,
				});
			}
		},
	},
	mounted(): void
	{
		this.updateContainerRect();
		this.recomputeParts();
		this.setPartWheelHandlers(this.contentPosition, this.contentScrollable);

		console.table({
			width: this.width,
			height: this.height,
			firstPartSize: this.firstPartSize,
			secondPartSize: this.secondPartSize,
			separatorPosition: this.separatorPosition,
		});
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
		getAxisSize(): number
		{
			return this.isColumn ? this.height : this.width;
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

			this.resizeFirstPartSize = this.firstPartSize;
			this.resizeSecondPartSize = this.secondPartSize;
		},
		getTextSizeFromEvent(event: MouseEvent): number
		{
			const axisSize = this.getAxisSize();
			const minContentSize = this.getMinContentSize();
			const cursorPosition = (
				this.isColumn
					? event.clientY - this.containerY
					: event.clientX - this.containerX
			) / this.zoom;

			const textSize = this.isFirstContainerActive
				? cursorPosition
				: axisSize - SEPARATOR_SIZE - cursorPosition;

			return Math.min(
				Math.max(textSize, minContentSize),
				axisSize - SEPARATOR_SIZE,
			);
		},
		updateContainerRect(): void
		{
			const {
				x = 0,
				y = 0,
			} = this.$refs.containerSeparator?.getBoundingClientRect() ?? {};

			this.containerX = x;
			this.containerY = y;
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
		>
			<div
				v-if="!isNone"
				:class="contentWrapperClassNames"
			>
				<div
					:style="firstPartStyle"
					ref="firstPartContainer"
					:class="firstPartClassNames"
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
					@mousedown.stop="onMouseDownSeparator"
				>
				</div>
				<div
					:style="secondPartStyle"
					ref="secondPartContainer"
					:class="secondPartClassNames"
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
