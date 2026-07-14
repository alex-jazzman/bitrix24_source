export async function copyTextToClipboard(text: string): Promise<boolean>
{
	try
	{
		if (navigator?.clipboard?.writeText)
		{
			await navigator.clipboard.writeText(text);

			return true;
		}
	}
	catch
	{
		// fall through to legacy fallback
	}

	try
	{
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'absolute';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);

		return true;
	}
	catch
	{
		return false;
	}
}
