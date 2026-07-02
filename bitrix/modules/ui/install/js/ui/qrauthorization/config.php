<?php

use Bitrix\Main\Config\Option;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/qrauthorization.bundle.css',
	'js' => 'dist/qrauthorization.bundle.js',
	'rel' => [
		'main.core',
		'main.loader',
		'main.popup',
		'main.qrcode',
		'pull.client',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.icon-set.main',
	],
	'skip_core' => false,
	'settings' => [
		'ttl' => Option::get('main', 'qr-authorization-ttl', 60),
	],
];
