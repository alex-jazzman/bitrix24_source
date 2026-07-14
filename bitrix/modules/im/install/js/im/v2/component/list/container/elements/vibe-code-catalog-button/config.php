<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/vibe-code-catalog-button.bundle.js',
    'css' => './dist/vibe-code-catalog-button.bundle.css',
    'rel' => [
		'im.v2.const',
		'main.core',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'settings' => [
		'isAvailable' => \Bitrix\Main\Config\Option::get('vibecodeconnector', 'is_ready', 'N') === 'Y',
	],
    'skip_core' => false,
];
