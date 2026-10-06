<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 */

$APPLICATION->RestartBuffer();

$encodedFileName = rawurlencode((string)$arResult['EXCEL_FILE_NAME']);
$contentDisposition = 'attachment; filename*=utf-8\'\'' . $encodedFileName;

header('Content-Type: application/vnd.ms-excel;');
header('Content-Disposition: ' . $contentDisposition);

$columns = array_values($arResult['VISIBLE_COLUMNS_FOR_EXCEL']);

// Prefix values that could be interpreted as a formula to prevent CSV/XLS formula injection.
$escapeXlsCellValue = static function (string $value): string
{
	$value = ltrim($value);

	if ($value !== '' && in_array($value[0], ['=', '+', '-', '@'], true))
	{
		$value = "'" . $value;
	}

	return $value;
};

$rows = [];

foreach ($arResult['EXCEL_ROWS'] as $signerRow)
{
	$rowColumns = [];
	foreach ($columns as $column)
	{
		$columnId = $column['id'] ?? null;
		if (!is_string($columnId) || $columnId === '')
		{
			continue;
		}

		$cellValue = (string)($signerRow['columns'][$columnId] ?? '');
		$rowColumns[$columnId] = $escapeXlsCellValue(htmlspecialcharsbx($cellValue));
	}

	$rows[] = [
		'id' => (string)($signerRow['id'] ?? ''),
		'columns' => $rowColumns,
	];
}

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'excel',
	[
		'GRID_ID' => $arResult['GRID_ID'],
		'COLUMNS' => $columns,
		'ROWS' => $rows,
	]
);

die();
