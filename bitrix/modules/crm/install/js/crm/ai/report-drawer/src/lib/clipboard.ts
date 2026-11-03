import { Type } from 'main.core';

// Fallback for browsers/envs that don't support navigator.clipboard.writeText
function copyWithDocument(text: string): boolean
{
	const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	textarea.style.pointerEvents = 'none';

	document.body.append(textarea);
	textarea.select();

	try
	{
		return document.execCommand('copy');
	}
	catch
	{
		return false;
	}
	finally
	{
		textarea.remove();
		if (previousFocus?.isConnected)
		{
			previousFocus.focus({ preventScroll: true });
		}
	}
}

export async function copyToClipboard(text: string): Promise<boolean>
{
	if (!Type.isStringFilled(text))
	{
		return false;
	}

	if (window.isSecureContext && navigator.clipboard?.writeText)
	{
		try
		{
			await navigator.clipboard.writeText(text);

			return true;
		}
		catch
		{
		}
	}

	return copyWithDocument(text);
}
