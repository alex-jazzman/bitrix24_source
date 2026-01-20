<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/connect-popup.bundle.css',
	'js' => 'dist/connect-popup.bundle.js',
	'rel' => [
		'main.popup',
		'main.core.events',
		'main.loader',
		'ui.design-tokens',
		'intranet.design-tokens',
		'main.qrcode',
		'pull.client',
		'ui.icon-set.outline',
		'ui.analytics',
		'ui.type',
		'main.phonenumber',
		'main.core.cache',
		'ui.buttons',
		'ui.confetti',
		'main.core',
	],
	'skip_core' => false,
];
