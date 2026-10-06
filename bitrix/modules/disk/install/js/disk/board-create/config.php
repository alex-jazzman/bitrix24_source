<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/disk.board-create.bundle.js',
	'rel' => [
		'main.core',
		'ui.notification',
		'ui.a11y',
	],
	'skip_core' => false,
];
