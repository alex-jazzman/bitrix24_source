<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

$arComponentDescription = [
	'NAME' => GetMessage('INTR_ISS_COMPONENT_NAME'),
	'DESCRIPTION' => GetMessage('INTR_ISS_COMPONENT_DESCR'),
	'ICON' => '/images/comp.gif',
	'CACHE_PATH' => 'Y',
	'PATH' => [
		'ID' => 'sms4b',
		'NAME' => GetMessage('INTR_GROUP_NAME'),
		'CHILD' => [
			'ID' => 'CorPor',
			'NAME' => GetMessage('INTR_STRUCTURE_GROUP_NAME'),
        ]
    ],
];
