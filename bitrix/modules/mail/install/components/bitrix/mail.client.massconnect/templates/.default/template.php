<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Mail\Access\Permission\PermissionDictionary;
use Bitrix\Mail\Helper\MailboxAccess;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @var array $arParams */
/** @var array $arResult */
/** @var $APPLICATION */

Extension::load([
	'mail.massconnect-form',
]);

$APPLICATION->SetTitle($arResult['TITLE']);

Toolbar::deleteFavoriteStar();

$massconnectContainerId = 'mail-massconnect-container';

$userAllowedLevel = MailboxAccess::getPermissionValue(PermissionDictionary::MAIL_MAILBOX_LIST_ITEM_EDIT);
?>
<div id="<?= $massconnectContainerId ?>" class="--ui-context-content-light"></div>
<script>
	BX.ready(function()
	{
		let source = null;

		const slider = BX.SidePanel.Instance.getTopSlider();
		if (slider)
		{
			source = slider.getData().get('source') || null;
		}

		const appContainerId = '<?= $massconnectContainerId ?>'
		const allowedLevel = '<?= $userAllowedLevel ?>'
		const isSmtpAvailable = '<?= $arResult['IS_SMTP_AVAILABLE'] ?>';

		const massConnectApp = new BX.Mail.Massconnect.MassconnectForm({
			appContainerId,
			allowedLevel,
			source,
			isSmtpAvailable,
		});

		massConnectApp.start();
	});
</script>
