<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Grid\Panel\DefaultValue;
use Bitrix\Main\Text\HtmlFilter;

/** @var array $arResult */
/** @var CBitrixComponent $component */
global $APPLICATION;

$controllerOptions = [
	'gridId' => $arResult['gridId'],
	'addUrl' => $arResult['addUrl'],
	'editUrlTemplate' => $arResult['editUrlTemplate'],
	'batchController' => $arResult['batchController'],
	'batchStorageKey' => $arResult['batchStorageKey'],
	'canEdit' => $arResult['canEdit'],
	'canDelete' => $arResult['canDelete'],
];

foreach ($arResult['ACTION_PANEL']['GROUPS'] ?? [] as &$group)
{
	foreach ($group['ITEMS'] ?? [] as &$item)
	{
		if (($item['ID'] ?? null) === DefaultValue::REMOVE_BUTTON_ID)
		{
			$item['TEXT'] = sprintf(
				'<span data-testid="crm-currency-list-group-delete">%s</span>',
				HtmlFilter::encode((string)($item['TEXT'] ?? '')),
			);
		}
	}
	unset($item);
}
unset($group);
?>
<div data-testid="crm-currency-list-root">
	<div data-testid="crm-currency-list-grid">
		<?php
		$APPLICATION->IncludeComponent(
			'bitrix:main.ui.grid',
			'',
			$arResult,
			$component,
		);
		?>
	</div>
</div>
<script>
	BX.ready(() => {
		BX.Crm.CurrencyList.create(<?= CUtil::PhpToJSObject($controllerOptions) ?>);
	});
</script>
