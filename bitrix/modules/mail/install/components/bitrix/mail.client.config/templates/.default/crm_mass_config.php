<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var CAllMain $APPLICATION */

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

if (!$arParams['CRM_AVAILABLE'])
{
	showError(Loc::getMessage('MAIL_CLIENT_DENIED'));

	return;
}

Extension::load(['mail.connecting.crm-integration', 'mail.grid.mailbox-crm-mass']);

$bodyClass = trim((string)$APPLICATION->GetPageProperty('BodyClass'));
$APPLICATION->SetPageProperty(
	'BodyClass',
	trim($bodyClass . ' no-all-paddings no-background --ui-context-content-light'),
);
\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();

$settingsConfig = $arParams['CRM_SETTINGS_CONFIG'];

$initialData = [
	'mailboxIds' => array_values($arParams['CRM_MASS_MAILBOX_IDS']),
	'settingsConfig' => [
		'crmSyncIntervals' => $settingsConfig['crmSyncIntervals'] ?? [],
		'crmEntities' => $settingsConfig['crmEntities'] ?? [],
		'crmSources' => $settingsConfig['crmSources'] ?? [],
		'defaults' => $settingsConfig['defaults'] ?? [],
		'crmAvailable' => !empty($settingsConfig['crmAvailable']),
		'canEditCrmIntegration' => !empty($settingsConfig['canEditCrmIntegration']),
	],
];

$initialData = Json::encode($initialData);

$buttons = [];
if (!empty($arParams['CAN_EDIT_CRM_INTEGRATION']))
{
	$buttons[] = [
		'TYPE' => 'apply',
		'ID' => 'mail-crm-mass-apply',
	];
}
$buttons[] = ['TYPE' => 'cancel'];
?>

<div id="mail-mailbox-crm-mass-config-container" data-testid="mail-crm-mass-config-container"></div>

<script>
	BX.ready(function()
	{
		var initialData = <?= $initialData ?>;
		var form = new BX.Mail.Grid.MailboxCrmMass.CrmMassConfigForm({
			containerId: 'mail-mailbox-crm-mass-config-container',
			initialData: initialData,
		});
		form.start();
	});
</script>

<?php $APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'BUTTONS' => $buttons,
	'ALIGN' => 'right',
]); ?>
