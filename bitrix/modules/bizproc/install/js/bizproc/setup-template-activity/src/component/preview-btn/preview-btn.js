import { Event, Dom } from 'main.core';
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
	data(): { isFixed: boolean, fixedStyle: Object }
	{
		return {
			isFixed: false,
			fixedStyle: {},
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
		this.scrollContainer = getScrollParent(this.$el);

		if (!this.scrollContainer)
		{
			return;
		}

		Dom.style(this.$el, 'minHeight', `${this.$el.offsetHeight}px`);
		Event.bind(this.scrollContainer, 'scroll', this.handleScroll, { passive: true });
	},
	beforeUnmount(): void
	{
		Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
	},
	methods: {
		handleScroll(): void
		{
			if (this.isFixed && this.scrollContainer.scrollTop < this.fixScrollTop)
			{
				this.isFixed = false;
			}

			if (this.isFixed)
			{
				return;
			}

			const elRect = this.$el.getBoundingClientRect();
			const containerRect = this.scrollContainer.getBoundingClientRect();

			if (elRect.top <= containerRect.top)
			{
				this.fixScrollTop = this.scrollContainer.scrollTop;
				this.isFixed = true;
				this.fixedStyle = {
					top: `${containerRect.top}px`,
					width: `${this.scrollContainer.offsetWidth}px`,
				};
			}
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-preview-btn-container">
			<div
				class="bizproc-setuptemplateactivity-preview-btn-wrapper"
				:class="{ '--fixed': isFixed }"
				:style="isFixed ? fixedStyle : {}"
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
