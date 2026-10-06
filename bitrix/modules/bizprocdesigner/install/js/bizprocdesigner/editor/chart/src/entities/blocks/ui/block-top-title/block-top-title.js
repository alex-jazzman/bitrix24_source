import './block-top-title.css';
import { Tag, Text, Dom, Type } from 'main.core';
import { hint } from 'ui.vue3.directives.hint';
import type { HintParams } from 'ui.vue3.directives.hint';
import { useBlockDiagram } from 'ui.block-diagram';
import { markRaw } from 'ui.vue3';
import { getAngleHalfWidth, getCenteredAngleOffset, getPopupCenterShift } from './hint-alignment';

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
		hintOptions(): ?HintParams
		{
			if (!this.shouldShowTooltip)
			{
				return null;
			}

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
		scheduleAlignment(): void
		{
			this.cancelScheduledAlignment();

			// the first pass lands before the frame is painted, so the popup never shows up unaligned
			this.alignmentFrameId = requestAnimationFrame(() => {
				this.alignmentFrameId = null;
				this.adjustOpenPopup();

				// the hint directive of ui.vue3.directives.hint re-centers the angle on the title in a
				// zero timeout it schedules after this handler; the second pass returns the angle to
				// the middle of the shifted popup once the directive is done with it
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
			const containerWidth = container.offsetWidth;

			const shift = getPopupCenterShift(anchorRect, containerRect);
			this.angleOffset = getCenteredAngleOffset(containerWidth, angleHalfWidth);

			this.applyAngleOffset();

			if (this.zoom === 1)
			{
				this.applyShift(container, shift);
			}
			else
			{
				this.applyZoomedShift(container, shift, this.zoom);
			}
		},
		applyAngleOffset(): void
		{
			// without a measured angle the offset stays unknown, and the angle keeps the place the
			// hint directive gave it - a guessed offset would point it away from the title
			if (this.popupInstance && this.angleOffset !== null)
			{
				this.popupInstance.setAngle({ offset: this.angleOffset });
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
			<span v-if="displayText" v-hint="hintOptions">{{ displayText }}</span>
		</h3>
	`,
};
