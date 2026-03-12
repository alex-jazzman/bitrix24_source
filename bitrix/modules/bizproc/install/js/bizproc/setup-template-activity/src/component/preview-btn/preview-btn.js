import 'main.polyfill.intersectionobserver';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import { getScrollParent } from '../../utils';
import './preview-btn.css';

// @vue/component
export const PreviewBtn = {
	name: 'PreviewBtn',
	components: {
		BIcon,
	},
	props: {
		showPreview: {
			type: Boolean,
			default: false,
		},
	},
	data(): { isFixed: boolean, containerWidth: string, containerTop: string }
	{
		return {
			isFixed: false,
			containerWidth: 'auto',
			containerTop: '0px',
		};
	},
	computed: {
		icon(): string
		{
			return this.showPreview
				? Outline.CROSSED_EYE
				: Outline.OBSERVER;
		},
		label(): string
		{
			return this.showPreview
				? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_HIDE_PREVIEW_BTN_TEXT')
				: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_SHOW_PREVIEW_BTN_TEXT');
		},
	},
	mounted(): void
	{
		this.initObserver();
	},
	beforeUnmount(): void
	{
		this.observer?.disconnect();
	},
	methods: {
		updatePosition(scrollContainer: HTMLElement): void
		{
			if (this.$el && scrollContainer)
			{
				const rect = scrollContainer.getBoundingClientRect();
				this.containerTop = `${rect.top}px`;
				this.containerWidth = `${scrollContainer.offsetWidth}px`;
			}
		},
		initObserver(): void
		{
			const scrollContainer = getScrollParent(this.$el);

			if (!scrollContainer)
			{
				return;
			}

			this.observer = new IntersectionObserver(
				([entry]) => {
					const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
					this.isFixed = entry.boundingClientRect.top <= rootTop;

					if (this.isFixed)
					{
						this.updatePosition(scrollContainer);
					}
				},
				{
					root: scrollContainer,
					threshold: [1],
					rootMargin: '0px',
				},
			);

			this.observer.observe(this.$el);
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-preview-btn-container">
			<div
				class="bizproc-setuptemplateactivity-preview-btn-wrapper"
				:class="{ '--fixed': isFixed }"
				:style="isFixed ? { width: containerWidth, top: containerTop } : {}"
			>
				<button
					class="bizproc-setuptemplateactivity-preview-btn"
					type="button"
				>
					<BIcon
						:name="icon"
						:size="24"
						class="bizproc-setuptemplateactivity-preview-btn__icon"
					/>
					<span class="bizproc-setuptemplateactivity-preview-btn__label">
						{{ label }}
					</span>
				</button>
			</div>
		</div>
	`,
};
