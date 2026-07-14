import { Type, Loc, Dom } from 'main.core';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';

import { notify } from '../../utils/notify';

const COPY_SUCCESS_TIMEOUT = 2000;

// @vue/component
export const AccessCopyLink = {
	name: 'AccessCopyLink',
	components: { UiButton },
	props: {
		link: { type: String, default: '' },
	},
	data()
	{
		return {
			isCopying: false,
			isCopied: false,
			resetCopiedStateTimeout: null,
		};
	},
	computed: {
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		Outline: () => Outline,
		buttonText()
		{
			return this.isCopied
				? Loc.getMessage('DISK_SHARING_ACCESS_POPUP_COPY_LINK_BUTTON_SUCCESS')
				: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_COPY_LINK_BUTTON');
		},
		buttonStyle()
		{
			return this.isCopied
				? AirButtonStyle.FILLED_SUCCESS
				: AirButtonStyle.FILLED;
		},
		toggleIcon()
		{
			if (this.isCopied)
			{
				return Outline.CHECK_M;
			}

			return Outline.LINK;
		},
	},
	beforeUnmount()
	{
		clearTimeout(this.resetCopiedStateTimeout);
	},
	methods: {
		async onClick()
		{
			if (this.isCopying)
			{
				return;
			}

			this.isCopying = true;

			try
			{
				await this.copyToClipboard(this.link);
				this.setCopiedState();
			}
			catch (error)
			{
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_COPY_ERROR_MESSAGE');
				console.error('AccessCopyLink: copy failed', error);
			}
			finally
			{
				this.isCopying = false;
			}
		},
		setCopiedState()
		{
			this.isCopied = true;
			clearTimeout(this.resetCopiedStateTimeout);

			this.resetCopiedStateTimeout = setTimeout(() => {
				this.isCopied = false;
				this.resetCopiedStateTimeout = null;
			}, COPY_SUCCESS_TIMEOUT);
		},
		async copyToClipboard(textToCopy)
		{
			if (!Type.isStringFilled(textToCopy))
			{
				throw new Error('Link is empty');
			}

			let clipboardError = null;

			if (window.isSecureContext && navigator.clipboard?.writeText)
			{
				try
				{
					await navigator.clipboard.writeText(textToCopy);

					return;
				}
				catch (error)
				{
					clipboardError = error;
				}
			}

			try
			{
				this.copyToClipboardFallback(textToCopy);
			}
			catch (error)
			{
				throw clipboardError ?? error;
			}
		},
		copyToClipboardFallback(textToCopy)
		{
			const textArea = document.createElement('textarea');
			const activeElement = document.activeElement;
			const selection = window.getSelection();
			const range = selection && selection.rangeCount > 0
				? selection.getRangeAt(0)
				: null;

			textArea.value = textToCopy;
			textArea.setAttribute('readonly', '');
			Dom.style(textArea, 'position', 'fixed');
			Dom.style(textArea, 'top', '-9999px');
			Dom.style(textArea, 'left', '-9999px');
			Dom.style(textArea, 'opacity', '0');

			Dom.append(textArea, document.body);
			textArea.focus();
			textArea.select();
			textArea.setSelectionRange(0, textArea.value.length);

			let isCopied = false;

			try
			{
				isCopied = document.execCommand('copy');
			}
			finally
			{
				Dom.remove(textArea);

				if (selection)
				{
					selection.removeAllRanges();

					if (range)
					{
						selection.addRange(range);
					}
				}

				if (activeElement instanceof HTMLElement)
				{
					activeElement.focus();
				}
			}

			if (!isCopied)
			{
				throw new Error('Fallback copy failed');
			}
		},
	},
	template: `
		<UiButton
			:text="buttonText"
			:leftIcon="toggleIcon"
			:size="ButtonSize.MEDIUM"
			:style="buttonStyle"
			:loading="isCopying"
			@click="onClick"
		/>
	`,
};
