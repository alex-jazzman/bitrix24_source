<?php
use Bitrix\Main\Config\Configuration;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$defaultValue = class_exists('\Dev\Main\Migrator\ModuleUpdater');

$settings = [
	'restoreLostFocus' => $defaultValue,
	'useFocusTrapInDialogs' => $defaultValue,
];

$configuration = Configuration::getValue('ui');
if (isset($configuration['a11y']) && is_array($configuration['a11y']) && count($configuration['a11y']) > 0)
{
	$settings = array_merge($settings, $configuration['a11y']);
}

return [
	'js' => 'dist/a11y.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'settings' => $settings,
];
