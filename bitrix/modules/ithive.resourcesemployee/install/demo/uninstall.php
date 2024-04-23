<?php


class uninstallDemoResourcesEmployee
{
	const MODULE_ID = 'ithive.resourcesemployee';
	const MODULE_NAMESPACE_UNSTALL = 'resourcesemployee';

	public function init()
	{
		//region удаление пользовательских свойств
		$this->uninstallUserFields();
		//endregion

		//region удалим главное меню для всех пользователей
		$this->deletemMenuItem();
		//endregion
	}


	function uninstallUserFields()
	{
		$userFields = [
			'UF_WORK_HOURS',
		];

		foreach ($userFields as $userFieldCode)
		{
			$rsData = CUserTypeEntity::GetList([], ['FIELD_NAME' => $userFieldCode]);
			if ($arRes = $rsData->Fetch())
			{
				$oUserTypeEntity = new CUserTypeEntity();
				$oUserTypeEntity->Delete($arRes['ID']);
			}
		}
	}

	//region удалим главное меню для всех пользователей
	public function deletemMenuItem(){

		$siteID = 's1';

		\COption::SetOptionString('intranet', 'left_menu_preset', '', false, $siteID);

		$customItems = COption::GetOptionString('intranet', 'left_menu_custom_preset_items', '', $siteID);

		if (!empty($customItems))
		{
			$customItems = unserialize($customItems);
			if($customItems){
				foreach ($customItems as $key => $customItem) {
					if($customItem['ID'] == self::MODULE_NAMESPACE_UNSTALL)
						unset($customItems[$key]);
				}
			}
			\COption::SetOptionString('intranet', 'left_menu_custom_preset_items', serialize($customItems), false, $siteID);
		}

		$customItemsSort = \COption::GetOptionString('intranet', 'left_menu_custom_preset_sort', '', $siteID);

		if (!empty($customItemsSort))
		{
			$customItemsSort = unserialize($customItemsSort);
			if($customItemsSort['show']) {
				foreach ($customItemsSort['show'] as &$item) {
					if ($item == self::MODULE_NAMESPACE_UNSTALL)
						unset($item);
				}
			}

			\COption::SetOptionString('intranet', 'left_menu_custom_preset_sort', serialize($customItemsSort), false, $siteID);
		}

		\CUserOptions::DeleteOption('intranet', 'left_menu_first_page_'.$siteID);
	}
	//endregion
}

$install = new uninstallDemoResourcesEmployee();
$install->init();