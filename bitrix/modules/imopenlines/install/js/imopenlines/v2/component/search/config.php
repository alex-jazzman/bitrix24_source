<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/registry.bundle.js',
	],
	'rel' => [
		'im.v2.component.search',
		'im.v2.lib.search',
		'imopenlines.v2.lib.menu',
		'imopenlines.v2.provider.service',
		'main.core',
	],
	'skip_core' => false,
];
