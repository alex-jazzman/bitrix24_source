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
		'bizproc.types',
		'ui.icons.b24',
		'ui.hint',
		'ui.textcrop',
		'main.popup',
		'main.date',
		'main.core',
		'bizproc.task',
	],
	'skip_core' => false,
];