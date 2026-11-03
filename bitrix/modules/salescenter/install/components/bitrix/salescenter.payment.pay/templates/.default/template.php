<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;

Extension::load([
	'ui.design-tokens.air',
	'ui.vue',
	'documentpreview',
	'salescenter.payment-pay.components',
]);

/**
 * @var array $arResult
 * @var array $arParams
 * @global CMain $APPLICATION
 */

// both themes of the component are dark surfaces, so the colour tokens resolve through the context
$themeClasses = $arResult['COMPONENT_THEME'] === ''
	? ''
	: $arResult['COMPONENT_THEME'] . ' --ui-context-content-dark';

if (!empty($arResult['errorMessage']))
{
	require __DIR__ . '/errors.php';
}
elseif (isset($arParams['VIEW_MODE']) && $arParams['VIEW_MODE'] === 'Y')
{
	require __DIR__ . '/pay_system_info.php';
}
elseif ($arResult['PAYMENT']['PAID'] === 'Y' || $arParams['ALLOW_SELECT_PAY_SYSTEM'] !== 'Y')
{
	require __DIR__ . '/payment.php';
}
else
{
	require __DIR__ . '/pay_system.php';
}

