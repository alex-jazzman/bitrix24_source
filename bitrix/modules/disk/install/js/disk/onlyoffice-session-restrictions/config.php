<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Disk\Document\OnlyOffice\Handlers\AvailableDocumentSessionCountNotifier;
use Bitrix\Disk\Document\OnlyOffice\RestrictionManager;
use Bitrix\Disk\Realtime\Tags\AvailableDocumentSessionCountTag;

$tag = new AvailableDocumentSessionCountTag();
$tag->subscribe();

$availableDocumentSessionCount = null;
try
{
	$availableDocumentSessionCount = (new RestrictionManager())->getAvailableDocumentSessionCount();
}
catch (RuntimeException)
{
	$availableDocumentSessionCount = null;
}

return [
	'css' => 'dist/onlyoffice-session-restrictions.bundle.css',
	'js' => 'dist/onlyoffice-session-restrictions.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'tag' => $tag->getName(),
		'command' => AvailableDocumentSessionCountNotifier::COMMAND_NAME,
		'availableDocumentSessionCount' => $availableDocumentSessionCount,
	],
];
