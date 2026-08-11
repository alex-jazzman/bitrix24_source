import { Popup } from 'main.popup';
import { Event, Tag } from 'main.core';

import './catalog-item-tooltip.css';

const TOOLTIP_OFFSET_LEFT = 10;
const TOOLTIP_WIDTH = 273;
const TOOLTIP_VIEWPORT_MARGIN = 8;
const TOOLTIP_ANGLE_ARROW_CENTER = 15;
const REGISTER_LISTENERS_DELAY = 300;

// @vue/component
export const CatalogItemTooltip = {
	name: 'CatalogItemTooltip',
	props: {
		title: {
			type: String,
			default: '',
		},
		subtitle: {
			type: String,
			default: '',
		},
		delay: {
			type: Number,
			default: 2000,
		},
	},
	data(): Object
	{
		return {
			timeoutId: null,
			listenersTimeoutId: null,
		};
	},
	mounted(): void
	{
		this.subscribeListeners();
	},
	unmounted(): void
	{
		this.unsubscribeListeners();
	},
	methods: {
		subscribeListeners(): void
		{
			this.listenersTimeoutId = setTimeout(() => {
				this.listenersTimeoutId = null;
				Event.bind(this.$refs.tooltip, 'mouseenter', this.show);
				Event.bind(this.$refs.tooltip, 'mouseleave', this.hide);
				Event.bind(this.$refs.tooltip, 'mousedown', this.hide);
			}, REGISTER_LISTENERS_DELAY);
		},
		unsubscribeListeners(): void
		{
			if (this.listenersTimeoutId !== null)
			{
				clearTimeout(this.listenersTimeoutId);
				this.listenersTimeoutId = null;
			}

			if (this.timeoutId !== null)
			{
				clearTimeout(this.timeoutId);
				this.timeoutId = null;
			}

			this.popup?.destroy();
			Event.unbind(this.$refs.tooltip, 'mouseenter', this.show);
			Event.unbind(this.$refs.tooltip, 'mouseleave', this.hide);
			Event.unbind(this.$refs.tooltip, 'mousedown', this.hide);
		},
		async show(): void
		{
			await new Promise((resolve) => {
				this.timeoutId = setTimeout(() => {
					resolve();
					this.timeoutId = null;
				}, this.delay);
			});

			const {
				right = 0,
				y = 0,
			} = this.$refs.tooltip?.getBoundingClientRect() ?? {};
			const { scrollX = 0, scrollY = 0 } = window;

			this.popup?.destroy();
			this.popup = new Popup({
				id: `bx-vue-hint-${Date.now()}`,
				bindElement: {
					left: right + TOOLTIP_OFFSET_LEFT + scrollX,
					top: y + scrollY,
				},
				width: TOOLTIP_WIDTH,
				bindOptions: {
					forceTop: true,
				},
				events: {
					onBeforeAdjustPosition: (event) => {
						const popupHeight = this.popup?.getPopupContainer()?.offsetHeight ?? 0;
						const minTop = window.scrollY + TOOLTIP_VIEWPORT_MARGIN;
						const maxTop = window.scrollY + window.innerHeight - popupHeight - TOOLTIP_VIEWPORT_MARGIN;

						event.top = Math.max(minTop, Math.min(event.top, maxTop));

						const rect = this.$refs.tooltip?.getBoundingClientRect();
						if (rect)
						{
							const elementCenter = rect.top + window.scrollY + rect.height / 2;
							this.popup.setAngle({
								position: 'left',
								offset: elementCenter - event.top - TOOLTIP_ANGLE_ARROW_CENTER,
							});
						}
					},
				},
				content: Tag.render`
					<span class='ui-hint-content'>
						<h4 class="editor-chart-catalog-item-tooltip__title">
							${Tag.safe`${this.title}`}
						</h4>
						<p class="editor-chart-catalog-item-tooltip__subtitle">
							${Tag.safe`${this.subtitle}`}
						</p>
					</span>
				`,
				darkMode: true,
				autoHide: true,
				cacheable: false,
				focusTrap: false,
				fixed: false,
				animation: 'fading',
				className: 'ui-hint-popup editor-chart-catalog-item-tooltip__tooltip-content',
				targetContainer: document.body,
				angle: {
					position: 'left',
				},
			});

			this.popup.show();
		},
		hide(): void
		{
			this.popup?.close();

			if (this.timeoutId !== null)
			{
				clearTimeout(this.timeoutId);
			}
		},
	},
	template: `
		<div
			class="editor-chart-catalog-item-tooltip"
			ref="tooltip"
		>
			<slot/>
		</div>
	`,
};
