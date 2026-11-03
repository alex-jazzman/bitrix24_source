<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/**
 * @var array $arResult
 * @var CBitrixComponent $component
 * @global CMain $APPLICATION
 */

Extension::load([
	'crm.deal-category-list',
	'ui.label',
]);

$gridParams = $arResult['grid'];
foreach ($gridParams['ROWS'] as &$row)
{
	if (($row['data']['IS_DEFAULT'] ?? false) !== true)
	{
		continue;
	}

	$row['columns']['NAME'] = htmlspecialcharsbx((string)$row['data']['NAME'])
		. ' <span class="ui-label ui-label-light ui-label-fill">'
		. '<span class="ui-label-inner">'
		. htmlspecialcharsbx(Loc::getMessage('CRM_DEAL_CATEGORY_DEFAULT_BADGE'))
		. '</span>'
		. '</span>'
	;
}
unset($row);

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	$gridParams,
	$component,
);

$options = [
	'gridId' => $arResult['GRID_ID'],
	'openEditId' => $arResult['OPEN_EDIT'] ?? null,
	'categoryCount' => $arResult['CATEGORY_COUNT'],
	'quantityLimit' => $arResult['QUANTITY_LIMIT'],
	'infoHelperId' => $arResult['INFO_HELPER_ID'],
	'actionIds' => [
		'edit' => 'edit',
		'editStages' => 'edit-stages',
		'delete' => 'delete',
	],
];
?>
<script>
	BX.ready(() => {
		BX.Crm.DealCategoryList.init(<?= Json::encode($options) ?>);
	});
</script>
