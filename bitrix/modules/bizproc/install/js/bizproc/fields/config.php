<?php

declare(strict_types=1);

use Bitrix\Bizproc\Public\Fields\Registry\FieldTypeRegistry;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loader::requireModule('bizproc');

$extensions = FieldTypeRegistry::getExtensions();

return [
	'js' => './dist/fields.bundle.js',
	'css' => './dist/fields.bundle.css',
	'rel' => [
		'bizproc.automation',
		'main.core',
		'main.core.events',
		'ui.hint',
		'ui.icon-set.outline',
	],
	'post_rel' => $extensions,
	'settings' => [
		'typeMap' => FieldTypeRegistry::getTypeMap(),
	],
	'skip_core' => false,
];
