<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Mail\Access\Permission\PermissionDictionary;
use Bitrix\Mail\Helper\MailAccess;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
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

$permissions = [
	'allowedLevels' => (int)MailAccess::getPermissionValue(PermissionDictionary::MAIL_MAILBOX_LIST_ITEM_EDIT),
	'canEditCrmIntegration' => (bool)MailAccess::getPermissionValue(PermissionDictionary::MAIL_MAILBOX_CRM_INTEGRATION_EDIT),
];

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

		const appContainerId = '<?= $massconnectContainerId ?>';
		const permissions = <?= Json::encode($permissions) ?>;
		const isSmtpAvailable = '<?= $arResult['IS_SMTP_AVAILABLE'] ?>';

		const massConnectApp = new BX.Mail.Massconnect.MassconnectForm({
			appContainerId,
			permissions,
			source,
			isSmtpAvailable,
		});

		massConnectApp.start();
	});
</script>
