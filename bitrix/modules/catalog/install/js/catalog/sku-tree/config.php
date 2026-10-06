<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sku-tree.bundle.css',
	'js' => 'dist/sku-tree.bundle.js',
	'rel' => [
		'catalog.sku-tree',
		'main.core',
		'main.core.events',
		'ui.a11y',
		'ui.buttons',
		'ui.design-tokens',
		'ui.forms',
	],
	'skip_core' => false,
];