<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!CModule::IncludeModule('crm'))
{
	return;
}

if (WIZARD_INSTALL_DEMO_DATA || COption::GetOptionString("crm", "form_features") == "Y")
{
	$arMenuItem = 	Array(
		GetMessage('CRM_TOP_LINKS_ITEM_NAME'),
		WIZARD_SITE_DIR.'crm/',
		Array(),
		Array(),
		"CBXFeatures::IsFeatureEnabled('crm') && CModule::IncludeModule('crm') && CCrmPerms::IsAccessEnabled()"
	);

	WizardServices::AddMenuItem(WIZARD_SITE_DIR.'.top.menu.php', $arMenuItem, WIZARD_SITE_ID, 7);
}
if (WIZARD_INSTALL_DEMO_DATA || COption::GetOptionString("crm", "form_features") == "Y")
{
	$arUrlRewrite = array();
	if (file_exists(WIZARD_SITE_ROOT_PATH."/urlrewrite.php"))
	{
		include(WIZARD_SITE_ROOT_PATH."/urlrewrite.php");
	}

	$rules = array(
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/lead/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.lead',
			'PATH' => WIZARD_SITE_DIR.'crm/lead/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/contact/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.contact',
			'PATH' => WIZARD_SITE_DIR.'crm/contact/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/company/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.company',
			'PATH' => WIZARD_SITE_DIR.'crm/company/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/deal/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.deal',
			'PATH' => WIZARD_SITE_DIR.'crm/deal/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/quote/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.quote',
			'PATH' => WIZARD_SITE_DIR.'crm/quote/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/invoice/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.invoice',
			'PATH' => WIZARD_SITE_DIR.'crm/invoice/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/fields/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.fields',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/fields/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/automation/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.automation',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/automation/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/bp/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.bp',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/bp/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/perms/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.perms',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/perms/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/product/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.product',
			'PATH' => WIZARD_SITE_DIR.'crm/product/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/catalog/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.catalog.controller',
			'PATH' => WIZARD_SITE_DIR.'crm/catalog/index.php',
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/currency/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.currency',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/currency/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/tax/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.tax',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/tax/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/locations/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.locations',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/locations/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/ps/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.ps',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/ps/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/reports/report/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.report',
			'PATH' => WIZARD_SITE_DIR.'crm/reports/report/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/mailtemplate/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.mail_template',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/mailtemplate/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/configs/exch1c/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.config.exch1c',
			'PATH' => WIZARD_SITE_DIR.'crm/configs/exch1c/index.php'
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/quote/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.quote',
			'PATH' => WIZARD_SITE_DIR.'crm/quote/index.php'
		),
		array(
			"CONDITION" => '#^'.WIZARD_SITE_DIR.'crm/configs/measure/#',
			"RULE" => '',
			"ID" => 'bitrix:crm.config.measure',
			"PATH" => WIZARD_SITE_DIR.'crm/configs/measure/index.php',
		),
		array(
			"CONDITION" => '#^'.WIZARD_SITE_DIR.'crm/configs/volume/#',
			"RULE" => '',
			"ID" => 'bitrix:crm.volume',
			"PATH" => WIZARD_SITE_DIR.'crm/configs/volume/index.php',
		),
		array(
			"CONDITION" => '#^'.WIZARD_SITE_DIR.'crm/configs/productprops/#',
			"RULE" => '',
			"ID" => "bitrix:crm.config.productprops",
			"PATH" => WIZARD_SITE_DIR.'crm/configs/productprops/index.php',
		),
		array(
			"CONDITION" => '#^' . WIZARD_SITE_DIR . 'crm/configs/preset/#',
			"RULE" => '',
			"ID" => 'bitrix:crm.config.preset',
			"PATH" => WIZARD_SITE_DIR . 'crm/configs/preset/index.php',
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/webform/#',
			'RULE' => '',
			'ID' => '',
			'PATH' => WIZARD_SITE_DIR . 'crm/webform/index.php',
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."crm/button/#",
			"RULE" => "",
			"ID" => "",
			"PATH" => WIZARD_SITE_DIR."crm/button/index.php",
		),
		array(
			"CONDITION" => "#^".WIZARD_SITE_DIR."crm/configs/exclusion/#",
			"RULE" => "",
			"ID" => "",
			"PATH" => WIZARD_SITE_DIR."crm/configs/exclusion/index.php",
		),
		array(
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'crm/tracking/#',
			'RULE' => '',
			'ID' => '',
			'PATH' => WIZARD_SITE_DIR . 'crm/tracking/index.php',
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'crm/configs/mycompany/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.company',
			'PATH' => WIZARD_SITE_DIR . 'crm/configs/mycompany/index.php',
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'crm/configs/deal_category/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.deal_category',
			'PATH' => WIZARD_SITE_DIR . 'crm/configs/deal_category/index.php',
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'crm/activity/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.activity',
			'PATH' => WIZARD_SITE_DIR . 'crm/activity/index.php',
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'crm/configs/document_numerators/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.document_numerators.list',
			'PATH' => WIZARD_SITE_DIR . 'crm/configs/document_numerators/index.php',
		),
		array(
			'CONDITION' => '#^' . WIZARD_SITE_DIR . 'crm/ml/#',
			'RULE' => '',
			'ID' => 'bitrix:crm.ml',
			'PATH' => WIZARD_SITE_DIR . 'crm/ml/index.php',
		),
	);

	foreach ($rules as $rule)
	{
		if (!in_array($rule, $arUrlRewrite))
		{
			\Bitrix\Main\UrlRewriter::add(WIZARD_SITE_ID, $rule);
		}
	}
}
if(!WIZARD_IS_RERUN || COption::GetOptionString("crm", "form_features") == "Y")
{
	// desktop on CRM index page
	$arOptions["GADGETS"] = Array (
		"CRM_MY_ACTIVITIES@1494" => Array (
			"COLUMN" => "0",
			"HIDE" => "N",
			"SETTINGS" => Array (
				"TITLE_STD" =>GetMessage('CRM_GADGET_MY_ACTIVITY'),
				"SORT_BY" => "DESC",
				"ITEM_COUNT" => "5"
			)
		),
		"CRM_DEAL_LIST@9562" => Array (
			"COLUMN" => "1",
			"ROW" => "0",
			"HIDE" => "N",
			"SETTINGS" => Array (
				"TITLE_STD" => GetMessage('CRM_GADGET_MY_DEAL_TITLE'),
				"STAGE_ID" => "WON",
				"ONLY_MY" => "N",
				"SORT" => "DATE_MODIFY",
				"SORT_BY" => "DESC",
				"DEAL_COUNT" => "3"
			)
		),
		"CRM_LEAD_LIST@27424" => Array (
			"COLUMN" => "1",
			"ROW" => "2",
			"HIDE" => "N",
			"SETTINGS" => Array (
				"TITLE_STD" =>GetMessage('CRM_GADGET_MY_LEAD_TITLE'),
				"STATUS_ID" => array("NEW","IN_PROCESS","PROCESSED","JUNK"),
				"ONLY_MY" => "N",
				"DATE_CREATE",
				"SORT_BY" => "DESC",
				"LEAD_COUNT" => "3"
			)
		),
		"desktop-actions" => Array (
			"COLUMN" => 2,
			"ROW" => 0,
			"HIDE" => "N"
		)
	);

	WizardServices::SetUserOption('intranet', '~gadgets_crm', $arOptions, $common = true);
}
if (WIZARD_INSTALL_DEMO_DATA && WIZARD_SITE_ID == "s1")
{
	$CCrmRole = new CCrmRole();
	if (method_exists(\Bitrix\Crm\Security\Role\RolePreset::class, 'GetDefaultRolesPreset'))
	{
		$arRoles = \Bitrix\Crm\Security\Role\RolePreset::GetDefaultRolesPreset();
	}
	else
	{
		$arRoles = array(
			'ADMIN' => array(
				'NAME' => GetMessage('CRM_ROLE_ADMIN'),
				'RELATION' => array(
					'LEAD' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'DEAL' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'CONTACT' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'COMPANY' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'QUOTE' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'INVOICE' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'WEBFORM' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'BUTTON' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'EXCLUSION' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'CONFIG' => array(
						'WRITE' => array('-' => 'X')
					)
				)
			),
			'HEAD' => array(
				'NAME' => GetMessage('CRM_ROLE_DIRECTOR'),
				'RELATION' => array(
					'LEAD' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'DEAL' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'CONTACT' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'COMPANY' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'QUOTE' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'INVOICE' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'WEBFORM' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'BUTTON' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'EXCLUSION' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					)
				)
			),
			'DEPUTY' => array(
				'NAME' => GetMessage('CRM_ROLE_CHIF'),
				'RELATION' => array(
					'LEAD' => array(
						'READ' => array('-' => 'D'),
						'EXPORT' => array('-' => 'D'),
						'IMPORT' => array('-' => 'D'),
						'ADD' => array('-' => 'D'),
						'WRITE' => array('-' => 'D'),
						'DELETE' => array('-' => 'D')
					),
					'DEAL' => array(
						'READ' => array('-' => 'D'),
						'EXPORT' => array('-' => 'D'),
						'IMPORT' => array('-' => 'D'),
						'ADD' => array('-' => 'D'),
						'WRITE' => array('-' => 'D'),
						'DELETE' => array('-' => 'D')
					),
					'CONTACT' => array(
						'READ' => array('-' => 'D'),
						'EXPORT' => array('-' => 'D'),
						'IMPORT' => array('-' => 'D'),
						'ADD' => array('-' => 'D'),
						'WRITE' => array('-' => 'D'),
						'DELETE' => array('-' => 'D')
					),
					'COMPANY' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'QUOTE' => array(
						'READ' => array('-' => 'D'),
						'EXPORT' => array('-' => 'D'),
						'IMPORT' => array('-' => 'D'),
						'ADD' => array('-' => 'D'),
						'WRITE' => array('-' => 'D'),
						'DELETE' => array('-' => 'D')
					),
					'INVOICE' => array(
						'READ' => array('-' => 'D'),
						'EXPORT' => array('-' => 'D'),
						'IMPORT' => array('-' => 'D'),
						'ADD' => array('-' => 'D'),
						'WRITE' => array('-' => 'D'),
						'DELETE' => array('-' => 'D')
					),
					'WEBFORM' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'BUTTON' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'EXCLUSION' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					)
				)
			),
			'MANAGER' => array(
				'NAME' => GetMessage('CRM_ROLE_MAN'),
				'RELATION' => array(
					'LEAD' => array(
						'READ' => array('-' => 'A'),
						'EXPORT' => array('-' => 'A'),
						'IMPORT' => array('-' => 'A'),
						'ADD' => array('-' => 'A'),
						'WRITE' => array('-' => 'A'),
						'DELETE' => array('-' => 'A')
					),
					'DEAL' => array(
						'READ' => array('-' => 'A'),
						'EXPORT' => array('-' => 'A'),
						'IMPORT' => array('-' => 'A'),
						'ADD' => array('-' => 'A'),
						'WRITE' => array('-' => 'A'),
						'DELETE' => array('-' => 'A')
					),
					'CONTACT' => array(
						'READ' => array('-' => 'A'),
						'EXPORT' => array('-' => 'A'),
						'IMPORT' => array('-' => 'A'),
						'ADD' => array('-' => 'A'),
						'WRITE' => array('-' => 'A'),
						'DELETE' => array('-' => 'A')
					),
					'COMPANY' => array(
						'READ' => array('-' => 'X'),
						'EXPORT' => array('-' => 'X'),
						'IMPORT' => array('-' => 'X'),
						'ADD' => array('-' => 'X'),
						'WRITE' => array('-' => 'X'),
						'DELETE' => array('-' => 'X')
					),
					'QUOTE' => array(
						'READ' => array('-' => 'A'),
						'EXPORT' => array('-' => 'A'),
						'IMPORT' => array('-' => 'A'),
						'ADD' => array('-' => 'A'),
						'WRITE' => array('-' => 'A'),
						'DELETE' => array('-' => 'A')
					),
					'INVOICE' => array(
						'READ' => array('-' => 'A'),
						'EXPORT' => array('-' => 'A'),
						'IMPORT' => array('-' => 'A'),
						'ADD' => array('-' => 'A'),
						'WRITE' => array('-' => 'A'),
						'DELETE' => array('-' => 'A')
					),
					'WEBFORM' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'BUTTON' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					),
					'EXCLUSION' => array(
						'READ' => array('-' => 'X'),
						'WRITE' => array('-' => 'X')
					)
				)
			)
		);
	}
	$iRoleIDAdm = $iRoleIDHead = $iRoleIDDeputy = $iRoleIDMan = 0;
	$obRole = CCrmRole::GetList(array(), array());
	while ($arRole = $obRole->Fetch())
	{
		if ($arRole['NAME'] == $arRoles['ADMIN']['NAME'])
		{
			$iRoleIDAdm = $arRole['ID'];
		}
		else if ($arRole['NAME'] == $arRoles['HEAD']['NAME'])
		{
			$iRoleIDHead = $arRole['ID'];
		}
		else if ($arRole['NAME'] == $arRoles['DEPUTY']['NAME'])
		{
			$iRoleIDDeputy = $arRole['ID'];
		}
		else if ($arRole['NAME'] ==  $arRoles['MANAGER']['NAME'])
		{
			$iRoleIDMan = $arRole['ID'];
		}
	}

	$relations = [];
	if ($iRoleIDAdm <= 0)
	{
		$iRoleIDAdm = $CCrmRole->Add($arRoles['ADMIN']);
	}
	if ($iRoleIDHead <= 0)
	{
		$iRoleIDHead = $CCrmRole->Add($arRoles['HEAD']);
	}
	if (WIZARD_DIRECTION_GROUP > 0)
	{
		$relations['G' . WIZARD_DIRECTION_GROUP] = [$iRoleIDHead];
	}
	if ($iRoleIDDeputy <= 0)
	{
		$iRoleIDDeputy = $CCrmRole->Add($arRoles['DEPUTY']);
	}
	if ($iRoleIDMan <= 0)
	{
		$iRoleIDMan = $CCrmRole->Add($arRoles['MANAGER']);
	}
	if (WIZARD_MARKETING_AND_SALES_GROUP > 0)
	{
		$relations['G' . WIZARD_MARKETING_AND_SALES_GROUP] = [$iRoleIDMan];
	}
	$CCrmRole->SetRelation($relations);


	/* INSTALL DEMO-DATA */
	// copy files
	CopyDirFiles(WIZARD_ABSOLUTE_PATH."/site/services/crm/images/", WIZARD_SITE_PATH.'/upload/crm', true, true);

	// Create default product catalog
	$catalogID =  CCrmCatalog::EnsureDefaultExists();
	$currencyID = CCrmCurrency::GetBaseCurrencyID();

	// Creation of demo products
	require_once("product.demo.php");
	if (COption::GetOptionString('crm', '~CRM_INVOICE_INSTALL_12_5_7', 'N') !== 'Y')
	{
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/crm/install/sale_link.php");
	}
	CCrmProductDemo::Create($catalogID);

	// Add lead
	require_once("lead.demo.php");
	$CCrmLead = new CCrmLead();
	foreach($arLeads as $ID => $arParams)
	{
		$arProductRows = null;
		if(isset($arParams['PRODUCT_ROWS']))
		{
			$arProductRows = $arParams['PRODUCT_ROWS'];
			unset($arParams['PRODUCT_ROWS']);
		}

		$arParams['CURRENCY_ID'] = $currencyID;
		$leadID = $CCrmLead->Add($arParams);
		$arLeads[$ID]['ID'] = $leadID;

		if(is_array($arProductRows))
		{
			foreach($arProductRows as &$arProductRow)
			{
				$originID = $arProductRow['ORIGIN_ID'];
				$arProduct =  CCrmProduct::GetByOriginID($originID, $catalogID);
				if(!is_array($arProduct))
				{
					continue;
				}

				CCrmLead::SaveProductRows(
					$leadID,
					array(
						array(
							'PRODUCT_ID' => intval($arProduct['ID']),
							'PRICE' => doubleval($arProduct['PRICE']),
							'QUANTITY' => 1
						)
					)
				);
			}
		}
	}

	// Add Contact
	require_once("contact.demo.php");
	$CCrmContact = new CCrmContact();
	foreach($arContacts as $ID => $arParams)
	{
		$arContacts[$ID]['ID'] = $CCrmContact->Add($arParams);
	}

	// Add Company
	require_once("company.demo.php");
	$CCrmCompany = new CCrmCompany();
	foreach($arCompany as $ID => $arParams)
	{
		$arCompany[$ID]['ID'] = $CCrmCompany->Add($arParams);
	}

	// Add Deal
	require_once("deal.demo.php");
	$CCrmDeal = new CCrmDeal();
	foreach($arDeals as $ID => &$arParams)
	{
		$arProductRows = null;
		if(isset($arParams['PRODUCT_ROWS']))
		{
			$arProductRows = $arParams['PRODUCT_ROWS'];
			unset($arParams['PRODUCT_ROWS']);
		}

		$arParams['CURRENCY_ID'] = $currencyID;
		$dealID = $CCrmDeal->Add($arParams);
		$arDeals[$ID]['ID'] = $dealID;

		if(is_array($arProductRows))
		{
			foreach($arProductRows as &$arProductRow)
			{
				$originID = $arProductRow['ORIGIN_ID'];
				$arProduct =  CCrmProduct::GetByOriginID($originID, $catalogID);
				if(!is_array($arProduct))
				{
					continue;
				}

				CCrmDeal::SaveProductRows(
					$dealID,
					array(
						array(
							'PRODUCT_ID' => intval($arProduct['ID']),
							'PRICE' => doubleval($arProduct['PRICE']),
							'QUANTITY' => 1
						)
					)
				);
			}
		}
	}

	// Add relation
	$arParams = Array('COMPANY_ID' => $arCompany['39']['ID'], 'CONTACT_ID' => $arContacts['51']['ID']);
	$CCrmLead->Update($arLeads['57']['ID'], $arParams);
}

COption::SetOptionString("crm", "form_features", "N");

//crm without leads by default
\Bitrix\Crm\Settings\LeadSettings::enableLead(false);

if (\Bitrix\Main\Loader::includeModule('intranet'))
{
	\CIntranetUtils::clearMenuCache();
}
?>