<?php

use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$serviceAddress = Loader::includeModule('sign')
	? \Bitrix\Sign\Config\Storage::instance()->getServiceAddress()
	: null
;


return [
	'css' => 'dist/signing-frame-event-handler.bundle.css',
	'js' => 'dist/signing-frame-event-handler.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.dialogs.messagebox',
	],
	'settings' => [
		'serviceAddress' => $serviceAddress
	],
	'skip_core' => false,
];
