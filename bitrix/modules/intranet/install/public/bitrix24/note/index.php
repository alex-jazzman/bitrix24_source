<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use Bitrix\Main\Loader;

if (!Loader::includeModule('note'))
{
	require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');

	return;
}

/** @var CMain $APPLICATION */
$APPLICATION->IncludeComponent(
	'bitrix:note.editor',
	'',
	[],
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
