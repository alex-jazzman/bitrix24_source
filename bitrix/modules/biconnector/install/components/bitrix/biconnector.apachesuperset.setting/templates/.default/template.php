<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var string $templateFolder
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Loader::includeModule('biconnector');
Loader::includeModule('ui');

if (!empty($arResult['errorMessages']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.info.error',
		'',
		[
			'TITLE' => $arResult['errorMessages'][0],
		]
	);

	if (($arResult['featureAvailable'] ?? null) === false)
	{
		echo '<script>top.BX.UI.InfoHelper.show("limit_crm_BI_analytics")</script>';
	}

	return;
}

Extension::load([
	'biconnector.settings-panel',
]);

\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();
$APPLICATION->SetTitle($arResult['title']);
?>

<style>html { overflow-y: scroll; }</style>
<div id="biconnector-settings-panel-root"></div>

<script>
	BX.ready(function() {
		const cardsData = <?= Json::encode($arResult['cardsData']) ?>;
		const componentName = <?= Json::encode($arResult['componentName']) ?>;
		const signedParameters = <?= Json::encode($arResult['signedParameters']) ?>;
		const collapsedState = <?= Json::encode((object)$arResult['collapsedState']) ?>;
		const cardOptions = (id) => ({ collapsed: collapsedState[id] === true });
		const cards = [];

		if (cardsData.periodFilter)
		{
			cards.push(
				new BX.BIConnector.PeriodFilterCard(cardsData.periodFilter, componentName, signedParameters, cardOptions('period-filter'))
			);
		}

		if (cardsData.languageTimezone)
		{
			cards.push(
				new BX.BIConnector.LanguageTimezoneCard(cardsData.languageTimezone, componentName, signedParameters, cardOptions('language-timezone'))
			);
		}

		if (cardsData.clearCache)
		{
			cards.push(
				new BX.BIConnector.ClearCacheCard(cardsData.clearCache, cardOptions('clear-cache'))
			);
		}

		if (cardsData.datasetTyping)
		{
			cards.push(
				new BX.BIConnector.DatasetTypingCard(cardsData.datasetTyping, componentName, signedParameters, cardOptions('dataset-typing'))
			);
		}

		if (cardsData.encryptionKey)
		{
			cards.push(
				new BX.BIConnector.EncryptionKeyCard(cardsData.encryptionKey, componentName, signedParameters, cardOptions('encryption-key'))
			);
		}

		new BX.BIConnector.SettingsPanel({
			container: document.getElementById('biconnector-settings-panel-root'),
			cards: cards,
		}).render();
	});
</script>
