<?php

/**
 * @global $find
 * @global $find_type
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Uplab\Tilda\Cache;
use Uplab\Tilda\CacheTable;

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

Loader::includeModule('uplab.tilda');

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/subscribe/prolog.php');

global $APPLICATION;

$userRights = $APPLICATION->GetGroupRight('uplab.tilda');

if ($userRights === 'D') {
    $APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));
}

$tableName = CacheTable::getTableName();

$oSort = new CAdminSorting($tableName, 'NAME', 'asc');
$lAdmin = new CAdminList($tableName, $oSort);


/*
 * Фильтр
 */
function CheckFilter()
{
    global $FilterArr, $lAdmin;
    foreach ($FilterArr as $f) {
        global $$f;
    }

    return count($lAdmin->arFilterErrors) == 0;
}

$FilterArr = [
    'find',
];

$lAdmin->InitFilter($FilterArr);

if (CheckFilter()) {
    $arFilter = [
        'NAME' => $find,
    ];
}


/*
 * Обработка действий над списком
 */
if (($tags = $lAdmin->GroupAction()) && $userRights === 'W') {
    if ($lAdmin->IsGroupActionToAll()) {
        $tagsData = CacheTable::getList([
            'select' => ['TAG']
        ])->fetchAll();

        foreach ($tagsData as $item) {
            $tags[] = $item['TAG'];
        }
        unset($item, $tagsData);
    }

    $action = $lAdmin->GetAction();

    foreach ($tags as $tag) {
        if (strlen($tag) <= 0) {
            continue;
        }

        switch ($action) {
            case 'delete':
                Cache::clearPageCache($tag);
                CacheTable::delete($tag);
                break;
        }
    }
}


/*
 * Получение элементов списка
 */
$queryParams = [];
$queryParams['order'] = [
    strtoupper($oSort->getField()) => $oSort->getOrder()
];

if ($find_type && $find) {
    $queryParams['filter'] = [
        '%' . $find_type => $find
    ];
}

$pagesListDatabase = CacheTable::getList($queryParams);

$pagesListDatabase = new CAdminResult($pagesListDatabase, $tableName);
$pagesListDatabase->NavStart();
$lAdmin->NavText($pagesListDatabase->GetNavPrint(Loc::getMessage('tilda_XXX1')));


/*
 * Подготовка списка к выводу
 */
$lAdmin->AddHeaders([
    [
        'id'      => 'TAG',
        'content' => Loc::getMessage('uplab.tilda_HEADER_TAG'),
        'sort'    => 'tag',
        'default' => false,
    ],
    [
        'id'      => 'NAME',
        'content' => Loc::getMessage('uplab.tilda_HEADER_NAME'),
        'sort'    => 'name',
        'default' => true,
    ],
    [
        'id'      => 'DATE',
        'content' => Loc::getMessage('uplab.tilda_HEADER_DATE'),
        'sort'    => 'date',
        'default' => true,
    ],
]);


while ($pageDatabase = $pagesListDatabase->NavNext(false)) {
    $row =& $lAdmin->AddRow($pageDatabase['TAG'], $pageDatabase);

    $row->AddViewField('TAG', $pageDatabase['TAG']);
    $row->AddViewField('NAME', $pageDatabase['NAME']);
    $row->AddViewField('DATE', $pageDatabase['DATE']);

    $arActions = [];

    if ($userRights >= 'W') {
        $arActions[] = [
            'ICON'   => 'delete',
            'TEXT'   => Loc::getMessage('uplab.tilda_MENU_CLEAR_CACHE'),
            'ACTION' => "if(confirm('" . Loc::getMessage('uplab.tilda_MENU_CLEAR_CACHE_COFIRM') . "')) " . $lAdmin->ActionDoGroup($pageDatabase['TAG'], 'delete')
        ];
    }

    $row->AddActions($arActions);
}


/*
 * Резюме таблицы
 */
$lAdmin->AddFooter(
    [
        [
            'title' => Loc::getMessage('MAIN_ADMIN_LIST_SELECTED'),
            'value' => $pagesListDatabase->SelectedRowsCount()
        ],
        [
            'counter' => true,
            'title'   => Loc::getMessage('MAIN_ADMIN_LIST_CHECKED'),
            'value'   => '0'
        ],
    ]
);


/*
 * Групповые действия
 */
$lAdmin->AddGroupActionTable([
    'delete' => Loc::getMessage('uplab.tilda_MENU_CLEAR_CACHE'),
]);


/*
 * Вывод
 */
$lAdmin->CheckListMode();

$APPLICATION->SetTitle(Loc::getMessage('uplab.tilda_PAGE_TITLE'));

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');


/*
 * Вывод фильтра
 */
$oFilter = new CAdminFilter(
    $tableName . '_filter',
    [
        'find_NAME' => Loc::getMessage('uplab.tilda_HEADER_NAME'),
    ]
);
?>
	<form name="find_form" method="get" action="<?php echo $APPLICATION->GetCurPage(); ?>">
        <?php
        $oFilter->Begin();
        ?>
		<tr>
			<td><b><?php echo Loc::getMessage('uplab.tilda_SEARCH_FIND') ?>:</b></td>
			<td>
				<input type="text" size="25" name="find" value="<?php echo htmlspecialchars($find) ?>">
                <?php
                $arr = [
                    'reference'    => [
                        Loc::getMessage('uplab.tilda_HEADER_NAME'),
                    ],
                    'reference_id' => [
                        'NAME',
                    ]
                ];
                echo SelectBoxFromArray('find_type', $arr, $find_type, '', '');
                ?>
			</td>
		</tr>
        <?php
        $oFilter->Buttons(['table_id' => $tableName, 'url' => $APPLICATION->GetCurPage(), 'form' => 'find_form']);
        $oFilter->End();
        ?>
	</form>
<?php

$lAdmin->DisplayList();

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php');
