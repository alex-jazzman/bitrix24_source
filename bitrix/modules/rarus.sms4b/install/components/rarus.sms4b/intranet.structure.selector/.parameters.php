<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$arComponentParameters = [
	'GROUPS' => [
		'FILTER' => [
			'NAME' => GetMessage(''),
        ],
    ],
	
	'PARAMETERS' => [
		'LIST_URL' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => '',
			'PARENT' => 'BASE',
			'NAME' => GetMessage('INTR_ISS_PARAM_LIST_URL'),
        ],

		'FILTER_NAME' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'users',
			'PARENT' => 'FILTER',
			'NAME' => GetMessage('INTR_ISS_PARAM_FILTER_NAME'),
        ],
		
		'FILTER_DEPARTMENT_SINGLE' => [
			'TYPE' => 'LIST',
            'VALUES' => [
                'Y' => GetMessage('INTR_ISS_PARAM_FILTER_DEPARTMENT_SINGLE_VALUE_Y'),
                'N' => GetMessage('INTR_ISS_PARAM_FILTER_DEPARTMENT_SINGLE_VALUE_N')
            ],
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'PARENT' => 'FILTER',
			'NAME' => GetMessage('INTR_ISS_PARAM_FILTER_DEPARTMENT_SINGLE'),
        ],

		'FILTER_SESSION' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'PARENT' => 'FILTER',
			'NAME' => GetMessage('INTR_ISS_PARAM_FILTER_SESSION'),
        ],
    ],
];
