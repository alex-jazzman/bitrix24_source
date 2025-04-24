<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/vote-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'vote.application',
	],
	'skip_core' => true,
];

