<?php

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 * @var array $arResult
 * @var string $cartId
 */

$compositeStub = ($arResult['COMPOSITE_STUB'] ?? 'N') === 'Y';
if ($arResult['NUM_PRODUCTS'] > 0)
{
	$showCounter =
		!$compositeStub
		&& $arParams['SHOW_NUM_PRODUCTS'] === 'Y'
		&& ($arResult['NUM_PRODUCTS'] > 0 || $arParams['SHOW_EMPTY_VALUES'] === 'Y')
	;
	$cartLabel =
		$showCounter
			? Loc::getMessage('TSB1_CART_ARIA', ['#COUNT#' => $arResult['BASKET_COUNT_DESCRIPTION']])
			: Loc::getMessage('TSB1_CART')
	;
	?>
	<a
		href="<?=$arParams['PATH_TO_BASKET']?>"
		class="catalog-cart-block<?=$showCounter ? ' catalog-cart-block--with-counter' : ''?>"
		aria-label="<?=htmlspecialcharsbx($cartLabel)?>"
	>
		<?php
		if ($showCounter)
		{
			?><span class="catalog-cart-counter" aria-hidden="true"><?=$arResult['NUM_PRODUCTS']?></span><?php
		}
		?>
	</a>
	<?php
}

if (!$compositeStub)
{
	?>
	<span
		class="catalog-cart-announce"
		hidden
		data-basket-announce="<?=htmlspecialcharsbx($arResult['PRODUCTS'])?>"
	></span>
	<?php
}