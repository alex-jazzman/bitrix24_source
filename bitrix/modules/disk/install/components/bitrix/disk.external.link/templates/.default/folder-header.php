<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Head of the public folder page: the heading names the shared folder the link was made for, the
 * crumbs below it navigate inside that folder, the line under them describes the folder they point
 * at, and the actions of the link sit on the right of all three. FOLDER is the folder the link was
 * created on, so the heading keeps its name inside subfolders while the crumbs follow the path.
 * BREADCRUMBS holds that path under the shared folder and is empty on the root of the link: there
 * the heading already tells the whole path, so the crumbs are left out.
 *
 * @var array $arResult
 * @var CDiskExternalLinkComponent $component
 * @var string $copyLinkButtonHtml  rendered by the page, which owns the air look of the buttons
 * @var string $downloadButtonHtml  the same, empty when the archive is not offered
 */

global $APPLICATION;

$meta = $arResult['FOLDER_META'];
$itemCount = (int)$meta['ITEM_COUNT'];

$headerMetaParts = [
	$component->getMessagePlural('DISK_EXT_LINK_FOLDER_META_FILES', $itemCount, ['#COUNT#' => $itemCount]),
];
if ((int)$meta['SIZE'] > 0)
{
	$headerMetaParts[] = $meta['FORMATTED_SIZE'];
}
$headerMetaParts[] = $component->getMessage(
	'DISK_EXT_LINK_META_UPDATED',
	['#DATE#' => $meta['UPDATE_TIME']],
);

$headerNavHtml = '';
if (!empty($arResult['BREADCRUMBS']))
{
	ob_start();
	$APPLICATION->IncludeComponent(
		'bitrix:disk.breadcrumbs',
		'air',
		[
			'STORAGE_ID' => $arResult['FOLDER']['STORAGE_ID'],
			'BREADCRUMBS_ROOT' => $arResult['BREADCRUMBS_ROOT'],
			'BREADCRUMBS' => $arResult['BREADCRUMBS'],
		],
	);
	$headerNavHtml = (string)ob_get_clean();
}

$headerTitle = $arResult['FOLDER']['NAME'];
$headerActionsHtml = $copyLinkButtonHtml . $downloadButtonHtml;
$headerTestIdPrefix = 'disk-ext-folder';

include __DIR__ . '/object-header.php';
