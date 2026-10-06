<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/imageuploader.bundle.css',
	'js' => 'dist/imageuploader.bundle.js',
	'rel' => [
		'landing.backend',
		'landing.imagecompressor',
		'main.core',
	],
	'skip_core' => false,
];