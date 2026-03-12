import { Type } from 'main.core';
import { PopupOptions } from 'main.popup';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Textarea } from 'im.v2.lib.textarea';
import { MessengerPopup } from 'im.v2.component.elements.popup';
import { Quote } from 'im.v2.lib.quote';
import { Analytics } from 'im.v2.lib.analytics';

import { LinkInput } from './components/link-input/link-input';

import './css/format-toolbar.css';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';

type ActionItem = {
	name: string,
	icon: $Values<typeof OutlineIcons>,
	title: string,
	handler: () => void,
};

type SeparatorItem = {
	name: ToolbarItem.separator,
};

type ToolbarItemType = ActionItem | SeparatorItem;

const ToolbarItem = {
	bold: 'bold',
	italic: 'italic',
	underline: 'underline',
	strikethrough: 'strikethrough',
	link: 'link',
	quote: 'quote',
	code: 'code',
	separator: 'separator',
};

const POPUP_ID = 'im-format-toolbar-popup';

// @vue/component
export const FormatToolbar = {
	name: 'FormatToolbar',
	components: { MessengerPopup, LinkInput, BIcon },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		textarea: {
			type: HTMLTextAreaElement,
			required: true,
		},
		targetPosition: {
			type: Object,
			required: true,
			validator(value: { left: number, top: number }): boolean {
				return Type.isNumber(value.left) && Type.isNumber(value.top);
			},
		},
	},
	emits: ['close', 'updateText'],
	data(): JsonObject {
		return {
			linkMode: false,
		};
	},
	computed: {
		POPUP_ID: () => POPUP_ID,
		ToolbarItem: () => ToolbarItem,
		config(): PopupOptions
		{
			return {
				bindElement: this.targetPosition,
				bindOptions: { forceBindPosition: true, position: 'top' },
				autoHide: true,
				padding: 0,
				contentBorderRadius: 12,
			};
		},
		toolbarItems(): ToolbarItemType[]
		{
			return [
				{
					name: ToolbarItem.bold,
					icon: OutlineIcons.BOLD,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_BOLD'),
					handler: () => {
						this.applyDecoration('KeyB');
						Analytics.getInstance().formatToolbar.onBoldClick(this.dialogId);
					},
				},
				{
					name: ToolbarItem.italic,
					icon: OutlineIcons.ITALIC,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_ITALIC'),
					handler: () => {
						this.applyDecoration('KeyI');
						Analytics.getInstance().formatToolbar.onItalicClick(this.dialogId);
					},
				},
				{
					name: ToolbarItem.underline,
					icon: OutlineIcons.UNDERLINE,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_UNDERLINE'),
					handler: () => {
						this.applyDecoration('KeyU');
						Analytics.getInstance().formatToolbar.onUnderlineClick(this.dialogId);
					},
				},
				{
					name: ToolbarItem.strikethrough,
					icon: OutlineIcons.STRIKETHROUGH,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_STRIKETHROUGH'),
					handler: () => {
						this.applyDecoration('KeyS');
						Analytics.getInstance().formatToolbar.onStrikethroughClick(this.dialogId);
					},
				},
				{
					name: ToolbarItem.separator,
				},
				{
					name: ToolbarItem.link,
					icon: OutlineIcons.LINK,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_LINK'),
					handler: () => {
						this.openLinkMode();
						Analytics.getInstance().formatToolbar.onLinkClick(this.dialogId);
					},
				},
				{
					name: ToolbarItem.code,
					icon: OutlineIcons.DEVELOPER_RESOURCES,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_CODE'),
					handler: () => {
						this.applyDecoration('code');
						Analytics.getInstance().formatToolbar.onCodeClick(this.dialogId);
					},
				},
			];
		},
	},
	methods: {
		openLinkMode()
		{
			this.linkMode = true;
		},
		onCloseLinkMode()
		{
			this.linkMode = false;
		},
		applyDecoration(key: string)
		{
			const newText = Textarea.handleDecorationTag(this.textarea, key);
			this.updateText(newText);
		},
		onInsertLink(linkUrl: string)
		{
			const newText = Textarea.addUrlTag(this.textarea, linkUrl);
			this.updateText(newText);
			this.$emit('close');
		},
		insertQuote()
		{
			const newText = Textarea.prepareInlineQuote(this.textarea);

			Quote.sendQuoteEvent({
				text: newText,
				dialogId: this.dialogId,
				context: { emitter: this.getEmitter() },
				additionalParams: { replace: true },
			});
		},
		updateText(newText: string)
		{
			this.$emit('updateText', newText);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<LinkInput v-if="linkMode" @insertLink="onInsertLink" @close="onCloseLinkMode" />
			<div v-else class="bx-im-format-toolbar__container">
				<template v-for="item in toolbarItems">
					<div
						v-if="item.name === ToolbarItem.separator"
						class="bx-im-format-toolbar__separator"
					></div>
					<BIcon
						v-else
						:key="item.name"
						:name="item.icon"
						:title="item.title"
						:hoverableAlt="true"
						class="bx-im-format-toolbar__item"
						@mousedown.prevent
						@click="item.handler"
					/>
				</template>
			</div>
		</MessengerPopup>
	`,
};
