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
$APPLICATION->RestartBuffer();
// hack. any '.default' customized template should contain 'excel' page
Header('Content-Type: application/vnd.ms-excel');
Header('Content-Disposition: attachment;filename=crm_items.xls');
Header('Content-Type: application/octet-stream');
Header('Content-Transfer-Encoding: binary');

$showProductRows = !empty($arResult['EXPORT_PRODUCT_FIELDS']);
$productColumnId = \Bitrix\Crm\Item::FIELD_NAME_PRODUCTS . '.PRODUCT_ID';
$opportunityField = \Bitrix\Crm\Item::FIELD_NAME_OPPORTUNITY;
$opportunityWithCurrencyField = 'OPPORTUNITY_WITH_CURRENCY';

if ($arResult['FIRST_EXPORT_PAGE'])
{
?><html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=<?=LANG_CHARSET;?>">
	<style>
		.number2 {mso-number-format:Fixed;}
	</style>
	<title></title>
</head>
<body>
<table border="1">
	<thead>
		<tr>
			<?php
	foreach ($arResult['HEADERS'] as $header)
	{
		if ($showProductRows && $header['id'] === $productColumnId)
		{
			continue;
		}
		?>
			<th><?=htmlspecialcharsbx($header['name'])?></th>
		<?php
	}
	if ($showProductRows)
	{
		?>
			<th><?=htmlspecialcharsbx(GetMessage('CRM_COLUMN_PRODUCT_NAME'))?></th>
			<th><?=htmlspecialcharsbx(GetMessage('CRM_COLUMN_PRODUCT_PRICE'))?></th>
			<th><?=htmlspecialcharsbx(GetMessage('CRM_COLUMN_PRODUCT_QUANTITY'))?></th>
		<?php
	}
	?></tr>
	</thead>
	<tbody><?php
}

foreach ($arResult['ITEMS'] as $item)
{
	$hasProducts = $showProductRows && !empty($item['EXPORT_PRODUCT_ROWS']);
	$productRows = $hasProducts ? $item['EXPORT_PRODUCT_ROWS'] : [[]];

	foreach ($productRows as $productRow)
	{
		?>
		<tr><?php
		foreach ($arResult['HEADERS'] as $header)
		{
			if ($showProductRows && $header['id'] === $productColumnId)
			{
				continue;
			}
			if ($showProductRows && $header['id'] === $opportunityField)
			{
				?>
			<td class="number2"><?=CCrmProductRow::ResolveExportRowSum($productRow, $item[$header['id']] ?? '')?></td>
			<?php
				continue;
			}
			if ($showProductRows && $header['id'] === $opportunityWithCurrencyField)
			{
				?>
			<td><?=CCrmProductRow::ResolveExportRowSumWithCurrency($productRow, (string)($item['EXPORT_CURRENCY_ID'] ?? ''), $item[$header['id']] ?? '')?></td>
			<?php
				continue;
			}
			?>
			<td><?=($item[$header['id']] ?? '')?></td>
		<?php
		}
		if ($showProductRows)
		{
			$name = isset($productRow['PRODUCT_NAME'])
				? htmlspecialcharsbx($productRow['PRODUCT_NAME'])
				: '';
			?>
			<td><?=$name?></td>
			<td class="number2"><?=CCrmProductRow::GetPrice($productRow, '')?></td>
			<td><?=CCrmProductRow::GetQuantity($productRow, '')?></td>
		<?php
		}
		?></tr>
	<?php
	}
}

if ($arResult['LAST_EXPORT_PAGE'])
{
?>
	</tbody>
</table>
</body>
</html><?php
}
