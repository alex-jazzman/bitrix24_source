import { Event, Type } from 'main.core';

import { Quote } from 'im.v2.lib.quote';
import { Utils } from 'im.v2.lib.utils';
import { MessengerPopup } from 'im.v2.component.elements.popup';

import '../css/quote-button.css';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';
import type { ImModelMessage } from 'im.v2.model';
import type { PopupOptions } from 'main.popup';

const CONTAINER_HEIGHT = 44;
const CONTAINER_WIDTH = 60;

const MESSAGE_TEXT_NODE_CLASS = '.bx-im-message-default-content__text';
const POPUP_ID = 'im-quote-button-popup';

// @vue/component
export const QuoteButton = {
	name: 'QuoteButton',
	components: { MessengerPopup },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		targetPosition: {
			type: Object,
			required: true,
			validator(value: { left: number, top: number }): boolean {
				return Type.isNumber(value.left) && Type.isNumber(value.top);
			},
		},
	},
	data(): JsonObject
	{
		return {
			text: '',
			message: null,
		};
	},
	computed:
	{
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			const { top, left } = this.targetPosition;
			const offsetLeftForCenteredPopup = left - CONTAINER_WIDTH / 2;

			return {
				bindElement: { top, left: offsetLeftForCenteredPopup },
				className: 'bx-im-dialog-chat__quote-button_scope',
				background: 'transparent',
				bindOptions: { position: 'top' },
				animation: 'fading-slide',
				width: CONTAINER_WIDTH,
				height: CONTAINER_HEIGHT,
				autoHide: true,
				padding: 0,
			};
		},
	},
	mounted()
	{
		Event.bind(window, 'mousedown', this.onMouseDown);
	},
	methods:
	{
		onMessageMouseUp(message: ImModelMessage, event: MouseEvent)
		{
			if (event.button === 2)
			{
				return;
			}

			this.prepareSelectedText();
			this.message = message;
		},
		onMouseDown(event: MouseEvent)
		{
			const container = this.$refs.container;
			if (!container || container.contains(event.target))
			{
				return;
			}

			this.$emit('close');
		},
		prepareSelectedText(): string
		{
			if (Utils.browser.isFirefox())
			{
				this.text = window.getSelection().toString();

				return;
			}

			const range = window.getSelection().getRangeAt(0);
			const rangeContents = range.cloneContents();
			let nodesToIterate = rangeContents.childNodes;

			const messageNode = rangeContents.querySelector(MESSAGE_TEXT_NODE_CLASS);
			if (messageNode)
			{
				nodesToIterate = messageNode.childNodes;
			}

			for (const node of nodesToIterate)
			{
				if (this.isImage(node))
				{
					this.text += node.getAttribute('data-code') ?? node.getAttribute('alt');
				}
				else if (this.isLineBreak(node))
				{
					this.text += '\n';
				}
				else
				{
					this.text += node.textContent;
				}
			}
		},
		isImage(node: HTMLElement): boolean
		{
			if (!(node instanceof HTMLElement))
			{
				return false;
			}

			return node.tagName.toLowerCase() === 'img';
		},
		isLineBreak(node: HTMLElement): boolean
		{
			return node.nodeName.toLowerCase() === 'br';
		},
		isText(node: HTMLElement): boolean
		{
			return node.nodeName === '#text';
		},
		onQuoteClick()
		{
			const text = Quote.prepareInlineMessageQuote(this.message, this.text);

			Quote.sendQuoteEvent({
				text,
				dialogId: this.dialogId,
				context: { emitter: this.getEmitter() },
			});

			this.$emit('close');
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<MessengerPopup
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<div ref="container" @click="onQuoteClick" class="bx-im-dialog-chat__quote-button">
				<div class="bx-im-dialog-chat__quote-icon"></div>
				<div class="bx-im-dialog-chat__quote-icon --hover"></div>
			</div>
		</MessengerPopup>
	`,
};
