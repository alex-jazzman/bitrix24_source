<?php

use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load([
	'ui.sidepanel-content',
]);

/** @var \CMain $APPLICATION */

$APPLICATION->SetTitle($arResult['PAGE_TITLE'] ?? '');
\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();

?>

<div id="stub-not-available"></div>
<script>
	const options = <?= Json::encode([
		'title' => $arResult['STUB_TITLE'] ?? '',
		'desc' => $arResult['STUB_DESC'] ?? '',
		'type' => $arResult['STUB_TYPE'] ?? '',
	]) ?>;
	BX.ready(() => {
		const stub = new BX.UI.Sidepanel.Content.StubNotAvailable(options);
		stub.renderTo(document.getElementById('stub-not-available'));
	});
</script>

