import { Event } from 'main.core';
import { useHighlightedBlocks } from 'ui.block-diagram';
import { FRAME_TEXT_ALIGN_OPTIONS } from '../../constants';

import './content-separator.css';

type ContentSeparatorData = {
	isResizing: boolean,
	containerWidth: number,
	containerHeight: number,
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
};

const SEPARATOR_CLASS_NAMES = {
	base: 'chart-editor-content-separator__separator',
	column: '--column',
};

const SLOT_NAMES = {
	CONTENT: 'content',
	VIEW: 'view',
};

const SEPARATOR_SIZE = 13;

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
		contentPosition: {
			type: String,
			default: FRAME_TEXT_ALIGN_OPTIONS.RIGHT,
			required: true,
		},
		separatorPosition: {
			type: Number,
			default: 0,
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
			containerWidth: 0,
			containerHeight: 0,
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
			if (this.isColumn)
			{
				return {
					height: `${this.firstPartSize}%`,
					width: '100%',
				};
			}

			return {
				width: `${this.firstPartSize}%`,
				height: '100%',
			};
		},
		secondPartStyle(): { [string]: string }
		{
			if (this.isColumn)
			{
				return {
					height: `${this.secondPartSize}%`,
					width: '100%',
				};
			}

			return {
				width: `${this.secondPartSize}%`,
				height: '100%',
			};
		},
		contentNoneStyle(): { [string]: string }
		{
			return {
				width: `${this.containerWidth}px`,
				height: `${this.containerHeight}px`,
			};
		},
		firstPartSlotWidthProp(): number
		{
			if (this.isColumn)
			{
				return this.containerWidth;
			}

			return this.firstPartSize;
		},
		firstPartSlotHeightProp(): number
		{
			if (this.isColumn)
			{
				return this.firstPartSize;
			}

			return this.containerHeight;
		},
		secondPartSlotWidthProp(): number
		{
			if (this.isColumn)
			{
				return this.containerWidth;
			}

			return this.secondPartSize;
		},
		secondPartSlotHeightProp(): number
		{
			if (this.isColumn)
			{
				return this.secondPartSize;
			}

			return this.containerHeight;
		},
	},
	watch: {
		width(newWidth: number, oldWidth: number): void
		{
			this.containerWidth = newWidth;

			if (this.isColumn)
			{
				return;
			}

			const newPercent = newWidth / 100;
			const oldPercent = oldWidth / 100;
			const oldSeparatorPositionPercent = this.separatorPosition / oldPercent;

			this.$emit('update:separatorPosition', oldSeparatorPositionPercent * newPercent);
		},
		height(newHeight: number, oldHeight: number): void
		{
			this.containerHeight = newHeight;

			if (!this.isColumn)
			{
				return;
			}

			const newPercent = newHeight / 100;
			const oldPercent = oldHeight / 100;
			const oldSeparatorPositionPercent = this.separatorPosition / oldPercent;

			this.$emit('update:separatorPosition', oldSeparatorPositionPercent * newPercent);
		},
		contentPosition(newContentPosition: string): void
		{
			this.$nextTick(() => {
				this.setPartWheelHandlers(newContentPosition);
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
	},
	mounted(): void
	{
		this.updateContainerRect();
		this.resize(
			this.isColumn ? this.containerHeight : this.containerWidth,
			this.separatorPosition,
		);
		this.setPartWheelHandlers(this.contentPosition);
	},
	unmounted(): void
	{
		Event.unbind(this.$refs.firstPartContainer, 'wheel', this.onWheelContent);
		Event.unbind(this.$refs.secondPartContainer, 'wheel', this.onWheelContent);
		Event.unbind(this.$refs.noneAlignPartContainer, 'wheel', this.onWheelContent);
	},
	methods: {
		setPartWheelHandlers(contentPosition: string): void
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

			if (isFirstPartContainer)
			{
				Event.bind(firstPartContainer, 'wheel', this.onWheelContent);
			}
			else if (isSecondPartContainer)
			{
				Event.bind(secondPartContainer, 'wheel', this.onWheelContent);
			}
			else
			{
				Event.bind(noneAlignPartContainer, 'wheel', this.onWheelContent);
			}
		},
		onWheelContent(event: MouseEvent): void
		{
			event.stopPropagation();
		},
		resize(containerSize: number, cursorPosition: number): void
		{
			const percent = containerSize / 100;
			const separatorSizeAsPercent = SEPARATOR_SIZE / percent;

			let preparedCursorPosition = cursorPosition < SEPARATOR_SIZE
				? SEPARATOR_SIZE
				: cursorPosition;

			preparedCursorPosition = cursorPosition > containerSize
				? containerSize
				: preparedCursorPosition;

			this.firstPartSize = (preparedCursorPosition / percent) - (separatorSizeAsPercent / 2);
			this.secondPartSize = 100 - this.firstPartSize - (separatorSizeAsPercent / 2);
		},
		updateContainerRect(): void
		{
			const {
				x = 0,
				y = 0,
				width = 0,
				height = 0,
			} = this.$refs.containerSeparator?.getBoundingClientRect() ?? {};

			this.containerX = x;
			this.containerY = y;
			this.containerWidth = width;
			this.containerHeight = height;
		},
		emitSeparatorPosition(event: MouseEvent): void
		{
			const containerSize = this.isColumn
				? this.containerHeight
				: this.containerWidth;
			let separatorPosition = this.isColumn
				? event.clientY - this.containerY
				: event.clientX - this.containerX;

			separatorPosition = separatorPosition < SEPARATOR_SIZE
				? SEPARATOR_SIZE
				: separatorPosition;

			separatorPosition = separatorPosition > containerSize
				? containerSize
				: separatorPosition;

			this.$emit(
				'update:separatorPosition',
				separatorPosition,
			);
		},
		onMouseDownSeparator(event: MouseEvent)
		{
			this.isResizing = true;
			Event.bind(document, 'mousemove', this.onMouseMoveSeparator);
			Event.bind(document, 'mouseup', this.onMouseUpSeparator);

			this.updateContainerRect();
			this.emitSeparatorPosition(event);
		},
		onMouseMoveSeparator(event: MouseEvent)
		{
			if (!this.isResizing)
			{
				return;
			}

			this.resize(
				this.isColumn ? this.containerHeight : this.containerWidth,
				this.isColumn ? event.clientY - this.containerY : event.clientX - this.containerX,
			);
			this.emitSeparatorPosition(event);
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
					class="chart-editor-content-separator__first-part"
				>
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
					class="chart-editor-content-separator__second-part"
				>
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
					name="content"
					:width="containerWidth"
					:height="containerHeight"
				/>
			</div>
		</div>
	`,
};
