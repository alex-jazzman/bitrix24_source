<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

$arComponentDescription = [
	'NAME' => GetMessage('T_DESC_REPORTS'),
	'DESCRIPTION' => GetMessage('T_DESC_REPORTS_DESC'),
	'ICON' => '/images/noname.gif',
	'CACHE_PATH' => 'Y',
	'PATH' => [
		'ID' => 'sms4b',
		'NAME' => GetMessage('FOLDER_NAME'),
    ],
];
