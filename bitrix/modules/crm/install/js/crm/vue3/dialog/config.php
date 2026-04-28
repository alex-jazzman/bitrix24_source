<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/dialog.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'ui.entity-selector',
	],
	'skip_core' => true,
];
