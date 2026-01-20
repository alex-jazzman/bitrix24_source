<?php

use Bitrix\Bizproc\Internal\Integration\Rag\Service\RagService;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];
if (
	Loader::includeModule('bizproc')
	&& ServiceLocator::getInstance()->get(RagService::class)
)
{
	$service = ServiceLocator::getInstance()->get(RagService::class);
	$settings = [
		'isAvailable' => $service->isAvailable(),
		'maxFilesCount' => $service->getMaxFilesCount(),
		'maxFileSize' => $service->getMaxFileSize(),
		'acceptedFileTypes' => $service->getAcceptedFileTypes(),
		'maxBasesCountPerField' => $service->getMaxBasesCountPerField(),
	];
}

return [
	'css' => 'dist/rag-selector.bundle.css',
	'js' => 'dist/rag-selector.bundle.js',
	'rel' => [
		'ui.vue3',
		'main.core.events',
		'ui.vue3.components.button',
		'ui.alerts',
		'ui.forms',
		'ui.layout-form',
		'main.core',
		'ui.uploader.tile-widget',
		'ui.uploader.core',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
	'settings' => $settings,
];