<?php

use Bitrix\Mail\Helper\Config\Feature;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}
\Bitrix\Main\UI\Extension::load([
	'ui.sidepanel-content',
	'ui.buttons',
]);

if (Feature::isMailboxConnectionRequestAvailable())
{
	\Bitrix\Main\UI\Extension::load('mail.client.dialog.mailbox-connection-request');
}

/** @var \CMain $APPLICATION */
/** @var array $arParams */
$APPLICATION->SetTitle('');
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background');
\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();
?>

<div class="mail-client-config-connect-access-denied-slider-wrapper --ui-context-content-light">
	<div class="mail-client-config-connect-access-denied-slider-icon"></div>
	<div class="mail-client-config-connect-access-denied-slider-text-container">
		<div class="mail-client-config-connect-access-denied-slider-text">
			<?= htmlspecialcharsbx(Loc::getMessage('MAIL_CLIENT_CONFIG_CONNECT_ACCESS_DENIED_TITLE')) ?>
		</div>
			<div class="mail-client-config-connect-access-denied-slider-text">
				<?= htmlspecialcharsbx(Loc::getMessage('MAIL_CLIENT_CONFIG_CONNECT_ACCESS_DENIED_SUB_TITLE')) ?>
			</div>
		</div>
		<?php if (Feature::isMailboxConnectionRequestAvailable()): ?>
			<div id="mail-access-denied-request-button-container"></div>
		<?php endif; ?>
	</div>
	<?php if (Feature::isMailboxConnectionRequestAvailable()): ?>
		<script>
			BX.ready(function() {
				const button = new BX.UI.Button({
					text: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_CLIENT_CONFIG_CONNECT_ACCESS_DENIED_REQUEST_BUTTON')) ?>',
					useAirDesign: true,
					onclick: function() {
						new BX.Mail.Client.Dialog.MailboxConnectionRequest().show();
					},
				});
				button.renderTo(document.getElementById('mail-access-denied-request-button-container'));
			});
		</script>
	<?php endif; ?>
