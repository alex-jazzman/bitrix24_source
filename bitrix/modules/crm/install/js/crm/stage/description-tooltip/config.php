<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/description-tooltip.bundle.js',
	'css' => './dist/description-tooltip.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.a11y',
		'ui.bbcode.formatter.html-formatter',
		'ui.hint',
	],
	'skip_core' => false,
];
