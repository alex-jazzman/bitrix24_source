<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sign.bundle.css',
	'js' => 'dist/sign.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.elements.button',
		'im.v2.component.message.base',
		'im.v2.component.message.default',
		'im.v2.component.message.elements',
		'im.v2.lib.utils',
		'main.core',
	],
	'skip_core' => false,
];