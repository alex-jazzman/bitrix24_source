<?php

use Bitrix\Crm\Integration\Market\Router;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

$isMarketplace = $arResult['priority'] === 'marketplace';
$typeName = $isMarketplace ? 'MARKETPLACE' : 'LICENSE';
$panelLink = $isMarketplace
	? Router::getBasePath()
	: CBitrix24::PATH_LICENSE_ALL . '?analyticsLabel[headerPopup]=Y&analyticsLabel[licenseType]=' . $arResult['licenseType']
; // @todo *automatedsolution

$daysLeft = (int)$arResult['daysLeft'];
if ($daysLeft > 0)
{
	$panelMessage = Loc::getMessagePlural('CRM_AUTOMATED_SOLUTION_' . $typeName . '_NOTIFY_MESSAGE', $daysLeft, ['#COUNT#' => $daysLeft]);
	$panelColor = 'blue';
}
else
{
	$panelMessage = Loc::getMessage('CRM_AUTOMATED_SOLUTION_' . $typeName . '_NOTIFY_NEED_PAY');
	$panelColor = 'red';
}

$jsParams = [
	'panelButtonText' => Loc::getMessage('CRM_AUTOMATED_SOLUTION_' . $typeName . '_NOTIFY_BUY'),
	'panelLink' => $panelLink,
	'panelMessage' => $panelMessage,
	'panelColor' => $panelColor,
	'closeAfter15Seconds' => 'Y',
	'closeCallback' => 'onAutomatedSolutionPanelCallback',
];
?>
<script>
	<?php
	\Bitrix\Main\UI\Extension::load([
		'bitrix24.notify',
		'ui.notification-panel',
		'ui.banner-dispatcher',
	]);
	?>
	BX.ready(() => {
		BX.Event.EventEmitter.subscribe('BX.Bitrix24.NotifyPanel:onAutomatedSolutionPanelCallback', () => {
			BX.userOptions.save('crm', 'automated_solution_imported', 'lastShowDate', (new Date()).getTime());
		});
		(new BX.Bitrix24.NotifyPanel(<?= Json::encode($jsParams)?>)).show();
	});
</script>