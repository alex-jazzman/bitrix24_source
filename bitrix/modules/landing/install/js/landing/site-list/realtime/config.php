<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/realtime.bundle.js',
	'rel' => [
		'landing.realtime',
	],
	'skip_core' => false,
];
