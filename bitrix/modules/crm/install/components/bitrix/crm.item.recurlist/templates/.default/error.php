<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$isSmartInvoices = $arResult['entityTypeId'] === CCrmOwnerType::SmartInvoice;
$code = $isSmartInvoices ? 'CRM_ITEM_RECURLIST_ERROR_TITLE_INVOICE' : 'CRM_ITEM_RECURLIST_ERROR_TITLE';

$APPLICATION->IncludeComponent(
	'bitrix:ui.info.error',
	'',
	[
		'TITLE' => Loc::getMessage($code),
	],
);
