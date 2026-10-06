import { NameService } from 'crm.ai.name-service';
import { mapActions, mapGetters } from 'ui.vue3.vuex';
import { getTopBX } from '../services/top-window';
import { getAvailabilityReasonText } from '../store/helpers';
import { ScenarioCard } from './scenario-card';

import '../style.css';

const SCENARIOS_HELP_ARTICLE_CODE = '18799442';

// @vue/component
export const Main = {
	name: 'Main',
	components: {
		ScenarioCard,
	},
	computed: {
		...mapGetters([
			'slider',
			'scenariosWithChannelState',
			'expandedScenarioCodes',
			'isLoading',
			'isSaving',
			'isDirty',
			'isSaveDisabled',
			'errorCode',
		]),

		sliderTitle(): string
		{
			return this.getMessage('CRM_AI_SETTINGS_SLIDER_HEADER', NameService.copilotNameReplacement());
		},

		currentLanguageLabel(): string
		{
			const { languageTitle, languageId } = this.slider.header;

			return languageTitle || (languageId ? languageId.toUpperCase() : '');
		},

		categoryName(): string
		{
			return this.slider.scope?.categoryName ?? '';
		},

		languageButtonText(): string
		{
			if (this.currentLanguageLabel)
			{
				return this.getMessage(
					'CRM_AI_SETTINGS_SLIDER_LANGUAGE_BUTTON_SELECTED',
					{ '#LANGUAGE#': this.currentLanguageLabel },
				);
			}

			return this.getMessage('CRM_AI_SETTINGS_SLIDER_LANGUAGE_BUTTON');
		},

		buttonsPanelClass(): Object
		{
			return {
				'ui-button-panel-wrapper': true,
				'ui-pinner': true,
				'ui-pinner-bottom': true,
				'ui-pinner-full-width': true,
				'ui-button-panel-wrapper-hide': !this.isDirty,
			};
		},
	},
	methods: {
		...mapActions([
			'loadSlider',
			'saveSlider',
			'openLanguageSelector',
			'toggleExpandedScenario',
			'setScenarioChannelSelection',
		]),

		getMessage(messageKey, replacements = {}): string
		{
			return this.$Bitrix.Loc.getMessage(messageKey, replacements);
		},

		closeSlider(): void
		{
			getTopBX()?.SidePanel?.Instance?.close();
		},

		openHelp(): void
		{
			getTopBX()?.Helper?.show(`redirect=detail&code=${SCENARIOS_HELP_ARTICLE_CODE}`);
		},

		getErrorMessage(errorCode): string
		{
			return getAvailabilityReasonText(errorCode, this.getMessage.bind(this))
				|| this.getMessage('CRM_AI_SETTINGS_SLIDER_GENERIC_ERROR')
			;
		},
	},
	mounted(): void
	{
		this.loadSlider();
	},
	// language=Vue
	template: `
		<div class="crm-ai-settings-slider ui-sidepanel-layout-content-inner --ui-context-content-light">
			<div v-if="isLoading" class="crm-ai-settings-slider__loader">
				<div class="crm-ai-settings-slider__loader-bar"></div>
			</div>
			<header class="crm-ai-settings-slider__header">
				<div class="crm-ai-settings-slider__heading">
					<div class="crm-ai-settings-slider__title-row">
						<span class="crm-ai-settings-slider__title">
							{{ sliderTitle }}
						</span>
						<span v-if="categoryName" class="crm-ai-settings-slider__category" :title="categoryName">
							<span class="ui-icon-set --o-filter-funnel crm-ai-settings-slider__category-icon"></span>
							<span class="crm-ai-settings-slider__category-name">{{ categoryName }}</span>
						</span>
					</div>
					<div class="crm-ai-settings-slider__subtitle">
						{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_SUBTITLE') }}
					</div>
				</div>
				<div
					v-if="slider.header.isLanguageSelectorAvailable"
					class="crm-ai-settings-slider__language-control"
				>
					<button
						class="ui-btn ui-btn-sm ui-btn-no-caps --air --style-outline ui-btn-dropdown crm-ai-settings-slider__language"
						@click="openLanguageSelector"
					>
						<span class="ui-btn-text">{{ languageButtonText }}</span>
					</button>
				</div>
			</header>
			<div
				v-if="errorCode && errorCode !== 'slider_state_conflict'"
				class="crm-ai-settings-slider__error"
			>
				{{ getErrorMessage(errorCode) }}
			</div>
			<section class="crm-ai-settings-slider__scenarios">
				<div class="crm-ai-settings-slider__card">
					<div class="crm-ai-settings-slider__card-head">
						<span class="crm-ai-settings-slider__card-icon"></span>
						<span class="crm-ai-settings-slider__card-title">
							{{ $Bitrix.Loc.getMessage('CRM_AI_AUTOMATION_SLIDER_SCENARIOS_TITLE') }}
						</span>
						<button
							type="button"
							class="ui-btn ui-btn-sm ui-btn-no-caps --air --style-outline crm-ai-settings-slider__card-help"
							@click="openHelp"
						>
							<span class="ui-btn-text">{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_SCENARIOS_HELP') }}</span>
						</button>
					</div>
					<div class="crm-ai-settings-slider__card-body">
						<ScenarioCard
							v-for="scenario in scenariosWithChannelState"
							:key="scenario.code"
							:scenario="scenario"
							:expanded="expandedScenarioCodes.includes(scenario.code)"
							@toggle-expanded="toggleExpandedScenario"
							@select-channel-mode="setScenarioChannelSelection"
						/>
					</div>
				</div>
			</section>
			<div
				class="crm-ai-settings-slider__footer"
				:class="buttonsPanelClass"
			>
				<div class="ui-button-panel ui-button-panel-align-center">
					<button
						type="button"
						class="ui-btn ui-btn-no-caps ui-btn-lg --air --style-plain"
						@click="closeSlider"
					>
						<span class="ui-btn-text">
							{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_CANCEL_BUTTON') }}
						</span>
					</button>
					<button
						type="button"
						:class="[
							'ui-btn ui-btn-no-caps ui-btn-lg --air --style-filled',
							{ 'ui-btn-wait': isSaving },
						]"
						:disabled="isSaveDisabled"
						@click="saveSlider"
					>
						<span class="ui-btn-text">
							{{ $Bitrix.Loc.getMessage('CRM_AI_SETTINGS_SLIDER_SAVE_BUTTON') }}
						</span>
					</button>
				</div>
			</div>
		</div>
	`,
};
