<?php

use Bitrix\Disk\File;
use Bitrix\Main\Context;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Main\Page\Asset;

require($_SERVER['DOCUMENT_ROOT'] . '/mobile/headers.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');

if (!Loader::includeModule('disk') || !Loader::includeModule('mobile'))
{
	return;
}

$currentUser = CurrentUser::get();
$fileId = filter_var(
	Context::getCurrent()->getRequest()->get('fileId'),
	FILTER_VALIDATE_INT,
	['options' => ['min_range' => 1]],
);
$file = null;
if ((int)$currentUser->getId() > 0 && $fileId !== false)
{
	$file = File::loadById($fileId)?->getRealObject();
}

$securityContext = $file?->getStorage()?->getSecurityContext($currentUser);
if (!$file instanceof File || !$securityContext || !$file->canRead($securityContext))
{
	$APPLICATION->IncludeComponent('bitrix:disk.error.page', 'standalone', []);
	CHTTP::SetStatus(Context::getCurrent()->getResponse()->getStatus());

	return;
}

Asset::getInstance()->addString('<meta name="viewport" content="width=device-width, initial-scale=1">');

echo $APPLICATION->IncludeComponent('bitrix:ui.sidepanel.wrapper', '', [
	'RETURN_CONTENT' => true,
	'POPUP_COMPONENT_NAME' => 'bitrix:disk.file.view',
	'POPUP_COMPONENT_TEMPLATE_NAME' => '',
	'POPUP_COMPONENT_PARAMS' => [
		'FILE' => $file,
		'STORAGE' => $file->getStorage(),
		'action' => 'default',
		'RELATIVE_PATH' => $file->getName(),
		'PATH_TO_FILE_VIEW' => '',
		'PATH_TO_FILE_HISTORY' => '',
		'PATH_TO_FOLDER_LIST' => '',
		'PATH_TO_GROUP' => '',
		'PATH_TO_DISK_TASK' => '',
	],
	'PLAIN_VIEW' => true,
	'IFRAME_MODE' => true,
	'PREVENT_LOADING_WITHOUT_IFRAME' => false,
	'USE_PADDING' => false,
]);
