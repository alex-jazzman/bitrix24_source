<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Copying of the public address into the clipboard, shared by the file and folder pages: both offer
 * the same action and confirm it with the same notification.
 *
 * @var string $copyLinkButtonId  id of the button the page rendered for it
 * @var string $copyLinkUrl       address that goes to the clipboard
 * @var CDiskExternalLinkComponent $component
 */
?>
<script>
	BX.ready(function() {
		const button = BX('<?= CUtil::JSEscape($copyLinkButtonId) ?>');
		if (!button)
		{
			return;
		}

		const link = '<?= CUtil::JSEscape($copyLinkUrl) ?>';
		const confirmCopy = function() {
			BX.UI.Notification.Center.notify({
				content: '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_LINK_COPIED')) ?>',
				useAirDesign: true,
			});
		};

		button.addEventListener('click', function() {
			// The clipboard API is unavailable over plain http, where the page is still served.
			if (navigator.clipboard && window.isSecureContext)
			{
				navigator.clipboard.writeText(link).then(confirmCopy);
			}
			else if (BX.clipboard && BX.clipboard.copy(link))
			{
				confirmCopy();
			}
		});
	});
</script>
