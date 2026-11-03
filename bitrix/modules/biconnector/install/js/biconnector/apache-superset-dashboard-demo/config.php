<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/apache-superset-dashboard-demo.bundle.js',
    'css' => './dist/apache-superset-dashboard-demo.bundle.css',
    'rel' => [
		'biconnector.apache-superset-dashboard-skeleton',
		'biconnector.apache-superset-embedded-loader',
		'main.core',
		'main.popup',
		'main.sidepanel',
		'ui.hint',
		'ui.lottie',
	],
    'skip_core' => false,
];
