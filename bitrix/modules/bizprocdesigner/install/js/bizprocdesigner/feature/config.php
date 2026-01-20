<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];
if (CModule::IncludeModule('bizprocdesigner'))
{
	$settings['featureCodes'] = \Bitrix\BizprocDesigner\Internal\Config\Feature::instance()->getAvailableFeatureCodes();
}

return [
	'css' => 'dist/feature.bundle.css',
	'js' => 'dist/feature.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'settings' => $settings,
];
