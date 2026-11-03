<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/migration-state.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'pull.client',
	],
	'skip_core' => false,
];
