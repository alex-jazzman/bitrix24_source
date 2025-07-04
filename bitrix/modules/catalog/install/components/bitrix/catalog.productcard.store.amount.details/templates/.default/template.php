<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var \CatalogProductStoreAmountDetailsComponent $component
 * @var \CBitrixComponentTemplate $this
 * @global \CMain $APPLICATION
 * @var array $arParams
 * @var array $arResult
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Toolbar\Facade\Toolbar;

Loader::includeModule('ui');

Extension::load([
	'ui.design-tokens',
	'catalog.access-denied-input',
]);

Toolbar::deleteFavoriteStar();
Toolbar::addFilter($arResult['FILTER_PARAMS']);

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	$arResult['GRID'],
);
?>
<div class="product-stores-amount-details-total-wrapper">
	<div class="product-stores-amount-details-total-container">
		<table class="product-stores-amount-details-total-table">
			<?php if ($arResult['IS_SHOWED_STORE_RESERVE']) : ?>
			<tr class="product-stores-amount-details-total-table-row">
				<td><?=Loc::getMessage('STORE_LIST_DETAILS_TOTAL_AMOUNT')?>:</td>
				<td>
					<span id="<?=$arResult['GRID']['GRID_ID']?>_total_quantity_available" class="total-info"><?=$arResult['TOTAL_DATA']['QUANTITY_AVAILABLE']?></span>
				</td>
			</tr>
			<tr class="product-stores-amount-details-total-table-row">
				<td><?=Loc::getMessage('STORE_LIST_DETAILS_TOTAL_QUANTITY_RESERVED')?>:</td>
				<td>
					<span id="<?=$arResult['GRID']['GRID_ID']?>_total_quantity_reserved" class="total-info"><?=$arResult['TOTAL_DATA']['QUANTITY_RESERVED']?></span>
				</td>
			</tr>
			<?php else : ?>
			<tr class="product-stores-amount-details-total-table-row">
				<td><?=Loc::getMessage('STORE_LIST_DETAILS_TOTAL_QUANTITY_COMMON')?>:</td>
				<td>
					<span id="<?=$arResult['GRID']['GRID_ID']?>_total_quantity_common" class="total-info"><?=$arResult['TOTAL_DATA']['QUANTITY_COMMON']?></span>
				</td>
			</tr>
			<?php endif; ?>

			<?php if ($arResult['ALLOW_PURCHASING_PRICE']): ?>
			<tr class="product-stores-amount-details-total-table-row">
				<td><?=Loc::getMessage('STORE_LIST_DETAILS_TOTAL_PURCHASING_PRICE')?>:</td>
				<td>
					<span id="<?=$arResult['GRID']['GRID_ID']?>_total_price" class="total-info"><?=$arResult['TOTAL_DATA']['PRICE']?></span>
				</td>
			</tr>
			<?php endif; ?>
		</table>
	</div>
</div>
<script>
	BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.ready(function(){
		BX.message(<?=Json::encode(Loc::loadLanguageFile(__FILE__))?>);
		BX.Catalog.StoreAmountDetails.Instance = new BX.Catalog.StoreAmountDetails(<?=Json::encode([
			'gridId' => $arResult['GRID']['GRID_ID'],
			'productId' => $arParams['PRODUCT_ID'],
			'allowPurchasingPrice' => $arResult['ALLOW_PURCHASING_PRICE'],
		])?>);
	});
</script>
