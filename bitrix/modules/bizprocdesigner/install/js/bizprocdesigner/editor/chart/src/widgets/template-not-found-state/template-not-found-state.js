import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { HeadlineMd, TextLg } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { CircuitBackdrop } from '../../shared/ui';
import { getBackToListUrl, getCreateTemplateUrl } from '../../shared/utils';

import './style.css';

// @vue/component
export const TemplateNotFoundState = {
	name: 'TemplateNotFoundState',
	components: {
		CircuitBackdrop,
		HeadlineMd,
		TextLg,
		UiButton,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
			// window.location is not reactive, so both links are read once, at creation
			createTemplateUrl: getCreateTemplateUrl(),
			backToListUrl: getBackToListUrl(),
		};
	},
	computed: {
		title(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_NOT_FOUND_STATE_TITLE');
		},
		description(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_NOT_FOUND_STATE_DESCRIPTION_MSGVER_1');
		},
		createButtonText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_NOT_FOUND_STATE_CREATE_BUTTON');
		},
		backButtonText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_NOT_FOUND_STATE_BACK_BUTTON');
		},
	},
	template: `
		<div
			class="bizprocdesigner-template-not-found-state"
			:data-test-id="$testId('templateNotFoundState')"
		>
			<div class="bizprocdesigner-template-not-found-state__backdrop">
				<CircuitBackdrop />
			</div>
			<div class="bizprocdesigner-template-not-found-state__content">
				<div class="bizprocdesigner-template-not-found-state__text">
					<HeadlineMd
						tag="h1"
						align="center"
						:className="'bizprocdesigner-template-not-found-state__title'"
					>
						{{ title }}
					</HeadlineMd>
					<TextLg
						align="center"
						:className="'bizprocdesigner-template-not-found-state__description'"
					>
						{{ description }}
					</TextLg>
				</div>
				<div class="bizprocdesigner-template-not-found-state__actions">
					<UiButton
						:text="backButtonText"
						:link="backToListUrl"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.FILLED"
						:dataset="{ testId: $testId('templateNotFoundBackButton') }"
					/>
					<UiButton
						:text="createButtonText"
						:link="createTemplateUrl"
						:leftIcon="Outline.PLUS_M"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						:dataset="{ testId: $testId('templateNotFoundCreateButton') }"
					/>
				</div>
			</div>
		</div>
	`,
};
