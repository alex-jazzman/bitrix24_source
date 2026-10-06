<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Public\Service\AvailabilityService;

$isAvailable = false;
$previewUserId = null;

if (Loader::includeModule('vibecodeconnector'))
{
	$availability = ServiceLocator::getInstance()->get(AvailabilityService::class);
	$isAvailable = $availability->isEnabled();

	$rawPreview = $_GET['previewUserId'] ?? null;
	if (is_numeric($rawPreview) && (int)$rawPreview > 0)
	{
		$previewUserId = (int)$rawPreview;
	}
}

return [
	'js' => './src/button.js',
	'css' => './src/button.css',
	'rel' => [
		'main.core',
		'main.core.events',
	],
	'settings' => [
		'isAvailable' => $isAvailable,
		'previewUserId' => $previewUserId,
	],
	'skip_core' => false,
];
