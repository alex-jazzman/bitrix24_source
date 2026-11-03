import { Text } from 'main.core';
import { MessageBody } from 'mail.message-body';
import { type PopupOptions } from 'main.popup';
import { TextLg, TextSm } from 'ui.system.typography.vue';
import { defineComponent, markRaw } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';
import { type PreparedTemplate } from '../../model/compose/types';

import './template-preview.css';

const TestId = Object.freeze({
	preview: 'mail-template-preview',
	close: 'mail-template-preview-close',
	retry: 'mail-template-preview-retry',
});

// @vue/component
export const TemplatePreview = defineComponent({
	name: 'MailComposeTemplatePreview',
	components: { Popup, TextLg, TextSm, UiButton },
	props: {
		template: { type: Object, default: null },
		isLoading: { type: Boolean, default: false },
		hasError: { type: Boolean, default: false },
		popupId: { type: String, default: () => `mail-compose-template-preview-${Text.getRandom()}` },
	},
	emits: ['close', 'retry'],
	setup()
	{
		return {
			loc,
			Phrase,
			buttonStyle: AirButtonStyle.OUTLINE,
			buttonSize: ButtonSize.SMALL,
			testId: TestId,
		};
	},
	data(): {
		renderer: MessageBody | null,
		renderedContainer: HTMLElement | null,
		renderedBodyHtml: string | null,
		prefix: string,
		titleId: string,
		}
	{
		return {
			renderer: null,
			renderedContainer: null,
			renderedBodyHtml: null,
			prefix: `mail-template-preview-${Text.getRandom()}`,
			titleId: `mail-template-preview-title-${Text.getRandom()}`,
		};
	},
	computed: {
		options(): PopupOptions
		{
			return {
				targetContainer: document.body,
				closeByEsc: true,
				// The picker restores focus after Vue unmount; the trap may still hold a removed menu row.
				focusTrap: { restoreFocus: false },
				padding: 0,
				ariaLabelledBy: this.titleId,
			};
		},
		preparedTemplate(): PreparedTemplate | null
		{
			return this.template as PreparedTemplate | null;
		},
	},
	mounted(): void
	{
		this.renderBody();
	},
	updated(): void
	{
		this.renderBody();
	},
	beforeUnmount(): void
	{
		this.renderer?.destroy();
	},
	methods: {
		/**
		 * The body belongs to the branch of a ready template, and that branch waits out the loading state,
		 * which ends a step later than the template arrives: asking for the body once the template is there
		 * asks too early. Every update asks again, and the container together with the html it already holds
		 * keeps the frame from being built anew for nothing.
		 */
		renderBody(): void
		{
			const container = this.$refs.body as HTMLElement | undefined;
			const template = this.preparedTemplate;
			if (!container || !template)
			{
				return;
			}

			if (this.renderedContainer === container && this.renderedBodyHtml === template.bodyHtml)
			{
				return;
			}

			this.renderer?.destroy();
			// The renderer keeps its own state in native private fields, which a reactive Proxy has none of.
			this.renderer = markRaw(new MessageBody({ container, messageId: 1, prefix: this.prefix }));
			this.renderer.renderTo(template.bodyHtml);
			this.renderedContainer = container;
			this.renderedBodyHtml = template.bodyHtml;
		},
	},
	template: `
		<Popup :id="popupId" :options="options" @close="$emit('close')">
			<section class="mail-compose-template-preview" :data-testid="testId.preview">
				<header class="mail-compose-template-preview__header">
					<div :id="titleId"><TextLg>{{ loc(Phrase.TemplatePreviewTitle) }}</TextLg></div>
					<UiButton
						:text="loc(Phrase.TemplatePreviewClose)"
						:style="buttonStyle"
						:size="buttonSize"
						:dataset="{ testid: testId.close }"
						@click="$emit('close')"
					/>
				</header>
				<TextSm v-if="isLoading">{{ loc(Phrase.TemplatesLoading) }}</TextSm>
				<div v-else-if="hasError" class="mail-compose-template-preview__state">
					<TextSm>{{ loc(Phrase.TemplatePreviewError) }}</TextSm>
					<UiButton
						:text="loc(Phrase.TemplatesRetry)"
						:style="buttonStyle"
						:size="buttonSize"
						:dataset="{ testid: testId.retry }"
						@click="$emit('retry')"
					/>
				</div>
				<template v-else-if="preparedTemplate">
					<TextLg class="mail-compose-template-preview__subject">{{ preparedTemplate.subject }}</TextLg>
					<div ref="body" class="mail-compose-template-preview__body"></div>
				</template>
			</section>
		</Popup>
	`,
});
