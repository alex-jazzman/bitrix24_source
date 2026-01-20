<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'/bitrix/js/documentgenerator/selector/dist/selector.bundle.css'
	],
	'js' => '/bitrix/js/documentgenerator/selector/dist/selector.bundle.js',
	'rel' => [
		'documentgenerator.preview',
		'main.loader',
		'main.popup',
		'main.core',
	],
	'skip_core' => false,
];
