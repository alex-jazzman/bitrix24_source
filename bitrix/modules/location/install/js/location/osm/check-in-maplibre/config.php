<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/check-in-maplibre.bundle.js',
	'css' => './dist/check-in-maplibre.bundle.css',
	'rel' => [
		'main.polyfill.core',
		'location.core',
		'location.osm',
		'location.osm.maplibre',
	],
	'skip_core' => true,
];
