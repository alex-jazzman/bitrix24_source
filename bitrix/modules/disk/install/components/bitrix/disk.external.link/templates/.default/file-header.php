<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Head of the public file page: the heading names the shared file, the line under it tells its size
 * and when it changed, and the actions of the link sit on the right of both. It is the head of the
 * folder page and differs only in what its meta line is built from.
 *
 * @var array $arResult
 * @var CDiskExternalLinkComponent $component
 * @var string $copyLinkButtonHtml  rendered by the page, which owns the air look of the buttons
 * @var string $downloadButtonHtml  the same
 */

$file = $arResult['FILE'];

$headerTitle = $file['NAME'];
$headerMetaParts = [
	$file['FORMATTED_SIZE'],
	$component->getMessage('DISK_EXT_LINK_META_UPDATED', ['#DATE#' => $file['FORMATTED_UPDATE_TIME']]),
];
$headerNavHtml = '';
$headerActionsHtml = $copyLinkButtonHtml . $downloadButtonHtml;
$headerTestIdPrefix = 'disk-ext-file';

include __DIR__ . '/object-header.php';
