import { Text } from 'main.core';

import { Logger } from 'im.v2.lib.logger';
import { KeyboardButtonDisplay, ColorToken } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';

import type { JsonObject } from 'main.core';
import type { KeyboardButtonConfig } from 'im.v2.const';

type ButtonStyle = {
	width?: string,
	backgroundColor?: string
};

// @vue/component
export const KeyboardButton = {
	name: 'KeyboardButton',
	props:
	{
		config: {
			type: Object,
			required: true,
		},
		keyboardBlocked: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['action', 'customCommand', 'blockKeyboard'],
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		button(): KeyboardButtonConfig
		{
			return this.config;
		},
		commonAttributes(): { class: string[], style: ButtonStyle }
		{
			return {
				class: ['bx-im-keyboard-button__container', this.buttonClasses],
				style: this.buttonStyles,
			};
		},
		buttonClasses(): string[]
		{
			const { bgColorToken = ColorToken.base, display, disabled, wait } = this.button;
			const displayClass = display === KeyboardButtonDisplay.block ? '--block' : '--line';
			const classes = [displayClass, bgColorToken];
			if (this.keyboardBlocked || disabled)
			{
				classes.push('--disabled');
			}

			if (wait)
			{
				classes.push('--loading');
			}

			return classes;
		},
		buttonStyles(): ButtonStyle
		{
			const styles = {};
			const { width } = this.button;
			if (width)
			{
				styles.width = `${width}px`;
			}

			return styles;
		},
		preparedLink(): string
		{
			if (!this.button.link)
			{
				return '';
			}

			return Text.decode(this.button.link);
		},
	},
	methods:
	{
		onClick(event: PointerEvent)
		{
			if (this.keyboardBlocked || this.button.disabled || this.button.wait)
			{
				event.preventDefault();

				return;
			}

			// proceed with native link handling
			if (this.button.link)
			{
				return;
			}

			if (this.button.action && this.button.actionValue)
			{
				this.handleAction();
			}
			else if (this.button.appId)
			{
				Logger.warn('Messenger keyboard: open app is not implemented.');
			}
			else if (this.button.command)
			{
				this.handleCustomCommand();
			}
		},
		handleAction()
		{
			this.$emit('action', {
				action: this.button.action,
				payload: this.button.actionValue,
			});
		},
		handleCustomCommand()
		{
			if (this.button.block)
			{
				this.$emit('blockKeyboard');
			}

			this.button.wait = true;

			this.$emit('customCommand', {
				botId: this.button.botId,
				command: this.button.command,
				payload: this.button.commandParams,
			});
		},
	},
	template: `
		<a
			v-if="button.link"
			:href="preparedLink"
			target="_blank"
			v-bind="commonAttributes"
			@click="onClick"
		>
			{{ button.text }}
		</a>
		<div
			v-else
			v-bind="commonAttributes"
			@click="onClick"
		>
			{{ button.text }}
		</div>
	`,
};
