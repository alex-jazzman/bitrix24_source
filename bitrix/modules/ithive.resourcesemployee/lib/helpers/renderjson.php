<?php


namespace ITHive\ResourcesEmployee\Helpers;


use Bitrix\Main\Localization\Loc;
use Bitrix\Tasks\Util\User;
use CComponentEngine;
use COption;
use CTaskItem;
use CTasks;
use CUtil;

class RenderJSON
{
	const RESOURCES_EMPLOYEE_MODULE_ID = 'ithive.resourcesemployee';

	/**
	 * @param $arTask
	 * @param $arPaths
	 * @param bool $bParent
	 * @param bool $bGant
	 * @param bool $top
	 * @param string $nameTemplate
	 * @param array $arAdditionalFields
	 * @param bool $bSkipJsMenu
	 * @param array $params
	 */
	public static function tasksRenderJSON(
		$arTask, $arPaths, $bGant = false,
		$top = false, $nameTemplate = '', $arAdditionalFields = array(), $bSkipJsMenu = false, array $params = array()
	)
	{
		$userId = User::getId();

		if (array_key_exists('USER_ID', $params))
		{
			$profileUserId = (int)$params['USER_ID'];
		} else
		{
			$profileUserId = $userId;
		}

		if ($arTask['ACCESS'])
		{
			if ($arTask['ID'] && !isset($arTask['META:ALLOWED_ACTIONS']))
			{
				$oTask = CTaskItem::getInstanceFromPool($arTask['ID'], $userId);
				$arTask['META:ALLOWED_ACTIONS'] = $oTask->getAllowedActions(true);
			}
		} else
		{
			$arTask['META:ALLOWED_ACTIONS'] = [
				'ACTION_CHANGE_DEADLINE' => false,
				'ACTION_EDIT' => false,

			];
			if (!COption::GetOptionInt(self::RESOURCES_EMPLOYEE_MODULE_ID, 'show_title'))
			{
				$arTask['TITLE'] = Loc::getMessage('LABEL_NO_ACCESS');
				$arTask['GROUP_NAME'] = '';
			}
		}
		?>
        {
        id : <?= (int)($arTask['ID']) ?>,
        name : '<?= CUtil::JSEscape($arTask['TITLE']) ?>',
        access : '<?= CUtil::JSEscape($arTask['ACCESS']) ?>',
		<?php if ($arTask['GROUP_ID']): ?>
        projectId : <?= (int)($arTask['GROUP_ID']) ?>,
        projectName : '<?= CUtil::JSEscape($arTask['GROUP_NAME']) ?>',
	<?php else: ?>
        projectId : 0,
	<?php endif ?>
        status : '<?= tasksStatus2String($arTask['STATUS']) ?>',
        realStatus : '<?= (int)$arTask['REAL_STATUS'] ?>',
        url: '<?= CUtil::JSEscape(CComponentEngine::MakePathFromTemplate(
		$arPaths['PATH_TO_TASKS_TASK'],
		array(
			'task_id' => $arTask['ID'],
			'user_id' => $profileUserId,
			'action' => 'view',
			'group_id' => $arTask['GROUP_ID']
		)
	)) ?>',
        priority : <?= (int)($arTask['PRIORITY']) ?>,
        mark : <?php echo !$arTask['MARK'] ? 'null' : "'" . CUtil::JSEscape($arTask['MARK']) . "'" ?>,
        responsible: '<?= CUtil::JSEscape(tasksFormatNameShort($arTask['RESPONSIBLE_NAME'], $arTask['RESPONSIBLE_LAST_NAME'], $arTask['RESPONSIBLE_LOGIN'], $arTask['RESPONSIBLE_SECOND_NAME'], $nameTemplate)) ?>',
        director: '<?= CUtil::JSEscape(tasksFormatNameShort($arTask['CREATED_BY_NAME'], $arTask['CREATED_BY_LAST_NAME'], $arTask['CREATED_BY_LOGIN'], $arTask['CREATED_BY_SECOND_NAME'], $nameTemplate)) ?>',
        responsibleId : <?= (int)($arTask['RESPONSIBLE_ID']) ?>,
        directorId : <?= (int)($arTask['CREATED_BY']) ?>,
        responsible_name: '<?= CUtil::JSEscape($arTask['RESPONSIBLE_NAME']) ?>',
        responsible_second_name: '<?= CUtil::JSEscape($arTask['RESPONSIBLE_SECOND_NAME']) ?>',
        responsible_last_name: '<?= CUtil::JSEscape($arTask['RESPONSIBLE_LAST_NAME']) ?>',
        responsible_login: '<?= CUtil::JSEscape($arTask['RESPONSIBLE_LOGIN']) ?>',
        director_name: '<?= CUtil::JSEscape($arTask['CREATED_BY_NAME']) ?>',
        director_second_name: '<?= CUtil::JSEscape($arTask['CREATED_BY_SECOND_NAME']) ?>',
        director_last_name: '<?= CUtil::JSEscape($arTask['CREATED_BY_LAST_NAME']) ?>',
        director_login: '<?= CUtil::JSEscape($arTask['CREATED_BY_LOGIN']) ?>',
        dateCreated : <?tasksJSDateObject($arTask['CREATED_DATE'], $top) ?>,

        links: <?= CUtil::PhpToJSObject($arTask['LINKS'], false, false, true) ?>,

		<?php if ($arTask['START_DATE_PLAN']): ?>dateStart : <?php tasksJSDateObject($arTask['START_DATE_PLAN'], $top) ?>,<?php else: ?>dateStart: null,<?php endif ?>

		<?php if ($arTask['END_DATE_PLAN']): ?>dateEnd : <?php tasksJSDateObject($arTask['END_DATE_PLAN'], $top) ?>,<?php else: ?>dateEnd: null,<?php endif ?>

		<?php if ($arTask['DATE_START']): ?>dateStarted: <?php tasksJSDateObject($arTask['DATE_START'], $top) ?>,<?php endif ?>

        dateCompleted : <?php if ($arTask['CLOSED_DATE']): ?><?php tasksJSDateObject($arTask['CLOSED_DATE'], $top) ?><?php else: ?>null<?php endif ?>,

		<?php if ($arTask['DEADLINE']): ?>dateDeadline : <?php tasksJSDateObject($arTask['DEADLINE'], $top) ?>,<?php else: ?>dateDeadline: null,<?php endif ?>

        canEditPlanDates : <?php if ($arTask['META:ALLOWED_ACTIONS']['ACTION_CHANGE_DEADLINE']): ?>true<?php else: ?>false<?php endif ?>,

        canEdit: <?= (isset($arTask['META:ALLOWED_ACTIONS']) && $arTask['META:ALLOWED_ACTIONS']['ACTION_EDIT'] ? 'true' : 'false') ?>,

        canEditDeadline : <?php
		if ($arTask['META:ALLOWED_ACTIONS']['ACTION_CHANGE_DEADLINE'])
		{
			echo 'true';
		} else
		{
			echo 'false';
		}
		?>,
        canStartTimeTracking : <?php if ($arTask['META:ALLOWED_ACTIONS']['ACTION_START_TIME_TRACKING']): ?>true<?php else: ?>false<?php endif ?>,
        TIME_ESTIMATE : <?php echo (int)$arTask['TIME_ESTIMATE']; ?>,
        TIME_SPENT_IN_LOGS : <?php echo (int)$arTask['TIME_SPENT_IN_LOGS']; ?>,
        menuItems: [<?php tasksGetItemMenu($arTask, $arPaths, SITE_ID, $bGant, $top, $bSkipJsMenu, $params) ?>],

		<?php $arTask['SE_PARAMETER'] = is_array($arTask['SE_PARAMETER']) ? $arTask['SE_PARAMETER'] : array(); ?>
		<?php $seParameters = array(); ?>
		<?php foreach ($arTask['SE_PARAMETER'] as $v): ?>
		<?php if ($v['VALUE'] === 'Y' || $v['VALUE'] === 'N'): ?>
			<?php
            if($code == \Bitrix\Tasks\Internals\Task\ParameterTable::PARAM_SUBTASKS_AUTOCOMPLETE)
            {
                $code = 'completeTasksFromSubTasks';
            }
            elseif($code == \Bitrix\Tasks\Internals\Task\ParameterTable::PARAM_SUBTASKS_TIME)
            {
                $code = 'projectPlanFromSubTasks';
            }
			?>
			<?php $seParameters[$code] = $v['VALUE'] === 'Y'; ?>
		<?php endif ?>
	<?php endforeach ?>

        parameters: <?= json_encode($seParameters) ?>

		<?php
		foreach ($arAdditionalFields as $key => $value)
		{
			echo ', ' . $key . ' : ' . $value . '\n';
		}
		?>
        }
		<?php
	}

	/**
	 * @param $arRespon
	 */
	public static function responsRenderJSON($arRespon){
	    ?>
	    {
                id: <?=$arRespon['ID']?>,
                name: "<?=CUtil::JSEscape($arRespon['NAME']).' '.CUtil::JSEscape($arRespon['LAST_NAME'])?>",
                opened: <?=CUtil::PhpToJSObject($arRespon['EXPANDED'])?>,
                canCreateTasks: <?=CUtil::PhpToJSObject($arRespon['CAN_CREATE_TASKS'])?>,
                taskWithoutTime: <?=CUtil::PhpToJSObject($arRespon['TASK_WITHOUT_TIME'])?>,
                myTaskWithoutTime: <?=CUtil::PhpToJSObject($arRespon['MY_TASK_WITHOUT_TIME'])?>,
                canEditTasks: <?=CUtil::PhpToJSObject($arRespon['CAN_EDIT_TASKS'])?>,
                photo:<?=CUtil::PhpToJSObject($arRespon['RESPON_PHOTO']['src'])?>,
                workHours:<?=CUtil::PhpToJSObject($arRespon['UF_WORK_HOURS'])?>,
                extranet: <?=CUtil::PhpToJSObject($arRespon['EXTRANET'])?>,
                absence: [<?
					$i = 0;
					if(is_array($arRespon['ABSENCE'])){
					foreach ($arRespon['ABSENCE'] as $absence):
					$i++;
					?>
                    {
                        to: <?tasksJSDateObject($absence['TO'])?>,
                        from: <?tasksJSDateObject($absence['FROM'])?>,
                    }
					<? if ($i !== count($arRespon['ABSENCE']))
					{
					?>,<?php
					}
					endforeach;
					}
					?>
                ]
            }
            <?php
	}
}