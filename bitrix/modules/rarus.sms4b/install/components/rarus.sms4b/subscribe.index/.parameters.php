<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

if(!CModule::IncludeModule('subscribe'))
{
	ShowError(GetMessage('SUBSCR_MODULE_NOT_INSTALLED'));
	return;
}

$rub = CRubric::GetList(['SORT' =>'ASC', 'NAME' =>'ASC'], ['ACTIVE' =>'Y']);

$show_rub = [];
while($temp = $rub->Fetch())
{
	$show_rub[$temp['ID']] = $temp['NAME'];
}
$count = $rub->SelectedRowsCount();

$arComponentParameters = [
	'GROUPS' => [
    ],
	'PARAMETERS' => [
		'SHOW_COUNT' => [
			'PARENT' => 'DATA_SOURCE',
			'NAME'=>GetMessage('SUBSCR_SHOW_COUNT'),
			'TYPE'=>'CHECKBOX',
			'DEFAULT'=>'N',
        ],
		'SHOW_HIDDEN' => [
			'PARENT' => 'DATA_SOURCE',
			'NAME'=>GetMessage('SUBSCR_SHOW_HIDDEN'),
			'TYPE'=>'CHECKBOX',
			'DEFAULT'=>'N',
        ],
		'SHOW_POST_FORM' => [
			'PARENT' => 'DATA_SOURCE',
			'NAME'=>GetMessage('SUBSCR_SHOW_POST_FORM'),
			'TYPE'=>'CHECKBOX',
			'DEFAULT'=>'Y',
        ],
		'SHOW_SMS_FORM' => [
			'PARENT' => 'DATA_SOURCE',
			'NAME'=>GetMessage('SUBSCR_SHOW_SMS_FORM'),
			'TYPE'=>'CHECKBOX',
			'DEFAULT'=>'Y',
        ],
		'PAGE' => [
			'PARENT' => 'URL_TEMPLATES',
			'NAME'=>GetMessage('SUBSCR_FORM_PAGE'),
			'TYPE'=>'STRING',
			'DEFAULT'=>COption::GetOptionString('subscribe', 'subscribe_section').'subscr_edit.php',
        ],
		'SHOW_RUBS'=> [
			'PARENT' => 'DATA_SOURCE',
			'NAME' => GetMessage('SUBSCR_SHOW_RUB'),
			'TYPE' => 'LIST',
			'VALUES' => $show_rub,
			'MULTIPLE'=>'Y',
			'SIZE' => $count,
        ],
		'CACHE_TIME'  =>  ['DEFAULT' =>3600],
		'SET_TITLE' => [],
    ],
];
