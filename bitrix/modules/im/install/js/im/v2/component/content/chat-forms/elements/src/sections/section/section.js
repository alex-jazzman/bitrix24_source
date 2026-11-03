import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextMd } from 'ui.system.typography.vue';

import 'ui.design-tokens.air';
import 'ui.icon-set.outline';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { ExpandAnimation } from 'im.v2.component.animation';

import './css/section.css';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;
const CHEVRON_SIZE = 26;

// Glyph of every section the forms use, so the sections themselves pass nothing but their name.
// The settings glyph comes from the project wizard, the rights one keeps the lock of the legacy
// section, and conference keeps the camera of its menu item.
const IconBySectionName = {
	settings: Outline.FILTER_2_LINES,
	rights: Outline.LOCK_L,
	conference: Outline.RECORD_VIDEO,
};

// @vue/component
export const CreateChatSection = {
	name: 'CreateChatSection',
	components: { ExpandAnimation, BIcon, TextMd },
	props: {
		name: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		alwaysOpened: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return { Outline, ICON_SIZE, CHEVRON_SIZE };
	},
	data(): JsonObject
	{
		return {
			isOpened: false,
		};
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		containerClasses(): string[]
		{
			return [`--${this.name}`, { '--active': this.isOpened }];
		},
		// The line above the content separates it from the head that revealed it, so a section
		// without a head button has nothing to be separated from.
		contentClasses(): JsonObject
		{
			return { '--divided': this.isAirDesignEnabled && !this.alwaysOpened };
		},
		sectionIcon(): ?string
		{
			return IconBySectionName[this.name] ?? null;
		},
		testId(): string
		{
			return `im-chat-form-section-${this.name}`;
		},
		headerTestId(): string
		{
			return `${this.testId}-header`;
		},
		contentId(): string
		{
			return `${this.testId}-content`;
		},
		// A section that never folds has nothing to operate, so its header stays a plain
		// container instead of a button stuck in the expanded state.
		headerTag(): string
		{
			return this.alwaysOpened ? 'div' : 'button';
		},
		headerAttributes(): JsonObject
		{
			if (this.alwaysOpened)
			{
				return {};
			}

			return {
				type: 'button',
				'aria-expanded': this.isOpened ? 'true' : 'false',
				'aria-controls': this.contentId,
			};
		},
	},
	created()
	{
		if (this.alwaysOpened)
		{
			this.isOpened = true;
		}
	},
	methods:
	{
		onHeaderClick()
		{
			if (this.alwaysOpened)
			{
				return;
			}
			this.isOpened = !this.isOpened;
		},
	},
	template: `
		<div
			:class="containerClasses"
			class="bx-im-content-create-chat__section bx-im-content-create-chat__section_scope"
			:data-testid="testId"
		>
			<component
				v-if="isAirDesignEnabled"
				:is="headerTag"
				v-bind="headerAttributes"
				class="bx-im-chat-forms-section__header"
				:data-testid="headerTestId"
				@click="onHeaderClick"
			>
				<span class="bx-im-chat-forms-section__title">
					<BIcon
						v-if="sectionIcon"
						class="bx-im-chat-forms-section__icon"
						:name="sectionIcon"
						:size="ICON_SIZE"
						color="var(--ui-color-base-4)"
					/>
					<TextMd tag="span">{{ title }}</TextMd>
				</span>
				<BIcon
					v-if="!alwaysOpened"
					class="bx-im-chat-forms-section__chevron"
					:name="Outline.CHEVRON_DOWN_L"
					:size="CHEVRON_SIZE"
					color="var(--ui-color-base-4)"
				/>
			</component>
			<div
				v-else
				class="bx-im-content-create-chat__section_header"
				:data-testid="headerTestId"
				@click="onHeaderClick"
			>
				<div class="bx-im-content-create-chat__section_left">
					<div class="bx-im-content-create-chat__section_icon"></div>
					<div class="bx-im-content-create-chat__section_text">{{ title }}</div>
				</div>
				<div v-if="!alwaysOpened" class="bx-im-content-create-chat__section_right"></div>
			</div>
			<ExpandAnimation>
				<div v-if="isOpened" :id="contentId" class="bx-im-content-create-chat__section_content_container">
					<div class="bx-im-content-create-chat__section_content" :class="contentClasses">
						<slot></slot>
					</div>
				</div>
			</ExpandAnimation>
		</div>
	`,
};
