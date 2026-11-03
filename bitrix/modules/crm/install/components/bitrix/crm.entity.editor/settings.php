<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage crm
 * @copyright 2001-2016 Bitrix
 */

use Bitrix\Crm\Entity\EntityEditorConfigScope;
use Bitrix\Crm\Entity\EntityEditorOptionParser;
use Bitrix\Crm\EntityForm\ScopeAccess;
use Bitrix\Ui\EntityForm\Scope;

/**
 * Bitrix vars
 *
 * @global CUser $USER
 */

define('NO_KEEP_STATISTIC', true);
define('NO_AGENT_STATISTIC', true);
define('NOT_CHECK_PERMISSIONS', true);
require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

\Bitrix\Main\Loader::includeModule('crm');

if($USER->IsAuthorized() && check_bitrix_sessid())
{
	$guid = isset($_REQUEST['guid']) ? $_REQUEST['guid'] : '';
	if($guid === '')
	{
		echo 'ERROR: GUID IS EMPTY.';
		die();
	}

	$optionCategory = \Bitrix\Crm\Entity\EntityEditorConfig::CATEGORY_NAME;

	/*
	 * The card the right is asked for is parsed out of the guid, which is also the name the write lands
	 * under, so a guid resolving to one card can never write into the option of another. A guid that
	 * resolves to no card is answered for CRM as a whole, as every other consumer of
	 * canEditCommonView() is; the parse is not a canonicity check of the name.
	 */
	$cardOption = (new EntityEditorOptionParser())->parse($guid);
	// Asked once and only where the request is about the common layout: the personal actions of the file
	// must not pay for a right they do not read.
	$canEditCommonView = static function () use ($cardOption): bool {
		static $decision = null;

		return $decision ??= \Bitrix\Crm\Service\Container::getInstance()
			->getUserPermissions()
			->entityEditor()
			->canEditCommonView($cardOption->entityTypeId(), $cardOption->categoryId())
		;
	};

	$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';
	if($action === 'saveconfig')
	{
		$config = isset($_POST['config']) && is_array($_POST['config']) ? $_POST['config'] : array();

		if(isset($_POST['forAllUsers'])
			&& $_POST['forAllUsers'] === 'Y'
			&& $canEditCommonView()
		)
		{
			if(isset($_POST['delete']) && $_POST['delete'] === 'Y')
			{
				CUserOptions::DeleteOptionsByName($optionCategory, $guid);
			}
			CUserOptions::SetOption($optionCategory, $guid, $config, true);
		}
		CUserOptions::SetOption($optionCategory, $guid, $config);
	}
	elseif($action === 'resetconfig')
	{
		if(isset($_POST['forAllUsers'])
			&& $_POST['forAllUsers'] === 'Y'
			&& $canEditCommonView()
		)
		{
			CUserOptions::DeleteOptionsByName($optionCategory, $guid);
		}
		else
		{
			CUserOptions::DeleteOption($optionCategory, $guid);
		}
	}
	elseif($action === 'save')
	{
		$scope = isset($_POST['scope'])
			? mb_strtoupper($_POST['scope']) : EntityEditorConfigScope::UNDEFINED;
		if(!EntityEditorConfigScope::isDefined($scope))
		{
			$scope = EntityEditorConfigScope::PERSONAL;
		}

		$config = isset($_POST['config']) && is_array($_POST['config']) ? $_POST['config'] : array();
		$forAllUsers = isset($_POST['forAllUsers'])
			&& $_POST['forAllUsers'] === 'Y'
			&& $canEditCommonView();

		if($forAllUsers)
		{
			if(isset($_POST['delete']) && $_POST['delete'] === 'Y')
			{
				CUserOptions::DeleteOptionsByName($optionCategory, $guid);
			}
			CUserOptions::SetOption($optionCategory, $guid, $config, true);
		}

		if($scope === EntityEditorConfigScope::COMMON && !$canEditCommonView())
		{
			echo 'ERROR: ACCESS DENIED.';
			die();
		}

		if($scope === EntityEditorConfigScope::COMMON)
		{
			CUserOptions::SetOption($optionCategory, "{$guid}_common", $config, true);
		}
		else if($scope === EntityEditorConfigScope::PERSONAL)
		{
			CUserOptions::SetOption($optionCategory, $guid, $config);
		}
		else
		{
			$scopeId = (int)$_POST['userScopeId'];
			if (
				($scopeAccess = ScopeAccess::getInstance('crm'))
				&& $scopeAccess->canUpdate($scopeId)
			)
			{
				Scope::getInstance()->updateScopeConfig(
					$scopeId,
					$config
				);
			}
		}

		$options = isset($_POST['options']) && is_array($_POST['options']) ? $_POST['options'] : array();
		if(!empty($options))
		{
			if($scope === EntityEditorConfigScope::COMMON)
			{
				CUserOptions::SetOption($optionCategory, "{$guid}_common_opts", $options, true);
			}
			else if($scope === EntityEditorConfigScope::PERSONAL)
			{
				$optionID = "{$guid}_opts";
				if($forAllUsers)
				{
					if(isset($_POST['delete']) && $_POST['delete'] === 'Y')
					{
						CUserOptions::DeleteOptionsByName($optionCategory, $optionID);
					}
					CUserOptions::SetOption($optionCategory, $optionID, $options, true);
				}
				CUserOptions::SetOption($optionCategory, $optionID, $options);
			}
			else
			{
				/**
				 * @todo process the situation when $scope === EntityEditorConfigScope::CUSTOM
				 */
			}
		}
	}
	elseif($action === 'reset')
	{
		$scope = isset($_POST['scope'])
			? mb_strtoupper($_POST['scope']) : EntityEditorConfigScope::UNDEFINED;
		if(!EntityEditorConfigScope::isDefined($scope))
		{
			$scope = EntityEditorConfigScope::PERSONAL;
		}

		$forAllUsers = isset($_POST['forAllUsers'])
			&& $_POST['forAllUsers'] === 'Y'
			&& $canEditCommonView();

		if($scope === EntityEditorConfigScope::COMMON && !$canEditCommonView())
		{
			echo 'ERROR: ACCESS DENIED.';
			die();
		}

		if($scope === EntityEditorConfigScope::COMMON)
		{
			CUserOptions::DeleteOption($optionCategory, "{$guid}_common", true, 0);
			CUserOptions::DeleteOption($optionCategory, "{$guid}_common_opts", true, 0);
		}
		else
		{
			if($forAllUsers)
			{
				CUserOptions::DeleteOptionsByName($optionCategory, $guid);
				CUserOptions::DeleteOptionsByName($optionCategory, "{$guid}_opts");
				CUserOptions::DeleteOptionsByName($optionCategory, "{$guid}_scope");
			}
			else
			{
				CUserOptions::DeleteOption($optionCategory, $guid);
				CUserOptions::DeleteOption($optionCategory, "{$guid}_opts");
				//CUserOptions::DeleteOption($optionCategory, "{$guid}_scope");

				CUserOptions::SetOption(
					$optionCategory,
					"{$guid}_scope",
					EntityEditorConfigScope::PERSONAL
				);
			}
		}
	}
	elseif($action === 'forceCommonScopeForAll')
	{
		if ($canEditCommonView())
		{
			CUserOptions::DeleteOptionsByName($optionCategory, $guid);
			CUserOptions::DeleteOptionsByName($optionCategory, "{$guid}_scope");
		}
	}
	elseif($action === 'setScope')
	{
		$scope = isset($_POST['scope'])
			? mb_strtoupper($_POST['scope']) : EntityEditorConfigScope::UNDEFINED;

		if(EntityEditorConfigScope::isDefined($scope))
		{
			CUserOptions::SetOption($optionCategory, "{$guid}_scope", $scope);
		}
	}
	else
	{
		echo 'ERROR: ACTION IS EMPTY OR NOT SUPPORTED.';
		die();
	}
}
echo 'OK';
