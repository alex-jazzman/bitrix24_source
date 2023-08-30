<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

$arComponentParameters = [
	'GROUPS' => [
    ],
	'PARAMETERS' => [
		'PAGE_POST' => [
			'PARENT' => 'URL_TEMPLATES',
			'NAME'=>GetMessage('SUBSCR_FORM_PAGE_POST'),
			'TYPE'=>'STRING',
			'DEFAULT'=>COption::GetOptionString('subscribe', 'subscribe_section').'subscr_edit.php',
        ],
		'PAGE_SMS' => [
			'PARENT' => 'URL_TEMPLATES',
			'NAME'=>GetMessage('SUBSCR_FORM_PAGE_SMS'),
			'TYPE'=>'STRING',
			'DEFAULT'=>COption::GetOptionString('subscribe', 'subscribe_section').'subscr_edit.php',
        ],
		'SHOW_POST_SUB' => [
			'PARENT' => '',
			'NAME' => GetMessage('SHOW_POST_SUB'),
			'TYPE' => 'CHECKBOX',
			'DEFAULT' => 'Y'
        ],
		'SHOW_RSS_SUB' => [
			'PARENT' => '',
			'NAME' => GetMessage('SHOW_RSS_SUB'),
			'TYPE' => 'CHECKBOX',
			'DEFAULT' => 'Y'
        ],
		'URL_FOR_FEEDBURNER' => [
			'PARENT' => '',
			'NAME' => GetMessage('FEEDBURNER_URL'),
			'TYPE' => 'STRING',
			'DEFAULT' => 'http://feeds.feedburner.com/'
        ],
		'FEED_NAME' => [
			'PARENT' => '',
			'NAME' => GetMessage('FEED_NAME'),
			'TYPE' => 'STRING',
			'DEFAULT' => ''
        ],
		'SHOW_SMS_SUB' => [
			'PARENT' => '',
			'NAME' => GetMessage('SHOW_SMS_SUB'),
			'TYPE' => 'CHECKBOX',
			'DEFAULT' => 'Y'
        ],
    ],
];
