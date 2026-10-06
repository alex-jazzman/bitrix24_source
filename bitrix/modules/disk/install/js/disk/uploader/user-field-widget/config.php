<?php

use Bitrix\Disk\Document\Flipchart\Configuration;
use Bitrix\Disk\Document\LocalDocumentController;
use Bitrix\Disk\Driver;
use Bitrix\Disk\Integration\Bitrix24Manager;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

if (!Loader::includeModule('disk'))
{
	return [];
}

$importHandlers = [];
$handlersManager = Driver::getInstance()->getDocumentHandlersManager();
foreach ($handlersManager->getHandlersForImport() as $handler)
{
	$importHandlers[$handler::getCode()] = [
		'code' => $handler::getCode(),
		'name' => $handler::getName(),
	];
}

$documentHandlers = [];
$canCreateDocuments = \Bitrix\Disk\Configuration::canCreateFileByCloud();
if ($canCreateDocuments)
{
	foreach ($handlersManager->getHandlersForCreatingFile() as $handler)
	{
		$documentHandlers[$handler::getCode()] = [
			'code' => $handler::getCode(),
			'name' => $handler::getName(),
			'supportsUnifiedLink' => $handler->supportsUnifiedLink(),
		];
	}

	$documentHandlers[LocalDocumentController::getCode()] = [
		'code' => LocalDocumentController::getCode(),
		'name' => LocalDocumentController::getName(),
		'supportsUnifiedLink' => false,
	];
}

$importFeatureId = 'disk_import_cloud_files';
$isFeatureImportEnabled = Bitrix24Manager::isFeatureEnabled($importFeatureId);
$isBoardsEnabled = Configuration::isBoardsEnabled();

return [
	'js' => 'dist/disk.uploader.uf-file.bundle.js',
	'css' => 'dist/disk.uploader.uf-file.bundle.css',
	'rel' => [
		'disk.disk-picker',
		'disk.document',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icons.generator',
		'ui.info-helper',
		'ui.system.menu',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
		'ui.uploader.vue',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => false,
	'settings' => [
		'canCreateDocuments' => $canCreateDocuments,
		'documentHandlers' => $documentHandlers,
		'importHandlers' => $importHandlers,
		'canUseImport' => $isFeatureImportEnabled,
		'importFeatureId' => 'disk_import_cloud_files',
		'isBoardsEnabled' => $isBoardsEnabled,
	],
];
