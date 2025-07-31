<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/transfer-to-intranet.bundle.css',
	'js' => 'dist/transfer-to-intranet.bundle.js',
	'rel' => [
		'main.popup',
		'main.core.events',
		'ui.lottie',
		'ui.confetti',
		'main.core',
		'ui.buttons',
		'intranet.department-control',
		'ui.avatar',
		'ui.fonts.inter',
	],
	'skip_core' => false,
];
