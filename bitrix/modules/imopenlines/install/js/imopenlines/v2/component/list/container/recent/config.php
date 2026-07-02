<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recent.bundle.css',
	'js' => 'dist/recent.bundle.js',
	'rel' => [
		'im.v2.component.search',
		'im.v2.const',
		'imopenlines.v2.component.list.items.recent',
		'imopenlines.v2.component.search',
		'imopenlines.v2.css.tokens',
		'main.core',
	],
	'skip_core' => false,
];
