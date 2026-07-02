<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/vibe-code-catalog-button.bundle.js',
    'css' => './dist/vibe-code-catalog-button.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
	'settings' => [
		'isAvailable' => \Bitrix\Main\Config\Option::get('vibecodeconnector', 'is_ready', 'N') === 'Y',
	],
    'skip_core' => true,
];
