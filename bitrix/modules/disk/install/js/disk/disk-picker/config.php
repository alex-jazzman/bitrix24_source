<?php

use Bitrix\Disk\Configuration;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loader::requireModule('disk');

return [
	'js' => './dist/disk-picker.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
	],
	'skip_core' => false,
	'settings' => [
		'enabled' => Configuration::isUniversalFilePickerEnabled(),
	],
];
