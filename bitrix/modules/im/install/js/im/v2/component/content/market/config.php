<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/market-content.bundle.css',
	'js' => 'dist/market-content.bundle.js',
	'rel' => [
		'im.v2.component.elements.loader',
		'im.v2.lib.market',
		'main.core',
	],
	'skip_core' => false,
];