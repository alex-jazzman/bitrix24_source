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

// Mark every export column as shown. main.ui.grid renders only columns whose isShown() is true, and the
// export-only "Folder" column is appended without that flag, so it would otherwise be dropped.
$columns = array_map(
	static function (array $column): array {
		$column['default'] = true;

		return $column;
	},
	array_values($arResult['VISIBLE_COLUMNS_FOR_EXCEL']),
);

$getExportCellValue = static function (array $documentData, string $columnId): string
{
	// Every branch yields plain text: participants, senders and companies are rendered as names only
	// (no avatars/links), so the safe export carries no interactive markup. The returned value is
	// html-escaped and formula-injection-guarded by the caller below.
	return match ($columnId)
	{
		'ID' => (string)($documentData['ID'] ?? ''),
		'TITLE' => (string)($documentData['TITLE_INFO']['TEXT'] ?? ''),
		'MEMBER' => (string)($documentData['MEMBER_INFO']['FULL_NAME'] ?? ''),
		'ROLE' => (string)($documentData['ROLE'] ?? ''),
		'INITIATOR' => (string)($documentData['INITIATOR']['FULL_NAME'] ?? ''),
		'CREATED_BY' => (string)($documentData['CREATED_BY']['FULL_NAME'] ?? ''),
		'COMPANY' => (string)($documentData['company']['title'] ?? ''),
		'DATE_SIGN' => (string)($documentData['DATE_SIGN_INFO']['TEXT'] ?? ''),
		'MEMBER_STATUS' => (string)($documentData['MEMBER_STATUS']['TEXT'] ?? ''),
		'FOLDER' => (string)($documentData['FOLDER_TITLE'] ?? ''),
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
		// Dedicated grid id: the export must ignore the user's saved on-screen column view (which never
		// contains the export-only "Folder" column) and render exactly VISIBLE_COLUMNS_FOR_EXCEL.
		'GRID_ID' => $arResult['GRID_ID'] . '_EXPORT',
		'COLUMNS' => $columns,
		'ROWS' => $rows,
	]
);

die();
