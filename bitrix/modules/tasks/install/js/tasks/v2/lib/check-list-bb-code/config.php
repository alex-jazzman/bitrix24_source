<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/check-list-bb-code.bundle.js',
	'rel' => [
		'main.core',
		'ui.bbcode.encoder',
		'ui.bbcode.model',
		'ui.bbcode.parser',
	],
	'skip_core' => false,
];
