<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

CModule::IncludeModule('intranet');

$arComponentParameters = [
	'GROUPS' => [
		'FILTER' => [
			'NAME' => GetMessage('INTR_COMP_IS_GROUP_FILTER'),
        ],
    ],
	'PARAMETERS' => [
		'AJAX_MODE' => [],
		'STRUCTURE_PAGE' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'structure.php',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_STRUCTURE_PAGE'),
			'PARENT' => 'BASE'
        ],

		'PM_URL' => [
			'TYPE' => 'STRING',
			'DEFAULT' => '/messages/form/#USER_ID#/',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_PM_URL'),
			'PARENT' => 'BASE',
        ],
		
		'STRUCTURE_FILTER' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'structure',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_STRUCTURE_FILTER'),
			'PARENT' => 'BASE'
        ],
		'HIDE_USERS' => [
				'TYPE' => 'CHECKBOX',
				'MULTIPLE' => 'N',
				'DEFAULT' => 'N',
				'NAME' => GetMessage('HIDE_USERS'),
				'PARENT' => 'BASE'
        ],
		
		'FILTER_1C_USERS' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'N',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_FILTER_1C_USERS'),
			'PARENT' => 'BASE'
        ],
		
		'FILTER_NAME' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'users',
			'PARENT' => 'FILTER',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_FILTER_NAME'),
        ],

		'USERS_PER_PAGE' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => '20',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_USERS_PER_PAGE'),
			'PARENT' => 'BASE'
        ],

		'FILTER_DEPARTMENT_SINGLE' => [
			'TYPE' => 'LIST',
            'VALUES'   => [
                'Y' => GetMessage('INTR_COMP_IS_PARAM_FILTER_DEPARTMENT_SINGLE_VALUE_Y'),
                'N' => GetMessage('INTR_COMP_IS_PARAM_FILTER_DEPARTMENT_SINGLE_VALUE_N')
            ],
            'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'PARENT' => 'FILTER',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_FILTER_DEPARTMENT_SINGLE'),
        ],

		'FILTER_SESSION' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'PARENT' => 'FILTER',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_FILTER_SESSION'),
        ],
		
		'FILTER_SECTION_CURONLY' => [
			'TYPE' => 'LIST',
            'VALUES' => [
                'Y' => GetMessage('INTR_COMP_IS_PARAM_FILTER_SECTION_CURONLY_VALUE_Y'),
                'N' => GetMessage('INTR_COMP_IS_PARAM_FILTER_SECTION_CURONLY_VALUE_N')
            ],
			'MULTIPLE' => 'N',
			'DEFAULT' => 'N',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_FILTER_SECTION_CURONLY'),
			'PARENT' => 'BASE'
        ],
		
		'NAME_TEMPLATE' => [
			'TYPE' => 'LIST',
			'NAME' => GetMessage('INTR_ISL_PARAM_NAME_TEMPLATE'),
			'VALUES' => CIntranetUtils::GetDefaultNameTemplates(),
			'MULTIPLE' => 'N',
			'ADDITIONAL_VALUES' => 'Y',
			'DEFAULT' => "#NOBR##LAST_NAME# #NAME##/NOBR#",
			'PARENT' => 'BASE',
        ],

		
		'SHOW_ERROR_ON_NULL' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_SHOW_ERROR_ON_NULL'),
			'PARENT' => 'BASE'
        ],
		
		'NAV_TITLE' => [
			'TYPE' => 'STRING',
			'MULTIPLE' => 'N',
			'DEFAULT' => GetMessage('INTR_COMP_IS_PARAM_NAV_TITLE_DEFAULT'),
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_NAV_TITLE'),
			'PARENT' => 'BASE'
        ],
		
		'SHOW_NAV_TOP' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_SHOW_NAV_TOP'),
			'PARENT' => 'BASE'
        ],
		
		'SHOW_NAV_BOTTOM' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'Y',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_SHOW_NAV_BOTTOM'),
			'PARENT' => 'BASE'
        ],
		'SHOW_UNFILTERED_LIST' => [
			'TYPE' => 'CHECKBOX',
			'MULTIPLE' => 'N',
			'DEFAULT' => 'N',
			'NAME' => GetMessage('INTR_COMP_IS_PARAM_SHOW_UNFILTERED_LIST'),
			'PARENT' => 'BASE'
        ],
    ],
];
