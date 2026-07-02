<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/toolbar-buttons.bundle.css',
	'js' => 'dist/toolbar-buttons.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'imopenlines.v2.lib.crm-form',
		'imopenlines.v2.lib.quick-command',
		'imopenlines.v2.lib.silent-mode',
		'imopenlines.v2.provider.service',
	],
	'skip_core' => true,
];
