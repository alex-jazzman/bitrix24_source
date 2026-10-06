import { Dom, Event } from 'main.core';
import { FocusMonitor } from 'ui.a11y';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiGrowingTextArea } from 'socialnetwork.v2.components.elements.ui-growing-text-area';
import { UiHint } from 'socialnetwork.v2.components.elements.ui-hint';

import './title.css';

// @vue/component
export const ProjectWizardTitle = {
	name: 'ProjectWizardTitle',
	components: {
		UiGrowingTextArea,
		UiHint,
	},
	data(): Object
	{
		return {
			isPopupShown: false,
			keyboardFocus: false,
		};
	},
	computed: {
		...mapWritableState(useProjectStore, ['title']),
		...mapState(useInterfaceStore, {
			validation: 'wizardValidation',
		}),
		hintText(): string
		{
			if (this.validation.title.required)
			{
				return this.loc('SONET_EXT_PROJECT_WIZARD_TITLE_REQUIRED_ERROR_MSG');
			}

			if (this.validation.title.uniq)
			{
				return this.loc('SONET_EXT_PROJECT_WIZARD_TITLE_UNIQ_ERROR_MSG');
			}

			return '';
		},
	},
	watch: {
		validation: {
			handler(validation)
			{
				if (validation.invalid && validation.title.invalid)
				{
					void this.highlightTitle();
				}
			},
			deep: true,
		},
	},
	methods: {
		...mapActions(useInterfaceStore, ['setValidation']),
		onFieldFocus(): void
		{
			this.keyboardFocus = FocusMonitor.Instance.getModalityTracker().getLastNavigationKey() === 'Tab';
		},
		onFieldBlur(): void
		{
			this.keyboardFocus = false;
		},
		async highlightTitle(): void
		{
			await this.delay();

			const cancelHighlight = () => {
				Event.unbind(window, 'click', cancelHighlight);
				Event.unbind(window, 'keydown', cancelHighlight);
				this.removeHighlight();
			};

			Event.bind(window, 'click', cancelHighlight);
			Event.bind(window, 'keydown', cancelHighlight);

			this.$refs.growing?.$el?.querySelector('textarea')?.focus();
			this.isPopupShown = true;
			this.scrollToField();
		},
		removeHighlight(): void
		{
			this.setValidation('title', {
				required: false,
				uniq: false,
			});
			this.isPopupShown = false;
		},
		delay(): Promise<void>
		{
			return new Promise((resolve) => {
				setTimeout(resolve, 0);
			});
		},
		scrollToField(): void
		{
			Dom.style(this.$refs.wrapper, 'scrollMarginTop', '100px');

			this.$refs.wrapper.scrollIntoView({
				block: 'start',
				behavior: 'smooth',
			});

			setTimeout(() => {
				Dom.style(this.$refs.wrapper, 'scrollMarginTop', null);
			}, 1000);
		},
	},
	template: `
		<div
			ref="wrapper"
			:class="[
				'socialnetwork--project-title-wrapper',
				{
					'--keyboard-focus': keyboardFocus,
						'socialnetwork--project--field-highlight': validation.title.invalid,
					'socialnetwork--project--field-highlight__error': validation.title.uniq,
				}
			]"
		>
			<UiGrowingTextArea
				v-model="title"
				ref="growing"
				:fontSize="25"
				class="socialnetwork--project-title"
				:placeholder="loc('SONET_EXT_PROJECT_WIZARD_TITLE_PLACEHOLDER')"
					@focus="onFieldFocus"
					@blur="onFieldBlur"
			/>
		</div>
		<UiHint
			v-if="isPopupShown"
			:bindElement="$refs.wrapper"
			:options="{ offsetTop: 3 }"
			@close="isPopupShown = false"
		>
			{{ hintText }}
		</UiHint>
	`,
};
