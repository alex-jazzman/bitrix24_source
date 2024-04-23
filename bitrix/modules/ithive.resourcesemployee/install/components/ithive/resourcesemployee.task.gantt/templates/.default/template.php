<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
	die();

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Tasks\Util\DisposableAction;
use ITHive\ResourcesEmployee\Helpers\RenderJSON;

$module_id = 'ithive.resourcesemployee';
$isIFrame = $_REQUEST['IFRAME'] === 'Y';
Loc::loadMessages(__FILE__);
CUtil::InitJSCore(['popup', 'tooltip', 'gantt', 'tasks_util_query', 'task_info_popup', 'task-popups', 'CJSTask', 'resourcesemployee_gantt']);

Extension::load([
	'ui.counter',
]);
$asset=Asset::getInstance();
$asset->addJs('/bitrix/components/bitrix/tasks.list/templates/.default/script.js');
$asset->addJs('/bitrix/js/tasks/task-iframe-popup.js');
$asset->addCss('/bitrix/js/intranet/intranet-common.css');
$asset->addCss('/bitrix/js/tasks/css/tasks.css');

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'page-one-column');

if (DisposableAction::needConvertTemplateFiles())
{
	$APPLICATION->IncludeComponent('bitrix:tasks.util.process',
		'',
		array(),
		false,
		array('HIDE_ICONS' => 'Y')
	);
}
$APPLICATION->IncludeComponent('bitrix:ui.info.helper', '', []);
$APPLICATION->IncludeComponent(
	'bitrix:main.calendar',
	'',
	['SILENT' => 'Y'],
	null,
	['HIDE_ICONS' => 'Y']
);
$APPLICATION->IncludeComponent(
	'bitrix:tasks.iframe.popup',
	'.default',
	[],
	null,
	['HIDE_ICONS' => 'Y']
);

$arPaths = [
	'PATH_TO_TASKS_TASK' => $arParams['GROUP_ID'] > 0 ? $arParams['PATH_TO_GROUP_TASKS_TASK'] : $arParams['PATH_TO_USER_TASKS_TASK'],
	'PATH_TO_USER_PROFILE' => $arParams['PATH_TO_USER_PROFILE']
];
$cs = \Bitrix\Tasks\UI::translateCalendarSettings($arResult['CALENDAR_SETTINGS']);
$holidays = $cs['HOLIDAYS'];
$hours = $cs['HOURS'];
$weekEnds = $cs['WEEK_END'];
$weekStart = $cs['WEEK_START'];

$currentGroupId = $arParams['GROUP_ID'];
$canDragTasks = false;
?>
<script type="text/javascript">
    BX.message({
        TASKS_PATH_TO_USER_PROFILE: "<?php echo CUtil::JSEscape($arParams['PATH_TO_USER_PROFILE'])?>",
        TASKS_PATH_TO_TASK: "<?php echo CUtil::JSEscape($arParams['GROUP_ID'] > 0 ? $arParams['PATH_TO_GROUP_TASKS_TASK'] : $arParams["PATH_TO_USER_TASKS_TASK"])?>",
        TASKS_CANNOT_ADD_DEPENDENCY: "<?=Loc::getMessage('TASKS_CANNOT_ADD_DEPENDENCY')?>",
		TASKS_CLOSE_PAGE_CONFIRM: '<?=Loc::getMessage('TASKS_CLOSE_PAGE_CONFIRM')?>',
        RESOURCES_EMPLOYEE_EMPTY_TASKS: '<?=Loc::getMessage('RESOURCES_EMPLOYEE_EMPTY_TASKS')?>'
    });
	<?php
		$filter = $arResult['GET_LIST_PARAMS']['legacyFilter'];
		unset($filter['ONLY_ROOT_TASKS']);
	?>
    var arFilter = <?php echo CUtil::PhpToJSObject($filter)?>;
    var arOrder = <?php echo CUtil::PhpToJSObject($arResult['GET_LIST_PARAMS']['order'])?>;
    var tasksListAjaxUrl = "/bitrix/components/bitrix/tasks.list/ajax.php?SITE_ID=<?php echo SITE_ID?><?=$arParams['GROUP_ID'] ? '&GROUP_ID=' . $arParams['GROUP_ID'] : ''?>";
    var ajaxUrl = tasksListAjaxUrl;
    var tasksIFrameList = <?php echo CUtil::PhpToJSObject(array_keys($arResult['LIST']))?>;
    var ganttChart;
    var ganttFilterId = '<?=$arParams['FILTER_ID']?>';

    var ganttAux = {
        unAttachedDeps: [],
        tryAttachDeps: function (deps) {
            if (typeof deps == 'undefined' || !BX.type.isArray(deps)) {
                return;
            }
            for (var k = 0; k < deps.length; k++) {
                if (ganttChart.addDependencyFromJSON(deps[k]) == null) {
                    ganttAux.unAttachedDeps.push(deps[k]);
                }
            }
        },
        tryReattachUnattached: function () {
            var stillUnattached = [];
            for (var k = 0; k < ganttAux.unAttachedDeps.length; k++) {
                if (ganttChart.addDependencyFromJSON(ganttAux.unAttachedDeps[k]) == null) {
                    stillUnattached.push(ganttAux.unAttachedDeps[k]);
                }
            }

            ganttAux.unAttachedDeps = stillUnattached;
        },
        notificationRelease: BX.debounce(function () {
            query.deleteAll();
            query.add('task.notification.throttleRelease');
            query.execute();
        }, 1000 * 60)
    };

	BX.Tasks.GanttActions.defaultPresetId = '<?=$arResult['DEFAULT_PRESET_KEY']?>';

    var query = new BX.Tasks.Util.Query({
        url: '/bitrix/components/ithive/resourcesemployee.task.gantt/ajax.php'
    });

    query.bindEvent('executed', function (result)
	{
        if (!result.success || !result.data)
        {
            return showAjaxErrorPopup(result.clientProcessErrors, result.serverProcessErrors);
        }

        for (var k in result.data)
        {
            if (!result.data[k].SUCCESS && result.data[k].OPERATION !== 'task.dependence.add')
            {
				var message = '';
            	var errors = result.data[k].ERRORS;

            	errors.forEach(function(error)
				{
					if (error.CODE === 'ACTION_NOT_ALLOWED.RESTRICTED')
					{
						message = error.MESSAGE;
					}
				});

            	if (message !== '')
				{
					BX.UI.InfoHelper.show('limit_tasks_gantt');
					return;
				}

                return showAjaxErrorPopup(result.data[k].ERRORS);
            }

            try
			{
                if (result.data[k].OPERATION === 'task.update')
                {
                    var shifted = result.data[k].RESULT.OPERATION_RESULT.SHIFT_RESULT;

                    var lastDraggedTask = result.data[k].ARGUMENTS.id;

                    for (var taskId in shifted)
                    {
                        if (parseInt(taskId) === parseInt(lastDraggedTask))
                        {
                            continue; // do not move the main task, it will be very annoying on slow connections
                        }

                        var task = ganttChart.getTaskById(taskId);
                        if (task)
                        {
                            var s = shifted[task.id].START_DATE_PLAN_STRUCT;
                            var e = shifted[task.id].END_DATE_PLAN_STRUCT;

                            // backward correction
                            ganttChart.updateTask(task.id, {
                                dateStart: new Date(s.YEAR, s.MONTH - 1, s.DAY, s.HOUR, s.MINUTE, s.SECOND),
                                dateEnd: new Date(e.YEAR, e.MONTH - 1, e.DAY, e.HOUR, e.MINUTE, e.SECOND)
                            });
                        }
                    }
                }
                else if (result.data[k].OPERATION === 'task.dependence.add')
                {
                    if (!result.data[k].SUCCESS)
                    {
                        var from = result.data[k].ARGUMENTS.taskIdFrom;
                        var to = result.data[k].ARGUMENTS.taskIdTo;

                        var dep = ganttChart.getDependency(from, to);
                        if (dep !== null)
                        {
                            ganttChart.removeDependency(dep);

                            var messageDesc = [];
                            var trialExpired = false;

                            for (var m in result.data[k].ERRORS)
                            {
                                var error = result.data[k].ERRORS[m];

                                if (error.TYPE !== 'FATAL')
                                {
                                    continue;
                                }

                                if (error.CODE === 'ACTION_FAILED_REASON')
                                {
                                    messageDesc.push(error.MESSAGE);
                                }

                                if (error.CODE === 'TRIAL_EXPIRED')
                                {
                                    trialExpired = true;
                                    break;
                                }
                            }

                            if (trialExpired)
                            {
								BX.UI.InfoHelper.show('limit_tasks_gantt');
                            }
                            else
							{
                                if (messageDesc.length > 0)
                                {
                                    messageDesc = ': ' + messageDesc.join(', ').toLowerCase();
                                }

                                // noinspection JSAnnotator
                                showAjaxErrorPopup(BX.message('TASKS_CANNOT_ADD_DEPENDENCY') + messageDesc);
                            }
                        }
                    }
                }
            }
            catch (e) {
                BX.debug('operation failed');
                BX.debug(result.data[k]);
            }
        }

    });

    BX.ready(function () {
        // noinspection JSAnnotator
        ganttChart = new BX.IthiveGanttChart(
            BX("gantt-container"),
			<?=COption::GetOptionInt(ResourcesEmployeeTaskGanttComponent::RESOURCES_EMPLOYEE_MODULE_ID, 'remove_closed');?>,
			<?php $ts = time() + CTimeZone::GetOffset(); ?>
            new Date(
				<?php echo (int)date('Y', $ts); ?>,
				<?php echo (int)(date('n', $ts) - 1); ?>,
				<?php echo (int)date('j', $ts); ?>,
				<?php echo (int)date('G', $ts); ?>,
				<?php echo (int)date('i', $ts); ?>,
				<?php echo (int)date('s', $ts); ?>
            ),
            {
                user_id:<?=$USER->GetID()?>,
                end_date_change_setting: <?=COption::GetOptionInt($module_id,'end_date_change_setting')?>,
                hidden_without_time: <?=COption::GetOptionInt($module_id,'hidden_without_time')?>,
                disableItemNameClickHandler: true,
                disableDetailClickHandler: true,
                // noinspection JSAnnotator
                datetimeFormat: BX.message('FORMAT_DATETIME'),
                // noinspection JSAnnotator
                dateFormat: BX.message('FORMAT_DATE'),
                userProfileUrl: "<?php echo CUtil::JSEscape($arParams['PATH_TO_USER_PROFILE'])?>",
				<?php $options = CUserOptions::GetOption($module_id, 'gantt', array('gutter_offset' => 300));?>
                gutterOffset: <?php echo (int)$options['gutter_offset']?>,

				weekEnds: <?=CUtil::PhpToJSObject($weekEnds, false, false, true)?>,
                holidays: <?=CUtil::PhpToJSObject($holidays, false, false, true)?>,
                firstWeekDay: <?=(int)$weekStart?>,
                worktime: "<?=$hours?>",
                canDragTasks: <?= CUtil::PhpToJSObject($canDragTasks)?>,
                events: {
                    onGutterResize: function (gutterOffset) {
                        BX.userOptions.save('<?=$module_id?>', 'gantt', 'gutter_offset', gutterOffset);
                    },
                    onResponOpen: function (respon) {
                        BX.userOptions.save('<?=$module_id?>', 'opened_respons', respon.id, respon.opened);
                    },
                    onTaskOpen: function (task, callback)
					{
                        if (task.opened && task.hasChildren && task.childTasks.length === 0)
                        {
                            // noinspection JSAnnotator
                            var data = {
                                sessid: BX.message("bitrix_sessid"),
                                id: task.id,
                                filter: arFilter,
                                order: arOrder,
                                path_to_user: BX.message("TASKS_PATH_TO_USER_PROFILE"),
                                path_to_task: BX.message("TASKS_PATH_TO_TASK"),
                                type: "json",
                                bGannt: true,
                                mode: "load",
                                DISABLE_IFRAME_POPUP: true
                            };

                            var ganttObject = this;

                            BX.ajax({
                                method: "POST",
                                dataType: "json",
                                url: tasksListAjaxUrl,
                                data: data,
                                processData: true,
                                onsuccess: BX.delegate(function(data)
								{
									for (var i = 0, count = data.length; i < count; i++)
									{
										__RenewMenuItems(data[i]);
									}

									ganttObject.addTasksFromJSON(data);
									callback();

									// try to add unAttached
									ganttAux.tryReattachUnattached();

									// add dependences here...
									for (i = 0; i < data.length; i++)
									{
										ganttAux.tryAttachDeps(data[i].links, true);
									}
                                }, this)
                            });
                        }
                        else
						{
                            callback();
                        }
                    },
                    onTaskChange: function (updatedTasks) {

                        query.deleteAll();

                        for (var i = 0; i < updatedTasks.length; i++) {
                            if (updatedTasks[i].changes.length) {
                                var delta = {};
                                if (BX.util.in_array("dateDeadline", updatedTasks[i].changes)) {
                                    delta['DEADLINE'] = tasksFormatDate(updatedTasks[i].dateDeadline);
                                }
                                if (BX.util.in_array("dateStart", updatedTasks[i].changes)) {
                                    delta['START_DATE_PLAN'] = tasksFormatDate(updatedTasks[i].dateStart);
                                }
                                if (BX.util.in_array("dateEnd", updatedTasks[i].changes)) {
                                    delta['END_DATE_PLAN'] = tasksFormatDate(updatedTasks[i].dateEnd);
                                }
                                if (BX.util.in_array("timeEstimate", updatedTasks[i].changes)) {
                                    delta['TIME_ESTIMATE'] = updatedTasks[i].timeEstimate;
                                }
                                query.add('task.update', {
                                    id: updatedTasks[i].task.id,
                                    data: delta,
                                    parameters: {
                                        RETURN_OPERATION_RESULT_DATA: true,
                                        THROTTLE_MESSAGES: true
                                    }
                                }, {
                                    code: 'task_update'
                                });
                            }
                        }

                        query.execute();

                        ganttAux.notificationRelease();
                    },
                    onTaskMove: function (sourceId, targetId, before, newResponId, newParentId) {
                        query.deleteAll();

                        var data = {
                            sourceId: sourceId,
                            targetId: targetId,
                            before: before,
                            currentGroupId: <?=$currentGroupId?>
                        };

                        if (newResponId !== null) {
                            data.newGroupId = newResponId;
                        }

                        if (newParentId !== null) {
                            data.newParentId = newParentId;
                        }

                        query.add('task.sorting.move', {data: data}, {code: 'task_move'});
                        query.execute();
                    },
                    onDependencyAdd: function (dep) {
                        if (dep !== null && dep.from && dep.to && dep.type >= 0) {
                            query.deleteAll();
                            query.add('task.dependence.add', {
                                taskIdFrom: dep.from,
                                taskIdTo: dep.to,
                                linkType: dep.type
                            });
                            query.execute();
                        }
                    },
                    onDependencyDelete: function (dep) {
                        if (dep !== null && dep.from && dep.to) {
                            query.deleteAll();
                            query.add('task.dependence.delete', {taskIdFrom: dep.from, taskIdTo: dep.to});
                            query.execute();
                        }
                    },
                }
            }
        );

		<?// hellish hack, sorry for that?>
        window.COMPANY_WORKTIME = {
            h: <?=(int)($arResult['COMPANY_WORKTIME']['END']['H'])?>,
            m: <?=(int)($arResult['COMPANY_WORKTIME']['END']['M'])?>};

        var respons = [
			<?php $i = 0?>
			<?php foreach((array)$arResult['RESPONS'] as $arRespon):
			 $i++;
			RenderJSON::responsRenderJSON($arRespon);
            ?>
            <?php if ($i !== count($arResult['RESPONS'])):?>,<?endif?>
			<?php endforeach?>
        ];
        ganttChart.addResponsFromJSON(respons);

        var tasks = [
			<?php
			$i = 0;
			foreach($arResult['LIST'] as $arTask)
			{
			$i++;
			RenderJSON::tasksRenderJSON(
				$arTask, $arPaths, true, false, $arParams['NAME_TEMPLATE'], array(), false, array(
					'DISABLE_IFRAME_POPUP' => true,
					'USER_ID'              => 1
				)
			);

			if ($i !== count($arResult['LIST']))
			{
			?>,<?php
			}
			}
			?>
        ];

        for (var i = 0, count = tasks.length; i < count; i++) {
            __RenewMenuItems(tasks[i]);
        }

        ganttChart.addTasksFromJSON(tasks);

		<?php
		$deps = array();
		foreach ($arResult['TASKS_LINKS'] as $arTasksLinks)
		{
			if (is_array($arTasksLinks) && !empty($arTasksLinks))
			{
				foreach ($arTasksLinks as $link)
				{
					$deps[] = array('from' => (int)$link['DEPENDS_ON_ID'], 'to' => (int)$link['TASK_ID'], 'type' => (int)$link['TYPE']);
				}
			}
		}
		?>
        var deps = <?=CUtil::PhpToJSObject($deps, false, false, true)?>;
        ganttAux.tryAttachDeps(deps, true);
        ganttChart.draw();
    });

    BX.addCustomEvent(window, 'tasksTaskEvent', function (eventType, params) {

        if (BX.type.isNotEmptyString(eventType)) {
            var cbAction = eventType.toString().toUpperCase();

            params = params || {};
            params.task = params.task || {};

            var taskId = parseInt(params.task.ID);

            if (cbAction === 'DELETE' && !isNaN(taskId) && taskId) {
                onPopupTaskDeleted(params.task.ID);
            }
            else if (cbAction === 'ADD') {
                if (params.taskUgly) {
                    onPopupTaskAdded(params.taskUgly);
                }
            }
            else if (cbAction === 'UPDATE') {
                if (params.taskUgly) {
                    onPopupTaskChanged(params.taskUgly);
                }
            }
        }
    });

</script>



<?php
if ($isBitrix24Template)
{
    $this->SetViewTarget('inside_pagetitle');
}
?>
<?php $APPLICATION->IncludeComponent(
	'bitrix:tasks.interface.filter',
	'',
	array(
		'FILTER_ID' => $arResult['FILTER_ID'],
		'GRID_ID' => $arResult['GRID_ID'],
		'FILTER' => $arResult['FILTER'],
		'PRESETS' => $arResult['PRESETS'],
		'TEMPLATES_LIST' => $arParams[ 'TEMPLATES_LIST' ],

		'USER_ID' => $arParams[ 'USER_ID' ],
		'GROUP_ID' => $arParams[ 'GROUP_ID' ],
		'SPRINT_ID' => $arParams[ 'SPRINT_ID' ],
		'MENU_GROUP_ID' => -1,

		'USE_LIVE_SEARCH'=>$arParams['USE_LIVE_SEARCH'],

		'PATH_TO_USER_TASKS_TEMPLATES' => $arParams[ 'PATH_TO_USER_TASKS_TEMPLATES' ],
		'PATH_TO_USER_TASKS' => $arParams[ 'PATH_TO_USER_TASKS' ],
		'PATH_TO_USER_TASKS_TASK' => $arParams[ 'PATH_TO_USER_TASKS_TASK' ],
		'PATH_TO_GROUP_TASKS_TASK' => $arParams[ 'PATH_TO_GROUP_TASKS_TASK' ],

		'SHOW_USER_SORT'=>$arParams['SHOW_USER_SORT'],
		'USE_GROUP_SELECTOR' => $arParams['USE_GROUP_SELECTOR'],

		'USE_EXPORT' =>$arParams['USE_EXPORT'],
		'USE_GROUP_BY_SUBTASKS' => $arParams['USE_GROUP_BY_SUBTASKS'],
		'USE_GROUP_BY_GROUPS' => $arParams['USE_GROUP_BY_GROUPS'],
		'GROUP_BY_PROJECT' => $arResult['GROUP_BY_PROJECT'],
		'SHOW_QUICK_FORM_BUTTON'=> 'N',
		'POPUP_MENU_ITEMS'=>$arParams['POPUP_MENU_ITEMS'],
		'SORT_FIELD'=>$arParams['SORT_FIELD'],
		'SORT_FIELD_DIR'=>$arParams['SORT_FIELD_DIR'],

		'PROJECT_VIEW' => $arParams['PROJECT_VIEW']
	),
	array('HIDE_ICONS' => true)
);?>

<?php
if (is_array($arResult['ERROR']['FATAL']) && !empty($arResult['ERROR']['FATAL'])):
	foreach ($arResult['ERROR']['FATAL'] as $error):
		ShowError($error['MESSAGE']);
	endforeach;
	return;
endif
?>

<?php if (is_array($arResult['ERROR']['WARNING'])): ?>
	<?php foreach ($arResult['ERROR']['WARNING'] as $error): ?>
		<?php ShowError($error['MESSAGE']) ?>
	<?php endforeach ?>
<?php endif ?>
<?php
if ($isBitrix24Template)
{
    $this->EndViewTarget();
}
?>
<div id="gantt-container" class="tasks-gantt"></div>
<div class="bottom-navbar-panel">
    <table class="grid-panel-table">
        <tbody>
        <tr>
            <td style="width: 95%">
				<?=$arResult["NAV_STRING"]?>
            </td>
            <td>
                <select id="page-size-select" class="gannt-page-size">
					<?for($i=5;$i<=20;$i+=5):?>
                        <option value="<?=$i?>" <?if($i===$arResult['PAGE_SIZE']){ $isset=true; ?>selected<?}?>><?=$i?></option>
					<?endfor;?>
                    <?if(!$isset):?>
                    <option value="<?=$arResult['PAGE_SIZE']?>" selected><?=$arResult['PAGE_SIZE']?></option>
                    <?endif;?>
                </select>
            </td>
        </tr>
        </tbody>
    </table>
</div>
<?php
CJSCore::Init(array("jquery"));
$messages = Loc::loadLanguageFile(__FILE__);
?>
<script>
    BX.message(<?=CUtil::PhpToJSObject($messages)?>);
	BX.ready(function (){
	    BX.bind(BX('page-size-select'), 'change', function (){
	        location.href = '<?= $APPLICATION->GetCurPageParam("page_cnt=#SIZE#", array("page_cnt")) ?>'.replace('#SIZE#',this.value)
        })
    })
</script>