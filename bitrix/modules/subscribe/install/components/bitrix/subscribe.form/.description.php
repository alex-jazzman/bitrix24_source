<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

$arComponentDescription = [
	'NAME' => GetMessage('CD_BSF_NAME'),
	'DESCRIPTION' => GetMessage('CD_BSF_DESCRIPTION'),
	'ICON' => '/images/subscr_form.gif',
	'CACHE_PATH' => 'Y',
	'PATH' => [
		'ID' => 'service',
		'CHILD' => [
			'ID' => 'subscribe',
			'NAME' => GetMessage('CD_BSF_SERVICE')
		],
	],
];
