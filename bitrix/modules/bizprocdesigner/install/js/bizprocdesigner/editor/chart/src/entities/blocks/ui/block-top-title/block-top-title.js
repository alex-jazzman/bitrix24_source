import './block-top-title.css';
import { Tag, Text, Dom, Type } from 'main.core';
import { hint } from 'ui.vue3.directives.hint';
import type { HintParams } from 'ui.vue3.directives.hint';
import { useBlockDiagram } from 'ui.block-diagram';
import { markRaw } from 'ui.vue3';

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
	data(): { popupInstance: null, isOverflowing: boolean, resizeObserver: ?ResizeObserver }
	{
		return {
			popupInstance: null,
			isOverflowing: false,
			resizeObserver: null,
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
					angle: { position: 'bottom', offset: 154 },
					className: 'editor-chart-tooltip-content',
					width: 340,
					background: 'var(--ui-color-accent-soft-element-blue)',
					events: {
						onShow: (event) => {
							const popup = event.getTarget();
							if (popup)
							{
								this.popupInstance = markRaw(popup);
								requestAnimationFrame(() => {
									this.applyInitialScale(popup);
								});
							}
						},
						onClose: () => {
							this.popupInstance = null;
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
			});
			this.resizeObserver.observe(this.$refs.textContainer);
		}
	},
	beforeUnmount(): void
	{
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
				this.popupInstance = null;
			}
		},
		applyInitialScale(popup): void
		{
			if (!this.zoom || !popup)
			{
				return;
			}

			const container = popup.getPopupContainer();
			const bind = popup.bindElement;
			if (!container || !bind)
			{
				return;
			}

			if (this.zoom === 1)
			{
				this.applyDefaultScale(container, bind);
			}
			else
			{
				this.applyZoomedScale(container, bind, this.zoom);
			}
		},
		getOffsetAnchor(bind: HTMLElement): HTMLElement
		{
			if (this.isOverflowing && this.$refs.textContainer)
			{
				return this.$refs.textContainer;
			}

			return bind;
		},
		getCenterOffset(container: HTMLElement, bind: HTMLElement): number
		{
			const popupRect = container.getBoundingClientRect();

			const anchor = this.getOffsetAnchor(bind);
			const bindRect = anchor.getBoundingClientRect();

			const bindCenterX = bindRect.left + bindRect.width / 2;
			const popupCenterX = popupRect.left + popupRect.width / 2;

			return bindCenterX - popupCenterX;
		},
		applyDefaultScale(container: HTMLElement, bind: HTMLElement): void
		{
			const dx = this.getCenterOffset(container, bind);

			Dom.style(container, 'transform', `translate(${dx}px, 0)`);
			Dom.style(container, 'transformOrigin', '0 0');
		},
		applyZoomedScale(container: HTMLElement, bind: HTMLElement, scale: number): void
		{
			Dom.style(container, 'transformOrigin', 'center bottom');
			const dx = this.getCenterOffset(container, bind);
			const adjustedDx = dx / scale;
			Dom.style(container, 'transform', `scale(${scale}) translate(${adjustedDx}px, 0)`);
		},
	},
	template: `
		<h3 class="editor-chart-block-top-title" ref="textContainer">
			<span v-if="displayText" v-hint="hintOptions">{{ displayText }}</span>
		</h3>
	`,
};
