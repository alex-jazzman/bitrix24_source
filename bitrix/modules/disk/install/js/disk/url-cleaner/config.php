<?php
declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/index.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
