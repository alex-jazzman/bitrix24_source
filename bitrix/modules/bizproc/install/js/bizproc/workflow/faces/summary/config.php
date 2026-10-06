<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/summary.bundle.css',
	'js' => 'dist/summary.bundle.js',
	'rel' => [
		'bizproc.a11y',
		'bizproc.workflow.timeline',
		'main.core',
		'main.date',
		'ui.design-tokens',
		'ui.icon-set.main',
		'ui.icons',
	],
	'skip_core' => false,
];
