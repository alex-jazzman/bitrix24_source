<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/realtime.bundle.js',
	'rel' => [
		'pull.client',
	],
	'skip_core' => false,
];
