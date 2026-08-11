<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 * @var array $arResult
 * @var \CBitrixComponentTemplate $this
 * @global \CMain $APPLICATION
 * @global \CUser $USER
 * @global \CDatabase $DB
 */
define('NO_KEEP_STATISTIC', 'Y');
define('NO_AGENT_STATISTIC', 'Y');
define('NO_AGENT_CHECK', true);
define('DisableEventsCheck', true);

Header('Content-Type: text/csv');
Header('Content-Disposition: attachment;filename=crm_items.csv');
Header('Content-Type: application/octet-stream');
Header('Content-Transfer-Encoding: binary');

$showProductRows = !empty($arResult['EXPORT_PRODUCT_FIELDS']);
$productColumnId = \Bitrix\Crm\Item::FIELD_NAME_PRODUCTS . '.PRODUCT_ID';
$opportunityField = \Bitrix\Crm\Item::FIELD_NAME_OPPORTUNITY;
$opportunityWithCurrencyField = 'OPPORTUNITY_WITH_CURRENCY';

if ($arResult['FIRST_EXPORT_PAGE'])
{
	foreach ($arResult['HEADERS'] as $header)
	{
		if ($showProductRows && $header['id'] === $productColumnId)
		{
			continue;
		}
		echo '"', str_replace('"', '""', $header['name']), '";';
	}
	if ($showProductRows)
	{
		echo '"', str_replace('"', '""', GetMessage('CRM_COLUMN_PRODUCT_NAME')), '";';
		echo '"', str_replace('"', '""', GetMessage('CRM_COLUMN_PRODUCT_PRICE')), '";';
		echo '"', str_replace('"', '""', GetMessage('CRM_COLUMN_PRODUCT_QUANTITY')), '";';
	}
	echo "\n";
}

foreach ($arResult['ITEMS'] as $item)
{
	$hasProducts = $showProductRows && !empty($item['EXPORT_PRODUCT_ROWS']);
	$productRows = $hasProducts ? $item['EXPORT_PRODUCT_ROWS'] : [[]];

	foreach ($productRows as $productRow)
	{
		foreach ($arResult['HEADERS'] as $header)
		{
			if ($showProductRows && $header['id'] === $productColumnId)
			{
				continue;
			}
			if ($showProductRows && $header['id'] === $opportunityField)
			{
				echo '"', CCrmProductRow::ResolveExportRowSum($productRow, $item[$header['id']] ?? ''), '";';
				continue;
			}
			if ($showProductRows && $header['id'] === $opportunityWithCurrencyField)
			{
				$opportunityWithCurrency = CCrmProductRow::ResolveExportRowSumWithCurrency(
					$productRow,
					(string)($item['EXPORT_CURRENCY_ID'] ?? ''),
					$item[$header['id']] ?? ''
				);
				// Money::format returns HTML (`&nbsp;`, `&#8381;` for the currency symbol);
				// CSV is plain text, so decode entities to get the real characters.
				$opportunityWithCurrency = html_entity_decode($opportunityWithCurrency, ENT_QUOTES | ENT_HTML5, 'UTF-8');
				echo '"', str_replace('"', '""', $opportunityWithCurrency), '";';
				continue;
			}
			$value = $item[$header['id']] ?? '';
			echo '"', str_replace('"', '""', htmlspecialcharsback($value)), '";';
		}
		if ($showProductRows)
		{
			$name = isset($productRow['PRODUCT_NAME'])
				? str_replace('"', '""', $productRow['PRODUCT_NAME'])
				: '';
			echo '"', $name, '";';
			echo '"', CCrmProductRow::GetPrice($productRow, ''), '";';
			echo '"', CCrmProductRow::GetQuantity($productRow, ''), '";';
		}
		echo "\n";
	}
}
