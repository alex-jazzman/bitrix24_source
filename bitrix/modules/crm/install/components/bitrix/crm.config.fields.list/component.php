<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

use Bitrix\Crm\Service\UserPermissions\ConfigurationCallSite;
use Bitrix\Crm\Service\UserPermissions\ConfigurationScope;

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

$isSettingsHub = ($arParams['IS_SETTINGS_HUB'] ?? false) === true;
$arResult['ENTITY_ID'] = $isSettingsHub
	? ($arParams['FIELS_ENTITY_ID'] ?? '')
	: ($_REQUEST['entity_id'] ?? $arParams['FIELS_ENTITY_ID']);

$CrmPerms = new CCrmPerms($USER->GetID());
$configuration = \Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->configuration();
$configurationScope = ConfigurationScope::ofUserFieldEntityId(
	is_string($arResult['ENTITY_ID']) ? $arResult['ENTITY_ID'] : ''
);
$canManageFields = $configuration->canManageFields(ConfigurationCallSite::FieldsListComponent, $configurationScope);
$canDeleteFields = $configuration->canDeleteFields(ConfigurationCallSite::FieldsListComponent, $configurationScope);
// The list itself is the read of both operations; every button and every write action below asks for
// the one operation it performs.
if (!$canManageFields && !$canDeleteFields)
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

global $USER_FIELD_MANAGER;

$CCrmFields = new CCrmFields($USER_FIELD_MANAGER, $arResult['ENTITY_ID']);
if ($CCrmFields->CheckError())
{
	$ex = $APPLICATION->GetException();
	ShowError($ex->GetString());
	return;
}

$arEntityIds = CCrmFields::GetEntityTypes();
$arResult['ENTITY_NAME'] = $arEntityIds[$arResult['ENTITY_ID']]['NAME'];

$arResult['GRID_ID'] = 'fields_list';

$arResult['~ENTITY_LIST_URL'] = $arParams['~ENTITY_LIST_URL'];
$arResult['ENTITY_LIST_URL'] = htmlspecialcharsbx($arResult['~ENTITY_LIST_URL']);

$arResult['~FIELDS_LIST_URL'] = str_replace('#entity_id#', $arResult['ENTITY_ID'], $arParams['~FIELDS_LIST_URL']);
$arResult['FIELDS_LIST_URL'] = htmlspecialcharsbx($arResult['~FIELDS_LIST_URL']);

$arResult['~FIELD_EDIT_URL'] = str_replace(	array('#entity_id#', '#field_id#'),	array($arResult['ENTITY_ID'], '0'),	$arParams['~FIELD_EDIT_URL']);
$arResult['FIELD_EDIT_URL'] = htmlspecialcharsbx($arResult['~FIELD_EDIT_URL']);

$APPLICATION->SetTitle(GetMessage('CRM_FIELDS_LIST_TITLE_EDIT', array('#NAME#' => $arResult['ENTITY_NAME'])));

global $CACHE_MANAGER;

//Form submitted
if(
	$_SERVER['REQUEST_METHOD'] == 'POST'
	&& check_bitrix_sessid()
	&& isset($_POST['action_button_'.$arResult['GRID_ID']])
)
{
	$actionButton = $_POST['action_button_'.$arResult['GRID_ID']];
	// Every branch below keeps the check of its own operation; skipped for the lack of the right, it would
	// fall through to the redirect at the end of the block and the refusal would look like a reload.
	if(($actionButton === 'delete' && !$canDeleteFields) || ($actionButton === 'edit' && !$canManageFields))
	{
		ShowError(GetMessage('CRM_PERMISSION_DENIED'));
		return;
	}

	if($canDeleteFields && $actionButton == 'delete' && isset($_POST['ID']) && is_array($_POST['ID']))
	{
		foreach($_POST['ID'] as $ID)
		{
			// The right was asked about the contour of this entity, so only a field of it may be written
			// here: CCrmFields holds the fields of the entity alone, and the sink checks nothing. A direct
			// POST naming a field of another entity is refused.
			if(!$CCrmFields->GetByID($ID))
			{
				continue;
			}

			$CCrmFields->DeleteField($ID);
		}

		//Clear components cache
		$CACHE_MANAGER->ClearByTag('crm_fields_list_'.$arResult['ENTITY_ID']);
	}

	if($canManageFields && $actionButton == 'edit' && isset($_POST['FIELDS']) && is_array($_POST['FIELDS']))
	{
		$gridID = CCrmGridOptions::GetDefaultGrigID(
			CCrmOwnerType::ResolveIDByUFEntityID($arResult['ENTITY_ID'])
		);

		foreach($_POST['FIELDS'] as $ID => &$arPostField)
		{
			$arPresetField = $CCrmFields->GetByID($ID);
			// A field the entity of this list does not own is outside the contour the right was asked
			// about, the same refusal as in the deletion above.
			if(!$arPresetField)
			{
				continue;
			}

			$arField = array();
			//Sanitaizing
			foreach($arPostField as $k => $v)
			{
				if(mb_strpos($k, '~') === 0)
				{
					continue;
				}

				$arField[$k] = $v;
			}

			if(empty($arField))
			{
				continue;
			}

			if(!$CCrmFields->UpdateField($ID, $arField))
			{
				continue;
			}

			if(isset($arField['SHOW_IN_LIST']) && $arField['SHOW_IN_LIST'] !== $arPresetField['SHOW_IN_LIST'])
			{
				if($arField['SHOW_IN_LIST'] === 'Y')
				{
					CCrmGridOptions::AddVisibleColumn($gridID, $arPresetField['FIELD_NAME']);
				}
				else
				{
					CCrmGridOptions::RemoveVisibleColumn($gridID, $arPresetField['FIELD_NAME']);
				}
			}
		}
		unset($arPostField);

		//Clear components cache
		$CACHE_MANAGER->ClearByTag('crm_fields_list_'.$arResult['ENTITY_ID']);
	}

	$actionAllRows = ($_POST['action_all_rows_' . $arResult['GRID_ID']] ?? null);
	if ($canDeleteFields && $actionAllRows === 'Y' && $actionButton === 'delete')
	{
		$arFields = $CCrmFields->GetFields();
		foreach ($arFields as $field)
		{
			$CCrmFields->DeleteField($field['ID']);
		}

		//Clear components cache
		$CACHE_MANAGER->ClearByTag('crm_fields_list_'.$arResult['ENTITY_ID']);
	}

	if(!isset($_POST['AJAX_CALL']))
	{
		LocalRedirect($isSettingsHub ? $arResult['~FIELDS_LIST_URL'] : $arResult['FIELDS_LIST_URL']);
	}
}

// The rendered entity comes from the request and not only from the component parameters, and the row
// buttons below depend on the rights - both belong to the cache key.
if($this->StartResultCache(true, array($arResult['ENTITY_ID'], $canManageFields, $canDeleteFields)))
{
	$CACHE_MANAGER->StartTagCache($this->GetCachePath());
	$CACHE_MANAGER->RegisterTag('crm_fields_list_'.$arResult['ENTITY_ID']);

	$arFields = $CCrmFields->GetFields();

	$arResult['ROWS'] = array();
	foreach($arFields as $ID => $arField)
	{
		$data = array();
		foreach($arField as $key => $value)
		{
			$data['~'.$key] = $value;
			if(is_array($value))
			{
				foreach($value as $key1=>$value1)
					if(!is_array($value1))
						$value[$key1] = htmlspecialcharsbx($value1);
				$data[$key] = $value;
			}
			else
			{
				$data[$key] = htmlspecialcharsbx($value);
			}
		}
		$data['~FIELD_EDIT_URL'] = str_replace(
			array('#entity_id#', '#field_id#'),
			array($arResult['ENTITY_ID'], $ID),
			$arParams['~FIELD_EDIT_URL']
		);

		$data['~TITLE'] = $data["~LIST_COLUMN_LABEL"] ?? '';
		if (empty($data['~TITLE']))
		{
			$data['~TITLE'] = $data["~EDIT_FORM_LABEL"] ?? '';
		}
		if (empty($data['~TITLE']))
		{
			$data['~TITLE'] = $data["~LIST_FILTER_LABEL"] ?? '';
		}
		$data['TITLE'] = htmlspecialcharsbx($data['~TITLE']);

		$data['FIELD_EDIT_URL'] = htmlspecialcharsbx($data['~FIELD_EDIT_URL']);
		$aCols = [
			'TYPE' => $data['USER_TYPE']['DESCRIPTION'],
			'MANDATORY' => $data['USER_TYPE']['DESCRIPTION'],
			'TITLE' => '<a target="_self"'
				. ' data-testid="crm-config-fields-list-edit-link-' . (int)$data['ID'] . '"'
				. ($isSettingsHub ? ' data-slider-ignore-autobinding="true"' : '')
				. ' href="' . $data["FIELD_EDIT_URL"] . '">'
				. ($data["TITLE"])
				. '</a>'
		];

		$aActions = array();
		if($canManageFields)
		{
			$aActions[] = array(
				'ICONCLASS' => 'edit',
				'TEXT' => GetMessage('CRM_FIELDS_LIST_ACTION_MENU_EDIT'),
				'ONCLICK' => $isSettingsHub
					? "window.location.href = '" . CUtil::JSEscape($data['~FIELD_EDIT_URL']) . "';"
					: "jsUtils.Redirect(arguments, '" . CUtil::JSEscape($data["~FIELD_EDIT_URL"]) . "')",
				'DEFAULT' => true,
			);
		}

		if($canDeleteFields)
		{
			if(!empty($aActions))
			{
				$aActions[] = array('SEPARATOR' => true);
			}

			$aActions[] = array(
				'ICONCLASS' => 'delete',
				'TEXT' => GetMessage('CRM_FIELDS_LIST_ACTION_MENU_DELETE'),
				'ONCLICK' => "bxGrid_".$arResult["GRID_ID"].".DeleteItem('".$arField["ID"]."', '".GetMessage("CRM_FIELDS_LIST_ACTION_MENU_DELETE_CONF")."')",
			);
		}

		$aEditable = array();

		$arResult['ROWS'][] = [
			'id' => $arField['ID'],
			'data'=> $data,
			'actions'=> $aActions,
			'columns'=> $aCols,
			'editable'=> $aEditable,
		];
	}

	$CACHE_MANAGER->EndTagCache();
	$this->EndResultCache();
}

// The toolbar and the group actions of the template are built on every request, so the rights are put
// into the result after the cache block - a cached result would answer for the rights it was built with.
$arResult['CAN_MANAGE_FIELDS'] = $canManageFields;
$arResult['CAN_DELETE_FIELDS'] = $canDeleteFields;

$this->IncludeComponentTemplate();

$APPLICATION->AddChainItem(GetMessage('CRM_FIELDS_ENTITY_LIST'), $arResult['~ENTITY_LIST_URL']);
$APPLICATION->AddChainItem($arResult['ENTITY_NAME'], $arResult['~FIELDS_LIST_URL']);
?>
