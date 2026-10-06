<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/timeline.bundle.css',
	'js' => 'dist/timeline.bundle.js',
	'rel' => [
		'bizproc.document',
		'bizproc.task',
		'bizproc.types',
		'main.core',
		'main.date',
		'main.popup',
		'ui.hint',
		'ui.icons.b24',
		'ui.textcrop',
	],
	'skip_core' => false,
];