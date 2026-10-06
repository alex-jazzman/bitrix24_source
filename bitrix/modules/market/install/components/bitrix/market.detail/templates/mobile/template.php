<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) {
	die();
}

/**
 * Bitrix vars
 *
 * @var array $arParams
 * @var array $arResult
 * @var string $templateName
 * @var string $templateFile
 * @var string $templateFolder
 * @var string $componentPath
 * @var CBitrixComponent $component
 * @var CBitrixComponentTemplate $this
 * @global CMain $APPLICATION
 * @global CUser $USER
 */

if (!is_array($arResult['APP']) || empty($arResult['APP'])) {
	echo "<div style='margin: 21px 25px 25px 25px;'>" . Loc::getMessage('MARKETPLACE_APP_NOT_FOUND') . "</div>";
	return;
}

$mobileParams = $arParams;
$mobileParams['VIEW_MODE'] = 'mobile';
$mobileParams['HIDE_TOOLBAR'] = 'Y';
$mobileParams['CHANGE_HISTORY'] = 'N';
$mobileParams['MOBILE_PAGE'] = 'detail';

Extension::load('market.mobile');
?>

<div id="market-wrapper-vue"></div>

<script>
	BX.ready(function () {
		const marketDetailData = <?= Json::encode([
			'params' => $mobileParams,
			'result' => $arResult,
		]) ?>;

		new BX.Market.Mobile.Application(marketDetailData);
	});
</script>
