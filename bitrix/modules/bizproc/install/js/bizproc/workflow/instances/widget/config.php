<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/widget.bundle.css',
	'js' => 'dist/widget.bundle.js',
	'rel' => [
		'bizproc.a11y',
		'main.core',
		'main.date',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.design-tokens',
		'ui.icon-set.main',
		'ui.icons',
		'ui.image-stack-steps',
		'ui.label',
	],
	'skip_core' => false,
];
