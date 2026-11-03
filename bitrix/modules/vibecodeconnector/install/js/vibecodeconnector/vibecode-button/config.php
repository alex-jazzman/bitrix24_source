<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Internal\Service\Endpoint\VibecodeUrlProvider;
use Bitrix\Vibecodeconnector\Internal\Service\Vibecode\VibecodeBrandResolver;

$href = null;
$brand = 'bitrix24';
$brandName = '';
if (Loader::includeModule('vibecodeconnector'))
{
	$href = (new VibecodeUrlProvider())->getDashboardUrl();
	$resolvedBrand = (new VibecodeBrandResolver())->resolve();
	$brand = $resolvedBrand->value;
	$brandName = $resolvedBrand->getDisplayName();
}

return [
    'js' => './dist/vibecode-button.bundle.js',
    'css' => './dist/vibecode-button.bundle.css',
    'rel' => [
		'main.core',
		'ui.buttons',
	],
    'skip_core' => false,
	'settings' => [
		'href' => $href,
		'brand' => $brand,
		'brandName' => $brandName,
	],
];
