import { highlighter } from 'tasks.v2.lib.highlighter';
import { HeadlineSm, TextMd } from 'ui.system.typography.vue';

import { Hint } from 'tasks.v2.component.elements.hint';

import './files-view-aha.css';

// @vue/component
export const FilesViewAha = {
	components: {
		Hint,
		TextMd,
		HeadlineSm,
	},
	props: {
		isShown: {
			type: Boolean,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			default: () => null,
		},
	},
	emits: ['close', 'visibilityChange'],
	data(): Object
	{
		return {
			visibilityObserver: null,
		};
	},
	watch: {
		bindElement(): void
		{
			this.observeBindElement();
		},
		isShown(isShown: boolean): void
		{
			if (isShown)
			{
				void highlighter.highlight(this.bindElement, 1000);
			}
		},
	},
	mounted(): void
	{
		this.observeBindElement();
	},
	beforeUnmount(): void
	{
		this.disconnectVisibilityObserver();
	},
	methods: {
		observeBindElement(): void
		{
			const wasObserved = this.visibilityObserver !== null;
			this.disconnectVisibilityObserver();

			if (wasObserved)
			{
				this.$emit('visibilityChange', false);
			}

			if (!this.bindElement)
			{
				return;
			}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-io-without-polyfill
			this.visibilityObserver = new IntersectionObserver((entries) => {
				const entry = entries.at(-1);
				this.$emit('visibilityChange', entry?.intersectionRatio === 1);
			}, { rootMargin: '-1px', threshold: [1] });
			this.visibilityObserver.observe(this.bindElement);
		},
		disconnectVisibilityObserver(): void
		{
			this.visibilityObserver?.disconnect();
			this.visibilityObserver = null;
		},
	},
	template: `
		<Hint
			v-if="isShown"
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: 460,
				maxWidth: 460,
				padding: 0,
				offsetLeft: 0,
				angle: { offset: 34 },
			}"
			@close="$emit('close')"
		>
			<div class="tasks-files-view-aha-container">
				<div class="tasks-files-view-aha-icon"/>
				<div class="tasks-files-view-aha-info">
					<HeadlineSm class="tasks-files-view-aha-info-text">
						{{ loc('TASKS_V2_FILES_VIEW_ONBOARDING_TITLE') }}
					</HeadlineSm>
					<TextMd class="tasks-files-view-aha-info-text">
						{{ loc('TASKS_V2_FILES_VIEW_ONBOARDING_TEXT') }}
					</TextMd>
				</div>
			</div>
		</Hint>
	`,
};
