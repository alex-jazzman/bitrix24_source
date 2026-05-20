<?php

use Bitrix\Landing\Vibe\Integration\Intranet\Settings\VibeSettingsPageProvider;
use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var LandingMainpageSettingsComponent $component */
/** @var array $arResult */
/** @var array $arParams */
/** @var string $templateFolder */

$containerId = (string)($arResult['CONTAINER_ID'] ?? '');
$dataJson = (string)($arResult['VIBES_DATA_JSON'] ?? '{"vibes":[]}');

$settingsProvider = new VibeSettingsPageProvider();
Extension::load($settingsProvider->getJsExtensions());

?>
<div id="<?= htmlspecialcharsbx($containerId) ?>"></div>
<script>
	BX.ready(function ()
	{
		const options = {
			data: <?= $dataJson ?>,
			contentNode: BX('<?= \CUtil::JSEscape($containerId) ?>'),
		};
		const page = new BX.Landing.Vibe.SettingsPage(options);
		page.render();
	});
</script>
