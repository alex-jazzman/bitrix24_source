<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

CModule::IncludeModule('intranet');

$arComponentParameters = [
	'GROUPS' => [
		'FILTER' => [
			'NAME' => GetMessage('INTR_ISL_GROUP_FILTER'),
        ],
    ],
	
	'PARAMETERS' => [
		'FILTER_NAME' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'users',
			'PARENT' => 'FILTER',
			'NAME' => GetMessage('INTR_ISL_PARAM_FILTER_NAME'),
        ],
		
		'FILTER_1C_USERS' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'NAME' => GetMessage('INTR_ISL_PARAM_FILTER_1C_USERS'),
			'PARENT' => 'BASE'
        ],
		'FILTER_SECTION_CURONLY' => [
			'TYPE' => 'LIST',
			'VALUES' => [
                'Y' => GetMessage('INTR_ISL_PARAM_FILTER_SECTION_CURONLY_VALUE_Y'),
                'N' => GetMessage('INTR_ISL_PARAM_FILTER_SECTION_CURONLY_VALYE_N')
            ],
			'MULTIPLE' => 'N',
			'DEFAULT' => 'N',
			'NAME' => GetMessage('INTR_ISL_PARAM_FILTER_SECTION_CURONLY'),
			'PARENT' => 'BASE'
        ],
		
		'NAME_TEMPLATE' => [
			'TYPE' => 'LIST',
			'NAME' => GetMessage('INTR_ISL_PARAM_NAME_TEMPLATE'),
			'VALUES' => CIntranetUtils::GetDefaultNameTemplates(),
			'MULTIPLE' => 'N',
			'ADDITIONAL_VALUES' => 'Y',
			'DEFAULT' => '#NOBR##LAST_NAME# #NAME##/NOBR#',
			'PARENT' => 'BASE',
        ],
		
		'SHOW_ERROR_ON_NULL' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'NAME' => GetMessage('INTR_ISL_PARAM_SHOW_ERROR_ON_NULL'),
			'PARENT' => 'BASE'
        ],
		
		'USERS_PER_PAGE' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => '10',
			'NAME' => GetMessage('INTR_ISL_PARAM_USERS_PER_PAGE'),
			'PARENT' => 'BASE'
        ],
		'NAV_TITLE' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => GetMessage('INTR_ISL_PARAM_NAV_TITLE_DEFAULT'),
			'NAME' => GetMessage('INTR_ISL_PARAM_NAV_TITLE'),
			'PARENT' => 'BASE'
        ],
		'SHOW_UNFILTERED_LIST' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'N',
			'NAME' => GetMessage('INTR_ISL_PARAM_SHOW_UNFILTERED_LIST'),
			'PARENT' => 'BASE'
        ],
    ],
];
