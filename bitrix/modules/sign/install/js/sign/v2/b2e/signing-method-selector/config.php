<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/signing-method-selector.bundle.js',
	'css' => './dist/signing-method-selector.bundle.css',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
