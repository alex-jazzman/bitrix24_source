<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Socialnetwork\WorkgroupTable;

//region TITLE
$APPLICATION->SetPageProperty('title', Loc::getMessage('TITLE'));
$APPLICATION->SetTitle(Loc::getMessage('TITLE'));
//endregion TITLE

Extension::load('ui.notification');
$moduleId = 'ithive.resourcesemployee';
if (is_array($arResult['LIST']))
{
	//region Groups
	$arGroupsIDs = array();
	$needGroupName = COption::GetOptionString($moduleId, 'use_projects');
	if ($needGroupName)
	{
		$arResult['GROUPS'] = array();
		$arGroupsIDs = array_column($arResult['LIST'], 'GROUP_ID');
		$rsGroups = WorkgroupTable::GetList(['select' => ['ID', 'NAME'], 'filter' => ['ID' => array_unique($arGroupsIDs)]]);
		while ($arGroup = $rsGroups->fetch())
		{
			$arResult['GROUPS'][$arGroup['ID']] = $arGroup;
		}
		foreach ($arResult['LIST'] as $key => $task)
		{
			$groupName = (strlen($arResult['GROUPS'][$task['GROUP_ID']]['NAME']) > 10) ? TruncateText($arResult['GROUPS'][$task['GROUP_ID']]['NAME'], 7) : $arResult['GROUPS'][$task['GROUP_ID']]['NAME'];
			if ($task['GROUP_ID'] > 0)
			{
				ob_start(); ?>
                <table>
                    <tr>
                        <td style="min-width: 65px"><?= $groupName ?></td>
                        <td> —</td>
                        <td><?= $task['TITLE'] ?></td>
                    </tr>
                </table>
				<?php
				$arResult['LIST'][$key]['TITLE'] = ob_get_clean();
			}
		}
	}
//endregion
} else
{
	$arResult['LIST'][0] = [];
}