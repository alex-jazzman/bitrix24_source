<?php

use Bitrix\UI\FileUploader\Configuration;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$defaultConfig = new \Bitrix\UI\FileUploader\Configuration();

return [
	'js' => 'dist/ui.uploader.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'lang' => [
		'/bitrix/modules/ui/lib/FileUploader/UserErrors.php',
	],
	'settings' => [
		...$defaultConfig->jsonSerialize(),
		'chunkMinSize' => Configuration::getChunkMinSize(),
		'chunkMaxSize' => Configuration::getChunkMaxSize(),
		'defaultChunkSize' => Configuration::getDefaultChunkSize(),
		'imageExtensions' => Configuration::getImageExtensions(withDot: false),
		'videoExtensions' => Configuration::getVideoExtensions(withDot: false),
	],
];
