<?php

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

Extension::load('crm.settings-hub.application');

$containerId = (string)$arResult['containerId'];
$bootstrap = (array)$arResult['bootstrap'];
?>
<div id="<?= htmlspecialcharsbx($containerId) ?>" class="crm-settings-hub-host"></div>
<script>
	BX.ready(() => {
		const container = document.getElementById('<?= CUtil::JSEscape($containerId) ?>');

		if (container instanceof HTMLElement)
		{
			BX.Crm.SettingsHub.Application.App.start(
				container,
				<?= Json::encode($bootstrap) ?>,
			);
		}
	});
</script>
