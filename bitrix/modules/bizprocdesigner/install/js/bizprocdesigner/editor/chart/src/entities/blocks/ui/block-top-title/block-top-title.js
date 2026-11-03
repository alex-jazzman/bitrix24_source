import { Dom, Tag, Text, Type } from 'main.core';
import { useBlockDiagram } from 'ui.block-diagram';
import { markRaw } from 'ui.vue3';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { getAngleHalfWidth, getLeftEdgeAngleAlignment } from './hint-alignment';

import './block-top-title.css';

// @vue/component
export const BlockTopTitle = {
	name: 'BlockTopTitle',
	directives: {
		hint,
	},
	props: {
		title: {
			type: String,
			required: false,
			default: '',
		},
		description: {
			type: String,
			required: false,
			default: '',
		},
	},
	setup(): Object
	{
		const { zoom, transformX, transformY } = useBlockDiagram();

		return {
			zoom,
			transformX,
			transformY,
		};
	},
	data(): {
		popupInstance: null,
		isOverflowing: boolean,
		resizeObserver: ?ResizeObserver,
		angleOffset: ?number,
		alignmentFrameId: ?number,
		alignmentTimeoutId: ?number,
		}
	{
		return {
			popupInstance: null,
			isOverflowing: false,
			resizeObserver: null,
			angleOffset: null,
			alignmentFrameId: null,
			alignmentTimeoutId: null,
		};
	},
	computed: {
		displayText(): string
		{
			if (this.title)
			{
				return this.title;
			}

			return this.description || '';
		},
		tooltipContent(): HTMLElement
		{
			return Tag.render`
				<div class="editor-chart-tooltip">
				   <h3 class="editor-chart-tooltip__title">${Text.encode(this.title)}</h3>
				   <p class="editor-chart-tooltip__description">${Text.encode(this.description)}</p>
				</div>
			`;
		},
		shouldShowTooltip(): boolean
		{
			return this.isOverflowing || Boolean(this.title && this.description);
		},
	},
	watch: {
		zoom: 'closePopup',
		transformX: 'closePopup',
		transformY: 'closePopup',
		displayText(): void
		{
			this.$nextTick(() => {
				this.checkOverflow();
			});
		},
	},
	mounted(): void
	{
		this.checkOverflow();

		if (this.$refs.textContainer && Type.isFunction(ResizeObserver))
		{
			this.resizeObserver = new ResizeObserver(() => {
				this.checkOverflow();
				this.adjustOpenPopup();
			});
			this.resizeObserver.observe(this.$refs.textContainer);
		}
	},
	beforeUnmount(): void
	{
		this.cancelScheduledAlignment();

		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
	},
	methods: {
		getHintOptions(): HintParams
		{
			return {
				text: this.tooltipContent,
				popupOptions: {
					offsetTop: -10,
					bindOptions: { position: 'top' },
					className: 'editor-chart-tooltip-content',
					width: 340,
					background: 'var(--ui-color-accent-soft-element-blue)',
					events: {
						onShow: (event) => {
							const popup = event.getTarget();
							if (popup)
							{
								this.popupInstance = markRaw(popup);
								this.applyPopupBindElement(popup);
								this.scheduleAlignment();
							}
						},
						onClose: () => {
							this.releasePopup();
						},
					},
				},
			};
		},
		checkOverflow(): void
		{
			const element = this.$refs.textContainer;
			if (element)
			{
				this.isOverflowing = element.scrollWidth > element.clientWidth;
			}
		},
		closePopup(): void
		{
			if (this.popupInstance)
			{
				this.popupInstance.close();
				this.releasePopup();
			}
		},
		releasePopup(): void
		{
			this.cancelScheduledAlignment();
			this.popupInstance = null;
			this.angleOffset = null;
		},
		applyPopupBindElement(popup): void
		{
			const bindElement = this.getHintBindElement();
			if (!bindElement)
			{
				return;
			}

			if (Type.isFunction(popup.setBindElement))
			{
				popup.setBindElement(bindElement);
			}
			else
			{
				Reflect.set(popup, 'bindElement', bindElement);
			}
		},
		getHintBindElement(): ?HTMLElement
		{
			if (this.isOverflowing && this.$refs.textContainer)
			{
				return this.$refs.textContainer;
			}

			return this.$refs.text;
		},
		scheduleAlignment(): void
		{
			this.cancelScheduledAlignment();

			this.alignmentFrameId = requestAnimationFrame(() => {
				this.alignmentFrameId = null;
				this.adjustOpenPopup();

				// ui.vue3.directives.hint adjusts the angle asynchronously after onShow.
				this.alignmentTimeoutId = setTimeout(() => {
					this.alignmentTimeoutId = null;
					this.applyAngleOffset();
				}, 0);
			});
		},
		cancelScheduledAlignment(): void
		{
			if (this.alignmentFrameId !== null)
			{
				cancelAnimationFrame(this.alignmentFrameId);
				this.alignmentFrameId = null;
			}

			if (this.alignmentTimeoutId !== null)
			{
				clearTimeout(this.alignmentTimeoutId);
				this.alignmentTimeoutId = null;
			}
		},
		adjustOpenPopup(): void
		{
			const popup = this.popupInstance;
			const container = popup?.getPopupContainer();
			const anchor = this.getOffsetAnchor();

			if (!container || !anchor || !this.zoom)
			{
				return;
			}

			const anchorRect = anchor.getBoundingClientRect();
			if (anchorRect.width === 0)
			{
				// the title is hidden (dragging, resizing) - there is nothing to point at
				return;
			}

			const angleHalfWidth = getAngleHalfWidth(popup);
			if (!Type.isNumber(angleHalfWidth))
			{
				// the shift is what takes the angle off the title, so with an unmeasurable angle
				// neither of them is touched and the pair stays as the previous pass left it
				return;
			}

			// the popup still carries the shift of the previous adjustment, so it is measured without it
			Dom.style(container, 'transform', null);

			// the whole geometry is read in one batch, before any style is written back
			const containerRect = container.getBoundingClientRect();
			const { popupShift, angleOffset } = getLeftEdgeAngleAlignment(
				anchorRect,
				containerRect,
				this.zoom,
				angleHalfWidth,
			);
			this.angleOffset = angleOffset;

			this.applyAngleOffset();

			if (this.zoom === 1)
			{
				this.applyShift(container, popupShift);
			}
			else
			{
				this.applyZoomedShift(container, popupShift, this.zoom);
			}
		},
		applyAngleOffset(): void
		{
			// without a measured angle the offset stays unknown, and the angle keeps the place the
			// hint directive gave it - a guessed offset would point it away from the title
			if (this.popupInstance?.angle && this.angleOffset !== null)
			{
				const { angle } = this.popupInstance;
				const angleElement = angle.element;

				angle.offset = this.angleOffset;

				if (angle.position === 'bottom')
				{
					Dom.style(angleElement, 'left', '0');
					Dom.style(angleElement, 'marginLeft', `${this.angleOffset}px`);
				}
				else
				{
					Dom.style(angleElement, 'marginLeft', '0');
					Dom.style(angleElement, 'left', `${this.angleOffset}px`);
				}
			}
		},
		getOffsetAnchor(): ?HTMLElement
		{
			if (this.isOverflowing && this.$refs.textContainer)
			{
				return this.$refs.textContainer;
			}

			return this.popupInstance?.bindElement;
		},
		applyShift(container: HTMLElement, shift: number): void
		{
			Dom.style(container, 'transform', `translate(${shift}px, 0)`);
			Dom.style(container, 'transformOrigin', '0 0');
		},
		applyZoomedShift(container: HTMLElement, shift: number, scale: number): void
		{
			Dom.style(container, 'transformOrigin', 'center bottom');
			Dom.style(container, 'transform', `scale(${scale}) translate(${shift / scale}px, 0)`);
		},
	},
	template: `
		<h3 class="editor-chart-block-top-title" ref="textContainer">
			<span v-if="displayText" ref="text" v-hint="shouldShowTooltip ? getHintOptions : null">{{ displayText }}</span>
		</h3>
	`,
};
