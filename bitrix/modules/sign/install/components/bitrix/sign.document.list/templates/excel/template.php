<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 */

Loc::loadMessages(__DIR__ . '/../../class.php');

$APPLICATION->RestartBuffer();

$encodedExcelDocumentName = Uri::urnEncode($arResult['EXCEL_DOCUMENT_NAME'], 'UTF-8');
$contentDisposition = 'attachment; filename*=utf-8\'\'' . $encodedExcelDocumentName;

header('Content-Type: application/vnd.ms-excel;');
header('Content-Disposition: ' . $contentDisposition);

$columns = array_values($arResult['VISIBLE_COLUMNS_FOR_EXCEL']);

$getExportCellValue = static function (array $documentData, string $columnId): string
{
	return match ($columnId)
	{
		'ID' => (string)($documentData['ID'] ?? ''),
		'MEMBER' => (string)($documentData['MEMBER_INFO']['FULL_NAME'] ?? ''),
		'ROLE' => (string)($documentData['ROLE'] ?? ''),
		'DATE_SIGN' => (string)($documentData['DATE_SIGN_INFO']['TEXT'] ?? ''),
		'MEMBER_STATUS' => (string)($documentData['MEMBER_STATUS']['TEXT'] ?? ''),
		default => '',
	};
};

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

foreach ($arResult['DOCUMENTS'] as $documentData)
{
	$rowColumns = [];
	foreach ($columns as $column)
	{
		$columnId = $column['id'] ?? null;
		if (!is_string($columnId) || $columnId === '')
		{
			continue;
		}

		$cellValue = $getExportCellValue($documentData, $columnId);
		$rowColumns[$columnId] = $escapeXlsCellValue(htmlspecialcharsbx($cellValue));
	}

	$rows[] = [
		'id' => (string)($documentData['ID'] ?? ''),
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
