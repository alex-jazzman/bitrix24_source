<?php

use Bitrix\Main\Localization\Loc;

class installDemoResourcesEmployee
{
	const MODULE_ID = 'ithive.resourcesemployee';
	const MODULE_NAMESPACE_UNSTALL = 'resourcesemployee';

	public function init()
	{
		//region добавление пользовательского поля "рабочие часы"
		$this->installUserFields();
		//endregion

		//region установим главное меню для всех пользователей
		$this->setmMenuItem();
		//endregion
	}

	public function installUserFields()
	{
		$userFieldsUser = $GLOBALS['USER_FIELD_MANAGER']->GetUserFields('USER');
		if (!$userFieldsUser['UF_WORK_HOURS'])
		{
			$userFields['user'][] = [
				'TITLE' => Loc::getMessage('LABEL_UF_WORK_HOURS'),
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_WORK_HOURS',
				'USER_TYPE_ID' => 'integer',
				'XML_ID' => 'UF_WORK_HOURS',
				'SORT' => '100',
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'N',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'N',
				'EDIT_FORM_LABEL' => ['ru' => Loc::getMessage('LABEL_UF_WORK_HOURS')],
				'LIST_COLUMN_LABEL' => ['ru' => Loc::getMessage('LABEL_UF_WORK_HOURS')],
				'LIST_FILTER_LABEL' => ['ru' => Loc::getMessage('LABEL_UF_WORK_HOURS')]
			];
		}

		foreach ($userFields as $type => $userFieldData)
		{
			foreach ($userFieldData as $userField)
			{
				$obUserField = new \CUserTypeEntity;
				$userFieldId = $obUserField->Add($userField);
				if (isset($userField['ENUM_VALUES']))
				{
					$enums = [];

					$i = 0;
					foreach ($userField['ENUM_VALUES'] as $enum)
					{
						$enums['n' . $i] = $enum;
						$i++;
					}

					$obEnum = new \CUserFieldEnum();
					$obEnum->SetEnumValues($userFieldId, $enums);
				}
			}
		}
	}

	// region установим главное меню для всех пользователей
	public function setmMenuItem()
	{

		$siteID = 's1';

		\COption::SetOptionString('intranet', 'left_menu_preset', 'custom', false, $siteID);

		$customItems = COption::GetOptionString('intranet', 'left_menu_custom_preset_items', '', $siteID);

		if (!empty($customItems))
		{
			$customItems = unserialize($customItems);
			if ($customItems)
			{
				$customItems = array_merge($customItems, array(array(
					'ID' => self::MODULE_NAMESPACE_UNSTALL,
					'LINK' => '/resourcesemployee/',
					'TEXT' => Loc::getMessage('TITLE_FOR_MENU')
				)
				));
			} else
			{
				$customItems[] = array(
					'ID' => self::MODULE_NAMESPACE_UNSTALL,
					'LINK' => '/resourcesemployee/',
					'TEXT' => Loc::getMessage('TITLE_FOR_MENU')
				);
			}
		} else
		{
			$customItems = array(
				'ID' => self::MODULE_NAMESPACE_UNSTALL,
				'LINK' => '/resourcesemployee/',
				'TEXT' => Loc::getMessage('TITLE_FOR_MENU')
			);
		}

		\COption::SetOptionString('intranet', 'left_menu_custom_preset_items', serialize($customItems), false, $siteID);


		$customItemsSort = \COption::GetOptionString('intranet', 'left_menu_custom_preset_sort', '', $siteID);

		if (!empty($customItemsSort))
		{
			$customItemsSort = unserialize($customItemsSort);
			if ($customItemsSort['show'])
			{
				array_unshift($customItemsSort['show'], self::MODULE_NAMESPACE_UNSTALL);
				\COption::SetOptionString('intranet', 'left_menu_custom_preset_sort', serialize($customItemsSort), false, $siteID);
			}
		}

		\CUserOptions::SetOption('intranet', 'left_menu_first_page_' . $siteID, '/resourcesemployee/');
	}

	//endregion
}

$install = new installDemoResourcesEmployee();
$install->init();