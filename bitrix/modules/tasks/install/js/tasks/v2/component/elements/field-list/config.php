<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/field-list.bundle.css',
	'js' => 'dist/field-list.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.component.elements.question-mark',
	],
	'skip_core' => true,
];
