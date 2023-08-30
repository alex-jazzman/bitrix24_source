<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

use \Bitrix\Main\Localization\Loc;
use \Rarus\Sms4b\Tables\IncomingTable;

Loc::loadLanguageFile(__FILE__);

if (!CModule::IncludeModule('rarus.sms4b')) {
    $error = Loc::getMessage('SMS4B_MAIN_CHECK_MODULE_OPT');
} else {
    if ($GLOBALS['APPLICATION']->GetGroupRight('rarus.sms4b') < 'R') {
        $error = Loc::getMessage('SMS4B_MAIN_CHECK_MODULE_OPT');
    }
}

if (!empty($error)) {
    require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');

    $GLOBALS['APPLICATION']->SetTitle(Loc::getMessage('SMS4B_MAIN_SMS4B_TITLE'));
    echo '<tr><td colspan="2">' . CAdminMessage::ShowMessage($error) . '</td></tr>';
    return;
}

$sTableID = 'tbl_sms_list_inc';
$oSort = new CAdminSorting($sTableID, 'MOMENT', 'desc');
$lAdmin = new CAdminList($sTableID, $oSort);

/**
 * Возвращает результат фильтрации (успешно\нет)
 *
 * @return bool - результат фильтрации (успешно\нет)
 */
function checkFilter(): bool
{
    global $filterArr, $lAdmin;
    foreach ($filterArr as $f) {
        global $f;
    }

    return count($lAdmin->arFilterErrors) === 0;
}

$filterArr = [
    'find_GUID',
    'find_Moment_from',
    'find_Moment_to',
    'find_TimeOff_from',
    'find_TimeOff_to',
    'find_Source',
    'find_Destination',
    'find_Text',
    'find_Part',
    'find_Total'
];

$lAdmin->InitFilter($filterArr);

if (checkFilter()) {
    $arFilter = [
        'GUID'        => $find_GUID,
        '>=MOMENT'    => $find_Moment_from,
        '<=MOMENT'    => $find_Moment_to,
        '>=TIMEOFF'   => $find_LastModified_from,
        '<=TIMEOFF'   => $find_LastModified_to,
        'SOURCE'      => $find_Source,
        'DESTINATION' => $find_Destination,
        'TEXT'        => $find_Text,
        'PART'        => $find_Part,
        'TOTAL'       => $find_Total
    ];

    foreach ($arFilter as $key => $val) {
        if (($key === IncomingTable::TOTAL)
            && !is_numeric($val)
            && $val !== null
        ) {
            $arFilter[$key] = [];
        } else {
            if ($val === null || $val === '') {
                unset($arFilter[$key]);
            }
        }
    }
}

$lAdmin->AddHeaders([
    ['id'      => IncomingTable::GUID,
     'content' => Loc::getMessage('SMS4B_MAIN_SMS_GUID'),
     'sort'    => IncomingTable::GUID,
     'default' => false
    ],
    [
        'id'      => IncomingTable::MOMENT,
        'content' => Loc::getMessage('SMS4B_MAIN_SMS_MOMENT'),
        'sort'    => IncomingTable::MOMENT,
        'default' => true
    ],
    [
        'id'      => IncomingTable::TIME,
        'content' => Loc::getMessage('SMS4B_MAIN_SMS_TIMEOFF'),
        'sort'    => IncomingTable::TIME,
        'align'   => 'right',
        'default' => false
    ],
    [
        'id'      => IncomingTable::SOURCE,
        'content' => Loc::getMessage('SMS4B_MAIN_SMS_SOURCE'),
        'sort'    => IncomingTable::SOURCE,
        'default' => true
    ],
    [
        'id'      => IncomingTable::DESTINATION,
        'content' => Loc::getMessage('SMS4B_MAIN_SMS_DESTINATION'),
        'sort'    => IncomingTable::DESTINATION,
        'default' => true
    ],
    [
        'id'      => IncomingTable::TEXT,
        'content' => Loc::getMessage('SMS4B_MAIN_SMS_BODY'),
        'sort'    => IncomingTable::TEXT,
        'default' => true
    ],
    [
        'id'      => IncomingTable::PART,
        'content' => Loc::getMessage('SMS4B_MAIN_SMS_PART'),
        'sort'    => IncomingTable::PART,
        'default' => false
    ],
    [
        'id'      => IncomingTable::TOTAL,
        'content' => Loc::getMessage('SMS4B_MAIN_SMS_TOTAL'),
        'sort'    => IncomingTable::TOTAL,
        'default' => true
    ]
]);

$sendingService = new \Rarus\Sms4b\Incoming\Service();
$nav = new Bitrix\Main\UI\AdminPageNavigation('in');
$nav->initFromUri();
try {
    $incoming = $sendingService->getIncomingByFilter($arFilter, $nav, [$by => strtoupper($order)]);
    $encodingService = new \Rarus\Sms4b\Encoding\Service();

    foreach ($incoming as $item) {
        $row =& $lAdmin->AddRow($item->getGuid());
        $row->AddViewField(IncomingTable::GUID, $item->getGuid());
        $row->AddViewField(IncomingTable::MOMENT, \Rarus\Sms4b\DateTimeConverter::dateTimeForUser($item->getMoment()));
        $row->AddViewField(IncomingTable::TIME, \Rarus\Sms4b\DateTimeConverter::dateTimeForUser($item->getTime()));
        $row->AddViewField(IncomingTable::SOURCE, $item->getSource());
        $row->AddViewField(IncomingTable::DESTINATION, $item->getDestination());
        $row->AddViewField(IncomingTable::TEXT, $encodingService->decodeMessage($item->getBody(),
            \Rarus\Sms4b\Encoding\Encoding::createInstanceByEncodingCode($item->getEncoding())));
        $row->AddViewField(IncomingTable::PART, $item->getPartNumber());
        $row->AddViewField(IncomingTable::TOTAL, $item->getAllPartsCount());
    }
} catch (\Rarus\Sms4b\Exceptions\Sms4bException $e) {
    $message = new CAdminMessage([
        'MESSAGE' => Loc::getMessage('SMS4B_INCOMING_SENDING_GET_ERROR'),
        'TYPE'    => 'ERROR',
        'HTML'    => true
    ]);
}
$lAdmin->setNavigation($nav, Loc::getMessage('SMS4B_MAIN_SMS_NAV'));
$lAdmin->AddFooter(
    [
        [
            'title' => Loc::getMessage('SMS4B_MAIN_MAIN_ADMIN_LIST_SELECTED'),
            'value' => $incoming->count()
        ],
        ['counter' => true, 'title' => Loc::getMessage('SMS4B_MAIN_MAIN_ADMIN_LIST_CHECKED'), 'value' => '0']
    ]
);
$lAdmin->AddAdminContextMenu();
$lAdmin->CheckListMode();

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');

$GLOBALS['APPLICATION']->SetTitle(Loc::getMessage('SMS4B_MAIN_SMS4B_TITLE'));

$oFilter = new CAdminFilter(
    $sTableID . '_filter',
    [
        Loc::getMessage('SMS4B_MAIN_SMS_F_DELIVERY'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_ACTIVE'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_SOURCE'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_DESTINATION'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_PART'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_TOTAL')
    ]
);
?>

<form name="find_form" method="get" action="<?= $GLOBALS['APPLICATION']->GetCurPage(); ?>">
    <?php $oFilter->Begin(); ?>
    <tr>
        <td>GUID</td>
        <td>
            <input type="text" name="find_GUID" size="47" value="<?php echo htmlspecialchars($find_GUID) ?>"/>
        </td>
    </tr>
    <tr>
        <td>
            <?php echo Loc::getMessage('SMS4B_MAIN_SMS_F_MOMENT') . ' (' . CLang::GetDateFormat('FULL') . '):' ?>
        </td>
        <td>
            <?php echo CalendarPeriod('find_Moment_from',
                htmlspecialcharsEx($find_Moment_from),
                'find_Moment_to',
                htmlspecialcharsEx($find_StartSend_to),
                'find_form') ?>
        </td>
    </tr>
    <tr>
        <td>
            <?php echo Loc::getMessage('SMS4B_MAIN_SMS_F_TIMEOFF') . ' (' . CLang::GetDateFormat('FULL') . '):' ?>
        </td>
        <td><?php echo CalendarPeriod('find_TimeOff_from',
                htmlspecialcharsEx($find_TimeOff_from),
                'find_TimeOff_to',
                htmlspecialcharsEx($find_TimeOff_to),
                'find_form') ?>
        </td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_SOURCE') . ':' ?></td>
        <td><input type="text" name="find_Source" size="47" value="<?php echo htmlspecialchars($find_Source) ?>"></td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_DESTINATION') . ':' ?></td>
        <td><input type="text" name="find_Destination" size="47"
                   value="<?php echo htmlspecialchars($find_Destination) ?>">
        </td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_PART') . ':' ?></td>
        <td><input type="text" name="find_Part" size="47" value="<?php echo htmlspecialchars($find_Part) ?>"></td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_TOTAL') . ':' ?></td>
        <td><input type="text" name="find_Total" size="47" value="<?php echo htmlspecialchars($find_Total) ?>"></td>
    </tr>

    <?php
    $oFilter->Buttons([
        'table_id' => $sTableID,
        'url'      => $GLOBALS['APPLICATION']->GetCurPage(),
        'form'     => 'find_form'
    ]);
    $oFilter->End();
    ?>
</form>

<?php
if(!empty($message)) {
    echo $message->Show();
}
$lAdmin->DisplayList(); ?>


<?php require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php'); ?>
