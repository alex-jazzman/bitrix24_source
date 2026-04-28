<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use Bitrix\Main\Context;
use Bitrix\Main\Loader;

if (!Loader::includeModule('note'))
{
	require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');

	return;
}

/** @var CMain $APPLICATION */
$request = Context::getCurrent()->getRequest();
$documentId = (int)$request->get('documentId') ?: 0;

$APPLICATION->IncludeComponent(
	'bitrix:note.editor',
	'',
	[
		'DOCUMENT_ID' => $documentId,
		'DIRECT_LINK' => 'Y',
	],
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
