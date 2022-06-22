<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage sale
 * @copyright 2001-2015 Bitrix
 */

/** !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
/** This is alfa version of component! Don't use it! */

/** !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */


use Bitrix\Iblock\ElementTable;
use Bitrix\Iblock\SectionTable;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\ArgumentNullException;
use Bitrix\Main\ArgumentOutOfRangeException;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Filter\Factory;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\NotSupportedException;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\ORM\Fields\Relations\Reference;
use Bitrix\Main\ORM\Query\Join;
use Bitrix\Main\SystemException;
use Bitrix\Main\UI\Filter\Options;
use Bitrix\Main\UserGroupTable;
use Bitrix\Main\UserTable;
use Bitrix\Tasks\Internals\Task\ParameterTable;
use Bitrix\Tasks\Internals\Task\ProjectDependenceTable;
use \Bitrix\Main\Type\DateTime;

Loc::loadMessages(__FILE__);

CBitrixComponent::includeComponentClass('bitrix:tasks.task.list');

class ResourcesEmployeeTaskGanttComponent extends TasksTaskListComponent
{
    const RESOURCES_EMPLOYEE_MODULE_ID = 'ithive.resourcesemployee';
    /**
     * @throws ArgumentException
     * @throws ArgumentNullException
     * @throws ArgumentOutOfRangeException
     * @throws ObjectPropertyException
     * @throws SystemException
     * @throws TasksException
     * @throws LoaderException
     */
    protected function getData()
    {
        global $USER;

        if (!Loader::includeModule(self::RESOURCES_EMPLOYEE_MODULE_ID))
        {
            $this->errors->setError(new Error(Loc::getMessage('MODULE_NOT_INSTALLED', array('#MODULE_ID#' => 'ithive.workplaces'))));
            return;
        }
        $this->arResult['FILTER_ID'] = 'RESOURCES_EMPLOYEE_' . SITE_ID;
        $this->getExtranetUsers();
        $this->getUserFilter();
        $this->getResponsibleData();
        $this->getResponsibleAbsence();
        if (empty($this->arResult['RESPONS']))
        {
            $this->arResult['TASKS_LINKS'] = [];
            return;
        }
        $arFilter = [
            '<STATUS' => '5',
            'RESPONSIBLE_ID' => array_column($this->arResult['RESPONS'], 'ID'),
        ];
        $arSelect = [
            '*',
            'UF_*'
        ];
        //region задачи, к которым есть доступ
        $rsTask = CTasks::GetList([], $arFilter, $arSelect);
		$ids = [];
		$hidden_without_time = COption::GetOptionInt(self::RESOURCES_EMPLOYEE_MODULE_ID,'hidden_without_time');
		while ($arTask = $rsTask->Fetch())
		{
			$ids[] = $arTask['ID'];
			if ($arTask['TIME_ESTIMATE'] > 0)
			{
				$this->arResult['LIST'][$arTask['ID']] = $arTask;
				$this->arResult['LIST'][$arTask['ID']]['ACCESS'] = true;
			} else
			{
				$this->arResult['RESPONS'][$arTask['RESPONSIBLE_ID']]['TASK_WITHOUT_TIME']++;
				if ($arTask['CREATED_BY'] == $USER->GetID())
				{
					$this->arResult['RESPONS'][$arTask['RESPONSIBLE_ID']]['MY_TASK_WITHOUT_TIME']++;
				}
				if(!$hidden_without_time){
					$this->arResult['LIST'][$arTask['ID']] = $arTask;
					$this->arResult['LIST'][$arTask['ID']]['ACCESS'] = true;
				}
			}
		}
        //endregion
        //region задачи, к которым доступа нет
        if(is_array($this->arResult['LIST'])){
            $arFilter['!ID']=$ids;
		}
		$rsTask = CTasks::GetList([], $arFilter, $arSelect, ['USER_ID' => 1]);
		while ($arTask = $rsTask->Fetch())
		{
			if ($arTask['TIME_ESTIMATE'] > 0)
			{
				$this->arResult['LIST'][$arTask['ID']] = $arTask;
				$this->arResult['LIST'][$arTask['ID']]['ACCESS'] = false;
			} else
			{
				$this->arResult['RESPONS'][$arTask['RESPONSIBLE_ID']]['TASK_WITHOUT_TIME']++;
				if(!$hidden_without_time){
					$this->arResult['LIST'][$arTask['ID']] = $arTask;
					$this->arResult['LIST'][$arTask['ID']]['ACCESS'] = true;
				}
			}
		}
		//endregion
		$taskIds = [];
        $this->arResult['TASKS_LINKS'] = [];
        //region получение связей для отрисовки
        if (is_array($this->arResult['LIST']))
        {
            foreach ($this->arResult['LIST'] as $item)
            {
                $taskId = $item['ID'];

                $taskParameters = ParameterTable::getList(['filter' => ['TASK_ID' => $taskId]])->fetchAll();
                $this->arResult['LIST'][$taskId]['SE_PARAMETER'] = $taskParameters;

                $taskIds[] = $taskId;
            }
        }

        $res = ProjectDependenceTable::getList(['filter' => ['TASK_ID' => $taskIds, 'DEPENDS_ON_ID' => $taskIds]]);
        while ($item = $res->fetch())
        {
            $this->arResult['TASKS_LINKS'][$item['TASK_ID']][] = $item;

        }
        if(Loader::includeModule('ithive.tasksexchange')){
            array_multisort(array_column($this->arResult['LIST'], 'UF_TASKS_F_1', 'ID'), SORT_ASC, $this->arResult['LIST']);
        }
        //endregion
    }

    /**
     * @throws NotSupportedException
     */
    protected function getUserFilter()
    {
        $entityFilter = Factory::createEntityFilter(
            UserTable::getUfId(),
            [
                'ID' => $this->arResult['FILTER_ID'],
                'WHITE_LIST' => $this->arParams['USER_PROPERTY_LIST']
            ]
        );
        $this->arResult['PRESETS'] = $this->getFilterPresets();
        $filterOptions = new Options($this->arResult['FILTER_ID'], $this->arResult['PRESETS']);
        $usedFields = $filterOptions->getUsedFields();
        $usedFields = array_filter(
            $usedFields,
            static function ($value) {
                return !empty($value);
            }
        );
        if (empty($usedFields))
        {
            $usedFields = $entityFilter->getDefaultFieldIDs();
        }
        $this->arResult['FILTER'] = $this->getFilterFields();
        $filterValues = $filterOptions->getFilter($this->arResult['FILTER']);
        foreach ($usedFields as $field)
        {
            if ($filterValues[$field])
            {
                if ($field === 'DEPARTMENT')
                {
                    $this->arResult['FILTER_ARRAY']['=UF_DEPARTMENT'] = preg_replace('/\D/' .
                        '/', '', $filterValues[$field]);
                } elseif ($field !== 'TAGS')
                {
                    $this->arResult['FILTER_ARRAY'][$field] = $filterValues[$field];
                }
            }
        }
        if ($this->arResult['FILTER_ARRAY']["EXTRANET"])
        {
            if ($this->arResult['FILTER_ARRAY']["EXTRANET"] === 'Y')
            {
                $this->arResult['FILTER_ARRAY']['=ID'] = $this->arResult['EXTRANET_USERS'];
            } else
            {
                $this->arResult['FILTER_ARRAY']['!=ID'] = $this->arResult['EXTRANET_USERS'];
            }
            unset($this->arResult['FILTER_ARRAY']['EXTRANET']);
        }
        $this->getUsersByGroup();
        unset($this->arResult['FILTER_ARRAY']['GROUP_ID']);
    }

    /**
     * реализует фильтр по проекту
     */
    protected function getUsersByGroup()
    {
        if (empty($this->arResult['FILTER_ARRAY']['GROUP_ID']))
        {
            return;
        }
        $rsUserToGroup = CSocNetUserToGroup::GetList([], ['GROUP_ID' => $this->arResult['FILTER_ARRAY']['GROUP_ID']], false, false, ['USER_ID']);
        $users = [];
        while ($user = $rsUserToGroup->Fetch())
        {
            $users[] = $user['USER_ID'];
        }
        if (!empty($this->arResult['FILTER_ARRAY']['=ID']))
        {
            $this->arResult['FILTER_ARRAY']['=ID'] = array_intersect($users, $this->arResult['FILTER_ARRAY']['=ID']);
        } else
        {
            $this->arResult['FILTER_ARRAY']['=ID'] = $users;
        }
    }

    /**
     * реализует фильтр экстранет
     * @throws \Bitrix\Main\ArgumentException
     * @throws \Bitrix\Main\ObjectPropertyException
     * @throws \Bitrix\Main\SystemException
     */
    protected function getExtranetUsers(){
        $this->arResult['EXTRANET_USERS'] = [];
        $ids = UserTable::getList(
            [
                'filter' => [
                    'GROUP.GROUP_ID' => \CGroup::GetIDByCode("EXTRANET"),
                    'UF_DEPARTMENT'=>false
                ],
                'select' => ['ID'],
                'runtime' => [
                    new Reference(
                        'GROUP',
                        UserGroupTable::class,
                        Join::on('this.ID', 'ref.USER_ID')
                    ),
                ],
            ])->fetchAll();
        if(!empty($ids)){
            $this->arResult['EXTRANET_USERS'] = array_column($ids, 'ID');
        }
    }
    /**
     * @return array
     */
    private function getFilterPresets(): array
    {
        global $USER;
        $result = [];
        $departments = [];
        $arDepartment = CUser::GetByID($USER->GetID())->Fetch()['UF_DEPARTMENT'];
        foreach ($arDepartment as $dep)
        {
            $departments[] = 'DR' . $dep;
        }
        $result['company'] = [
            'name' => Loc::getMessage('PRESETS_COMPANY'),
            'fields' => [
                'EXTRANET' => 'N'
            ],
            'default' => false,
        ];
        $result['department'] = [
            'name' => Loc::getMessage('PRESETS_MY_DEPARTMENT'),
            'fields' => [
                'UF_DEPARTMENT' => $departments,
            ],
            'default' => true,
        ];
        $this->arResult['DEFAULT_PRESET_KEY']='department';
        return $result;
    }

    /**
     * @return array
     */
    private function getFilterFields(): array
    {
        return [
            'GROUP_ID' => [
                'id' => 'GROUP_ID',
                'name' => Loc::getMessage('FILTER_GROUP'),
                'type' => 'dest_selector',
                'default' => TRUE,
                'params' => [
                    'context' => 'TASKS_FILTER_GROUP_ID',
                    'multiple' => 'Y',
                    'contextCode' => 'SG',
                    'enableUsers' => 'N',
                    'enableSonetgroups' => 'Y',
                    'enableDepartments' => 'N',
                    'departmentSelectDisable' => 'Y',
                    'allowAddSocNetGroup' => 'N',
                    'isNumeric' => 'Y',
                    'prefix' => 'SG'
                ]
            ],
            'UF_DEPARTMENT' => [
                'id' => 'UF_DEPARTMENT',
                'name' => Loc::getMessage('FILTER_DEPARTMENT'),
                'type' => 'dest_selector',
                'default' => TRUE,
                'params' => [
                    'context' => 'USER_LIST_FILTER_DEPARTMENT',
                    'multiple' => 'Y',
                    'contextCode' => 'DR',
                    'enableDepartments' => 'Y',
                    'departmentFlatEnable' => 'Y',
                    'enableAll' => 'N',
                    'enableUsers' => 'N',
                    'enableSonetgroups' => 'N',
                    'allowEmailInvitation' => 'N',
                    'allowSearchEmailUsers' => 'N',
                    'departmentSelectDisable' => 'N',
                    'isNumeric' => 'N',
                ]
            ],
            'ID' => [
                'id' => 'ID',
                'name' => Loc::getMessage('FILTER_EMPLOYEE'),
                'type' => 'dest_selector',
                'default' => TRUE,
                'params' => [
                    'context' => 'TASKS_FILTER_RESPONSIBLE_ID',
                    'multiple' => 'Y',
                    'contextCode' => 'U',
                    'enableSonetgroups' => 'N',
                    'enableAll' => 'N',
                    'allowEmailInvitation' => 'N',
                    'allowSearchEmailUsers' => 'Y',
                    'departmentSelectDisable' => 'Y',
                    'isNumeric' => 'Y',
                    'prefix' => 'U'
                ]
            ],
            'EXTRANET'=>[
                'id' => 'EXTRANET',
                'name' => Loc::getMessage("FILTER_EXTRANET"),
                'type' => 'list',
                'items' => ['Y'=>Loc::getMessage("FILTER_YES"),'N'=>Loc::getMessage("FILTER_NO")],
                'params' => ['multiple' => 'N'],
                'default' => true
            ],
            'ACTIVE'=>[
                'id' => 'ACTIVE',
                'name' => Loc::getMessage("FILTER_ACTIVE"),
                'type' => 'list',
                'items' => ['Y'=>Loc::getMessage("FILTER_YES"),'N'=>Loc::getMessage("FILTER_NO")],
                'params' => ['multiple' => 'N'],
                'default' => true
            ],
        ];
    }
    //endregion

    //region Responsible
    /**
     * @throws ArgumentException
     * @throws ArgumentNullException
     * @throws ArgumentOutOfRangeException
     * @throws ObjectPropertyException
     * @throws SystemException
     */
    protected function getResponsibleData()
    {
        global $APPLICATION, $USER;
        $arRuntime = [];
        //region фильтр по подразделениям (включая подразделы и нет)
        if ($this->arResult['FILTER_ARRAY']['UF_DEPARTMENT'])
        {
            $arFilterDep = ['LOGIC'=>'OR'];
            $depRecurs = [];
            foreach ($this->arResult['FILTER_ARRAY']['UF_DEPARTMENT'] as $dep){
                $id = preg_replace('/\D/', '', $dep);
                $departmentId[] = $id;
                if (strpos($dep, 'DR') !== false)
                {
                    $depRecurs[] = $id;
                }else{
                    $arFilterDep [] =['UF_DEPARTMENT'=>$id];
                }
            }
            if (!empty($depRecurs))
            {
                $iblockId = (int)Option::get('intranet', 'iblock_structure', 0);
                $rsSection = SectionTable::getList([
                    'filter' => [
                        '=IBLOCK_ID' => $iblockId,
                        '=ID' => $depRecurs
                    ],
                    'select' => ['LEFT_MARGIN', 'RIGHT_MARGIN'],
                    'limit' => 1
                ]);
                while($section = $rsSection->fetch()){
                    $arFilterDep[] = [
                        '=DEPARTMENT.IBLOCK_ID' => $iblockId,
                        '>=DEPARTMENT.LEFT_MARGIN' => $section['LEFT_MARGIN'],
                        '<=DEPARTMENT.RIGHT_MARGIN' => $section['RIGHT_MARGIN']
                    ];
                }
                $arRuntime = [
                    new Reference(
                        'DEPARTMENT',
                        SectionTable::getEntity(),
                        Join::on('this.UF_DEPARTMENT_SINGLE', 'ref.ID')
                    )];
            }
        }
        //endregion
        //region фильтр по сотрудникам
        unset($this->arResult['FILTER_ARRAY']['UF_DEPARTMENT']);
        $arFilter = $this->arResult['FILTER_ARRAY'];
        $arFilter[] = $arFilterDep;

        //endregion
        //region получение данных по сотрудникам
        $work_hours = COption::GetOptionString(self::RESOURCES_EMPLOYEE_MODULE_ID, 'work_hours');
        //region пагинация
        //region количество на странице
        if((int)$_GET['page_cnt']>0){
            $pageSize = (int)$_GET['page_cnt'];
            CUserOptions::SetOption('crm.navigation', 'resourcesnav', $pageSize, false, $USER->GetID());
        }else{
            $pageSize = CUserOptions::GetOption('crm.navigation', 'resourcesnav', 5, $USER->GetID());
        }
        //endregion

        $nav = new \Bitrix\Main\UI\PageNavigation('resourcesnav');
        $nav->allowAllRecords(true)
            ->setPageSize($pageSize)
            ->initFromUri();
        $rsRespons = UserTable::GetList([
            'filter' => $arFilter,
            'count_total' => true,
            'select' => ['*', 'UF_*'],
            'runtime' => $arRuntime,
            'offset' => $nav->getOffset(),
            'limit' => $nav->getLimit(),
        ]);
        $nav->setRecordCount($rsRespons->getCount());
        ob_start();
        $APPLICATION->IncludeComponent(
            "bitrix:main.pagenavigation",
            '',
            array(
                "NAV_OBJECT" => $nav,
                "SEF_MODE" => "N",
            ),
            false
        );
        $this->arResult['NAV_STRING'] = ob_get_contents();
        $this->arResult['PAGE_SIZE'] = $nav->getPageSize();
        ob_end_clean();
        //endregion
        while ($arRespon = $rsRespons->fetch())
        {
            $arRespon['TASK_WITHOUT_TIME'] = 0;
            $arRespon['MY_TASK_WITHOUT_TIME'] = 0;
            if (!empty($arRespon['PERSONAL_PHOTO']))
            {
                $arRespon['RESPON_PHOTO'] = CFile::ResizeImageGet($arRespon['PERSONAL_PHOTO'], ['width' => 24, 'height' => 24], BX_RESIZE_IMAGE_PROPORTIONAL, true);
            }
            if (!$arRespon['UF_WORK_HOURS'])
            {
                $arRespon['UF_WORK_HOURS'] = $work_hours;
            }
            $arRespon['EXPANDED'] = false;
            $arRespon['CAN_CREATE_TASKS'] = false;
            $arRespon['CAN_EDIT_TASKS'] = false;
            if(in_array($arRespon['ID'], $this->arResult['EXTRANET_USERS'])){
                $arRespon['EXTRANET'] = true;
            } else{
                $arRespon['EXTRANET'] = false;
            }
            $this->arResult['RESPONS'][$arRespon['ID']] = $arRespon;
        }

        //endregion
    }
//endregion

	/**
	 * @throws \Bitrix\Main\ObjectException
	 * @throws \Bitrix\Main\ObjectPropertyException
	 * @throws \Bitrix\Main\ArgumentException
	 * @throws \Bitrix\Main\SystemException
	 */
	protected function getResponsibleAbsence()
	{
		$this->arResult['RESPONS_ABSENCE'] = [];
		$iblockAbsence = COption::GetOptionInt(self::RESOURCES_EMPLOYEE_MODULE_ID, 'iblock_absence');
		if ($iblockAbsence <= 0)
		{
			return;
		}
		$filter = [
			'IBLOCK_ID'=>$iblockAbsence,
			'ACTIVE'=>'Y',
			'IBLOCK_ELEMENT_PROPS_NAME_CODE' => 'USER',
			'IBLOCK_ELEMENT_PROPS_VALUE' => array_keys($this->arResult['RESPONS']),
		];
		$select = [
			'ID', 'ACTIVE_FROM', 'ACTIVE_TO',
			'PROPS.VALUE',
			'PROPS_NAME.CODE'
		];
		$rsAbsence = ElementTable::getList([
			'filter' => $filter,
			'select' => $select,
			'runtime' => [
				new Reference('PROPS', \Bitrix\Iblock\ElementPropertyTable::class, Join::on('this.ID', 'ref.IBLOCK_ELEMENT_ID')),
				new Reference('PROPS_NAME', \Bitrix\Iblock\PropertyTable::class, Join::on('this.PROPS.IBLOCK_PROPERTY_ID', 'ref.ID'))
			],
		]);
		while ($absence = $rsAbsence->fetch())
		{
			$dateFromTimestamp = new DateTime($absence['ACTIVE_FROM']);
			$dateFromTimestamp->setTime(0, 0);
			$dateToTimestamp = new DateTime($absence['ACTIVE_TO']);
			$dateToTimestamp->setTime(23, 59);
			$this->arResult['RESPONS'][$absence['IBLOCK_ELEMENT_PROPS_VALUE']]['ABSENCE'][] = [
				'FROM'=>$dateFromTimestamp,
				'TO'=>$dateToTimestamp,
			];

		}
	}
}