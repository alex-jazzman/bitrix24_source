<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/board-tasks.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'pull.client',
		'ui.notification',
	],
	'skip_core' => false,
];
