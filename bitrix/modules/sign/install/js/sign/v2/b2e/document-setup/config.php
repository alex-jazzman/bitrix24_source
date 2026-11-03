<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Sign\Config;

// Extension::getConfig() includes this file in any context, and the sign module is not guaranteed
// to be loaded there: an unguarded call to its classes makes the whole config unreadable, and with
// it the rel list of the extension.
$featureStorage = null;
if (Loader::includeModule('sign'))
{
	$featureStorage = Config\Feature::instance();
}

return [
	'css' => 'dist/document-setup.bundle.css',
	'js' => 'dist/document-setup.bundle.js',
	'rel' => [
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.popup',
		'sign.feature-storage',
		'sign.type',
		'sign.v2.api',
		'sign.v2.b2e.document-block',
		'sign.v2.b2e.document-counters',
		'sign.v2.b2e.sign-dropdown',
		'sign.v2.document-setup',
		'sign.v2.helper',
		'sign.v2.sign-settings',
		'sign.v2.ui.notice',
		'ui.uploader.core',
	],
	'settings' => [
		'isSenderTypeAvailable' => $featureStorage?->isSenderTypeAvailable() ?? false,
	],
	'skip_core' => false,
];
