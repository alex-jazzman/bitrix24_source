<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return array(
	'css' => 'dist/reinvite-popup.bundle.css',
	'js' => array(
		'dist/reinvite-popup.bundle.js'
	),
	'rel' => [
		'main.core',
		'main.popup',
		'phone_number',
		'ui.buttons',
	],
	'skip_core' => false,
);