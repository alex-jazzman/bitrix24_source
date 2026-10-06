<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/permissions-selector.bundle.js',
	'rel' => [
		'main.core',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];
