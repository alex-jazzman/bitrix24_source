<?
define('STOP_STATISTICS', true);
define('BX_SECURITY_SHOW_MESSAGE', true);

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

if (!CModule::IncludeModule('crm'))
{
	return;
}
/*
 * ONLY 'POST' SUPPORTED
 * SUPPORTED MODES:
 * 'UPDATE' - update contact field
 * 'GET_USER'_INFO
 * 'GET_CLIENT_INFOS'
 * 'GET_BINGINGS' - get entity bindings
 * 'SAVE_SELECTED_BINDING' - save selected binding
 */
global $APPLICATION;

$currentUser = CCrmSecurityHelper::GetCurrentUser();
$currentUserPermissions = CCrmPerms::GetCurrentUserPermissions();
if (!$currentUser->IsAuthorized() || !check_bitrix_sessid() || $_SERVER['REQUEST_METHOD'] != 'POST')
{
	return;
}

\Bitrix\Main\Localization\Loc::loadMessages(__FILE__);
if(!function_exists('__CrmContactShowEndJsonResonse'))
{
	function __CrmContactShowEndJsonResonse($result)
	{
		$GLOBALS['APPLICATION']->RestartBuffer();
		Header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);
		if(!empty($result))
		{
			echo CUtil::PhpToJSObject($result);
		}
		if(!defined('PUBLIC_AJAX_MODE'))
		{
			define('PUBLIC_AJAX_MODE', true);
		}
		require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
		die();
	}
}
if(!function_exists('__CrmContactShowEndHtmlResonse'))
{
	function __CrmContactShowEndHtmlResonse()
	{
		if(!defined('PUBLIC_AJAX_MODE'))
		{
			define('PUBLIC_AJAX_MODE', true);
		}
		require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
		die();
	}
}

$APPLICATION->RestartBuffer();
Header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);

$mode = isset($_POST['MODE']) ? $_POST['MODE'] : '';
if($mode === '' && isset($_POST['ACTION']))
{
	$mode = $_POST['ACTION'];
}
if($mode === '')
{
	__CrmContactShowEndJsonResonse(array('ERROR'=>'MODE IS NOT DEFINED!'));
}
if($mode === 'GET_CLIENT_INFO')
{
	$userPermissions = CCrmPerms::GetCurrentUserPermissions();
	$params = isset($_POST['PARAMS']) && is_array($_POST['PARAMS']) ? $_POST['PARAMS'] : array();
	$entityTypeName = isset($params['ENTITY_TYPE_NAME']) ? $params['ENTITY_TYPE_NAME'] : '';
	if($entityTypeName === '')
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not specified.'));
	}

	$entityTypeID = CCrmOwnerType::ResolveID($entityTypeName);
	if($entityTypeID !== CCrmOwnerType::Contact)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not supported in current context.'));
	}


	$entityID = isset($params['ENTITY_ID']) ? (int)$params['ENTITY_ID'] : 0;
	if($entityID <= 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity ID is not specified.'));
	}

	if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->item()->canRead($entityTypeID, $entityID))
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Access denied.'));
	}

	$nameTemplate = isset($params['NAME_TEMPLATE'])
		? $params['NAME_TEMPLATE'] : \Bitrix\Crm\Format\PersonNameFormatter::getFormat();

	$normalizeMultifields = isset($params['NORMALIZE_MULTIFIELDS']) && $params['NORMALIZE_MULTIFIELDS'] === 'Y';

	$isReadPermitted = CCrmContact::CheckReadPermission($entityID, $userPermissions);
	$data = CCrmEntitySelectorHelper::PrepareEntityInfo(
		CCrmOwnerType::ContactName,
		$entityID,
		array(
			'ENTITY_EDITOR_FORMAT' => true,
			'REQUIRE_REQUISITE_DATA' => $isReadPermitted,
			'REQUIRE_EDIT_REQUISITE_DATA' => true,
			'REQUIRE_MULTIFIELDS' => $isReadPermitted,
			'USER_PERMISSIONS' => $userPermissions,
			'NAME_TEMPLATE' => $nameTemplate,
			'NORMALIZE_MULTIFIELDS' => $normalizeMultifields
		)
	);

	__CrmContactShowEndJsonResonse(array('DATA' => $data));
}
if($mode === 'GET_CLIENT_INFOS')
{
	$userPermissions = CCrmPerms::GetCurrentUserPermissions();
	$params = isset($_POST['PARAMS']) && is_array($_POST['PARAMS']) ? $_POST['PARAMS'] : array();
	$entityTypeName = isset($params['ENTITY_TYPE_NAME']) ? $params['ENTITY_TYPE_NAME'] : '';
	if($entityTypeName === '')
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not specified.'));
	}

	$entityTypeID = CCrmOwnerType::ResolveID($entityTypeName);
	if($entityTypeID !== CCrmOwnerType::Contact)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not supported in current context.'));
	}

	$ownerTypeName = isset($params['OWNER_TYPE_NAME']) ? $params['OWNER_TYPE_NAME'] : '';
	if($ownerTypeName === '')
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Owner type is not specified.'));
	}

	$ownerTypeID = CCrmOwnerType::ResolveID($ownerTypeName);
	if($ownerTypeID === CCrmOwnerType::Undefined)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Undefined owner type is specified.'));
	}

	$ownerID = isset($params['OWNER_ID']) ? (int)$params['OWNER_ID'] : 0;
	if($ownerID <= 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Owner ID is not specified.'));
	}

	if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->item()->canRead($ownerTypeID, $ownerID))
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Access denied.'));
	}

	$entityIDs = null;
	if($ownerTypeID === CCrmOwnerType::Company)
	{
		$entityIDs = \Bitrix\Crm\Binding\ContactCompanyTable::getCompanyContactIDs($ownerID);
	}
	elseif($ownerTypeID === CCrmOwnerType::Deal)
	{
		$entityIDs = \Bitrix\Crm\Binding\DealContactTable::getDealContactIDs($ownerID);
	}
	elseif($ownerTypeID === CCrmOwnerType::Quote)
	{
		$entityIDs = \Bitrix\Crm\Binding\QuoteContactTable::getQuoteContactIDs($ownerID);
	}

	$nameTemplate = isset($params['NAME_TEMPLATE'])
		? $params['NAME_TEMPLATE'] : \Bitrix\Crm\Format\PersonNameFormatter::getFormat();

	$data = array();
	$iteration= 0;
	foreach($entityIDs as $entityID)
	{
		$isReadPermitted = CCrmContact::CheckReadPermission($entityID, $userPermissions);
		$data[] = CCrmEntitySelectorHelper::PrepareEntityInfo(
			CCrmOwnerType::ContactName,
			$entityID,
			array(
				'ENTITY_EDITOR_FORMAT' => true,
				'REQUIRE_REQUISITE_DATA' => $isReadPermitted,
				'REQUIRE_EDIT_REQUISITE_DATA' => ($iteration === 0), // load full requisite data for first item only (due to performance optimisation)
				'REQUIRE_MULTIFIELDS' => $isReadPermitted,
				'USER_PERMISSIONS' => $userPermissions,
				'NAME_TEMPLATE' => $nameTemplate,
			)
		);
		$iteration++;
	}
	__CrmContactShowEndJsonResonse(array('DATA' => $data));
}
if($mode === 'GET_USER_INFO')
{
	$result = array();
	if(!CCrmInstantEditorHelper::PrepareUserInfo(isset($_POST['USER_ID']) ? intval($_POST['USER_ID']) : 0, $result))
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'COULD NOT PREPARE USER INFO!'));
	}
	else
	{
		__CrmContactShowEndJsonResonse(array('USER_INFO' => $result));
	}
}
if($mode === 'GET_ENTITY_SIP_INFO')
{
	$entityType = isset($_POST['ENITY_TYPE']) ? $_POST['ENITY_TYPE'] : '';
	$m = null;
	if($entityType === '' || preg_match('/^CRM_([A-Z]+)$/i', $entityType, $m) !== 1)
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'ENITY TYPE IS NOT DEFINED!'));
	}

	$entityTypeName = isset($m[1])? mb_strtoupper($m[1]) : '';
	if($entityTypeName !== CCrmOwnerType::ContactName)
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'ENITY TYPE IS NOT SUPPORTED IN CURRENT CONTEXT!'));
	}

	$entityID = isset($_POST['ENITY_ID']) ? intval($_POST['ENITY_ID']) : 0;
	if($entityID <= 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'ENITY ID IS INVALID OR NOT DEFINED!'));
	}

	$dbRes = CCrmContact::GetListEx(array(), array('=ID' => $entityID, 'CHECK_PERMISSIONS' => 'Y'), false, false, array('HONORIFIC', 'NAME', 'SECOND_NAME', 'LAST_NAME', 'COMPANY_TITLE', 'PHOTO'));
	$arRes = $dbRes ? $dbRes->Fetch() : null;
	if(!$arRes)
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'ENITY IS NOT FOUND!'));
	}
	else
	{
		$title = CCrmContact::PrepareFormattedName(
			array(
				'HONORIFIC' => isset($arRes['HONORIFIC']) ? $arRes['HONORIFIC'] : '',
				'NAME' => isset($arRes['NAME']) ? $arRes['NAME'] : '',
				'SECOND_NAME' => isset($arRes['SECOND_NAME']) ? $arRes['SECOND_NAME'] : '',
				'LAST_NAME' => isset($arRes['LAST_NAME']) ? $arRes['LAST_NAME'] : ''
			)
		);

		if(!isset($arRes['PHOTO']))
		{
			$imageUrl = '';
		}
		else
		{
			$fileInfo = CFile::ResizeImageGet(
				$arRes['PHOTO'],
				array('width' => 42, 'height' => 42),
				BX_RESIZE_IMAGE_PROPORTIONAL,
				false
			);

			$imageUrl = isset($fileInfo['src']) ? $fileInfo['src'] : '';
		}
		__CrmContactShowEndJsonResonse(
			array('DATA' =>
				array(
					'TITLE' => $title,
					'LEGEND' => isset($arRes['COMPANY_TITLE']) ? $arRes['COMPANY_TITLE'] : '',
					'IMAGE_URL' => $imageUrl,
					'SHOW_URL' => CCrmOwnerType::GetEntityShowPath(CCrmOwnerType::Contact, $entityID, false),
				)
			)
		);
	}
}
if($mode === 'GET_USER_SELECTOR')
{
	if(!CCrmContact::CheckUpdatePermission(0, $currentUserPermissions))
	{
		__CrmContactShowEndHtmlResonse();
	}

	$name = isset($_POST['NAME']) ? $_POST['NAME'] : '';

	$GLOBALS['APPLICATION']->RestartBuffer();
	Header('Content-Type: text/html; charset='.LANG_CHARSET);
	$APPLICATION->IncludeComponent(
		'bitrix:intranet.user.selector.new', '.default',
		array(
			'MULTIPLE' => 'N',
			'NAME' => $name,
			'POPUP' => 'Y',
			'SITE_ID' => SITE_ID
		),
		null,
		array('HIDE_ICONS' => 'Y')
	);
	__CrmContactShowEndHtmlResonse();
}
if($mode === 'GET_VISUAL_EDITOR')
{
	if(!CCrmContact::CheckUpdatePermission(0, $currentUserPermissions))
	{
		__CrmContactShowEndHtmlResonse();
	}

	$lheEditorID = isset($_POST['EDITOR_ID']) ? $_POST['EDITOR_ID'] : '';
	$lheEditorName = isset($_POST['EDITOR_NAME']) ? $_POST['EDITOR_NAME'] : '';

	CModule::IncludeModule('fileman');
	$GLOBALS['APPLICATION']->RestartBuffer();
	Header('Content-Type: text/html; charset='.LANG_CHARSET);

	$emailEditor = new CLightHTMLEditor();
	$emailEditor->Show(
		array(
			'id' => $lheEditorID,
			'height' => '250',
			'BBCode' => false,
			'bUseFileDialogs' => false,
			'bFloatingToolbar' => false,
			'bArisingToolbar' => false,
			'bResizable' => false,
			'autoResizeOffset' => 20,
			'jsObjName' => $lheEditorName,
			'bInitByJS' => false,
			'bSaveOnBlur' => false,
			'toolbarConfig' => array(
				'Bold', 'Italic', 'Underline', 'Strike',
				'BackColor', 'ForeColor',
				'CreateLink', 'DeleteLink',
				'InsertOrderedList', 'InsertUnorderedList', 'Outdent', 'Indent'
			)
		)
	);
	__CrmContactShowEndHtmlResonse();
}
if($mode === 'GET_BINGINGS')
{
	$userPermissions = CCrmPerms::GetCurrentUserPermissions();
	$params = isset($_POST['PARAMS']) && is_array($_POST['PARAMS']) ? $_POST['PARAMS'] : array();
	$entityTypeName = isset($params['ENTITY_TYPE_NAME']) ? $params['ENTITY_TYPE_NAME'] : '';
	if($entityTypeName === '')
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not specified.'));
	}

	$entityTypeID = CCrmOwnerType::ResolveID($entityTypeName);
	if($entityTypeID === CCrmOwnerType::Undefined)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Undefined entity type is specified.'));
	}

	$ownerTypeName = isset($params['OWNER_TYPE_NAME']) ? $params['OWNER_TYPE_NAME'] : '';
	if($ownerTypeName === '')
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Owner type is not specified.'));
	}

	$ownerTypeID = CCrmOwnerType::ResolveID($ownerTypeName);
	if($ownerTypeID === CCrmOwnerType::Undefined)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Undefined owner type is specified.'));
	}

	if($ownerTypeID !== CCrmOwnerType::Contact)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not supported in current context.'));
	}

	$ownerID = isset($params['OWNER_ID']) ? (int)$params['OWNER_ID'] : 0;
	if($ownerID <= 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Owner ID is not specified.'));
	}

	if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->item()->canRead($ownerTypeID, $ownerID))
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Access denied.'));
	}

	$formID = isset($params['FORM_ID']) ? $params['FORM_ID'] : '';

	__CrmContactShowEndJsonResonse(
		array(
			'DATA' => Bitrix\Crm\Binding\BindingHelper::prepareBindingInfos(
				$ownerTypeID,
				$ownerID,
				$entityTypeID,
				$formID
			)
		)
	);
}
if($mode === 'SAVE_SELECTED_BINDING')
{
	$currentUserID = CCrmSecurityHelper::GetCurrentUserID();
	$userPermissions = CCrmPerms::GetCurrentUserPermissions();

	$params = isset($_POST['PARAMS']) && is_array($_POST['PARAMS']) ? $_POST['PARAMS'] : array();

	$entityTypeName = isset($params['ENTITY_TYPE_NAME']) ? $params['ENTITY_TYPE_NAME'] : '';
	if($entityTypeName === '')
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not specified.'));
	}

	$entityTypeID = CCrmOwnerType::ResolveID($entityTypeName);
	if($entityTypeID !== CCrmOwnerType::Company)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not supported in current context.'));
	}

	$entityID = isset($params['ENTITY_ID']) ? (int)$params['ENTITY_ID'] : 0;
	if($entityID <= 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity ID is not specified.'));
	}

	$ownerTypeName = isset($params['OWNER_TYPE_NAME']) ? $params['OWNER_TYPE_NAME'] : '';
	if($ownerTypeName === '')
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Owner type is not specified.'));
	}

	$ownerTypeID = CCrmOwnerType::ResolveID($ownerTypeName);
	if($ownerTypeID === CCrmOwnerType::Undefined)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Undefined owner type is specified.'));
	}

	if($ownerTypeID !== CCrmOwnerType::Contact)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Entity type is not supported in current context.'));
	}

	$ownerID = isset($params['OWNER_ID']) ? (int)$params['OWNER_ID'] : 0;
	if($ownerID <= 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Owner ID is not specified.'));
	}

	if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->item()->canUpdate($ownerTypeID, $ownerID))
	{
		__CrmContactShowEndJsonResonse(array('ERROR' => 'Access denied.'));
	}

	if($currentUserID > 0)
	{
		\Bitrix\Crm\Config\EntityConfig::set(
			$ownerTypeID,
			$ownerID,
			$currentUserID,
			array('COMPANY_ID' => $entityID)
		);
	}

	__CrmContactShowEndJsonResonse(
		array(
			'DATA' => array(
				'OWNER_TYPE_NAME' => $ownerTypeName,
				'OWNER_ID' => $ownerID,
				'ENTITY_TYPE_NAME' => $entityTypeName,
				'ENTITY_ID' => $entityID
			)
		)
	);
}

$type = isset($_POST['OWNER_TYPE'])? mb_strtoupper($_POST['OWNER_TYPE']) : '';
if($type !== 'C')
{
	__CrmContactShowEndJsonResonse(array('ERROR'=>'OWNER_TYPE IS NOT SUPPORTED!'));
}

if($mode === 'UPDATE')
{
	$ID = isset($_POST['OWNER_ID']) ? $_POST['OWNER_ID'] : 0;
	if($ID <= 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'ID IS INVALID OR NOT DEFINED!'));
	}

	if(!CCrmContact::CheckUpdatePermission($ID, $currentUserPermissions))
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'PERMISSION DENIED!'));
	}

	$fieldNames = array();
	$hasUserFields = false;
	if(isset($_POST['FIELD_NAME']))
	{
		if(is_array($_POST['FIELD_NAME']))
		{
			$fieldNames = $_POST['FIELD_NAME'];
			foreach($fieldNames as $fieldName)
			{
				if(strncmp($fieldName, 'UF_', 3) === 0)
				{
					$hasUserFields = true;
					break;
				}
			}
		}
		else
		{
			$fieldNames[] = $_POST['FIELD_NAME'];
			if(!$hasUserFields)
			{
				$hasUserFields = strncmp($_POST['FIELD_NAME'], 'UF_', 3) === 0;
			}
		}
	}

	if(count($fieldNames) == 0)
	{
		__CrmContactShowEndJsonResonse(array('ERROR'=>'FIELD_NAME IS NOT DEFINED!'));
	}

	$fieldValues = array();
	if(isset($_POST['FIELD_VALUE']))
	{
		if(is_array($_POST['FIELD_VALUE']))
		{
			$fieldValues = $_POST['FIELD_VALUE'];
		}
		else
		{
			$fieldValues[] = $_POST['FIELD_VALUE'];
		}
	}
	
	$dbResult = CCrmContact::GetListEx(
		array(),
		array('=ID' => $ID, 'CHECK_PERMISSIONS' => 'N'),
		false,
		false,
		array('*', 'UF_*')
	);
	$arFields = is_object($dbResult) ? $dbResult->Fetch() : null;
	if(is_array($arFields))
	{
		//Erase COMPANY_ID field to speed-up update process
		unset($arFields['COMPANY_ID']);

		CCrmInstantEditorHelper::PrepareUpdate(CCrmOwnerType::Contact, $arFields, $fieldNames, $fieldValues);
		$entity = new CCrmContact();
		$disableUserFieldCheck = !$hasUserFields
			&& isset($_POST['DISABLE_USER_FIELD_CHECK'])
			&& mb_strtoupper($_POST['DISABLE_USER_FIELD_CHECK']) === 'Y';

		if($entity->Update($ID, $arFields, true, true, array('REGISTER_SONET_EVENT' => true, 'DISABLE_USER_FIELD_CHECK' => $disableUserFieldCheck)))
		{
			$arErrors = array();
			CCrmBizProcHelper::AutoStartWorkflows(
				CCrmOwnerType::Contact,
				$ID,
				CCrmBizProcEventType::Edit,
				$arErrors
			);

			$result = array();
			$count = count($fieldNames);
			for($i = 0; $i < $count; $i++)
			{
				$fieldName = $fieldNames[$i];
				if(mb_strpos($fieldName, 'FM.') === 0)
				{
					//Filed name like 'FM.PHONE.WORK.1279'
					$fieldParams = explode('.', $fieldName);
					if(count($fieldParams) >= 3)
					{
						$result[$fieldName] = array(
							'VIEW_HTML' =>
								CCrmViewHelper::PrepareMultiFieldHtml(
									$fieldParams[1],
									array(
										'VALUE_TYPE_ID' => $fieldParams[2],
										'VALUE' => isset($fieldValues[$i]) ? $fieldValues[$i] : ''
									)
								)
						);
					}
				}
			}

			__CrmContactShowEndJsonResonse(array('DATA' => $result));
		}
	}
}
die();
?>
