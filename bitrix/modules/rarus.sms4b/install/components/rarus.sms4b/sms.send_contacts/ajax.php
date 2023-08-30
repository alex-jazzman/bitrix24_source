<?php
const NEED_AUTH = false;
const NO_KEEP_STATISTIC = true;
//define('NOT_CHECK_PERMISSIONS', true);
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');

//IncludeModuleLangFile(__FILE__);
//IncludeTemplateLangFile(__FILE__);
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/rarus.sms4b/sms.send_contacts/lang/' . LANGUAGE_ID . '/ajax.php');

$lastNumbersFile = 'last1000.txt';
$lastThousand = (array)unserialize(file_get_contents($lastNumbersFile)); // грузим список последней 1000 номеров
$numberOccurences = array_count_values($lastThousand);

$quantity_send = COption::GetOptionString('rarus.sms4b', 'quantity_send', '5');
$exceptions_numbers = COption::GetOptionString('rarus.sms4b', 'exceptions_numbers');

// массив номеров исключений
$ar_exceptions_numbers = explode(',', $exceptions_numbers);
$i = 0;
while ($ar_exceptions_numbers[$i]) {
    $ar_exceptions_numbers[$i] = trim(substr(preg_replace('/\D+/', '', $ar_exceptions_numbers[$i]), -10));
    $i++;
}

if (!empty($_REQUEST['contact_number'])) {
    $cleanNumber = trim(substr(preg_replace('/\D+/', '', $_REQUEST['contact_number']), -10));
    if ((intval($numberOccurences[$cleanNumber]) >= $quantity_send) && (!in_array($cleanNumber,
            $ar_exceptions_numbers))) {
        $arResult['message'] = GetMessage('RARUS_SMS4B_CONTACTS_IZVINITE_V_CELAH_ZA') . $quantity_send . ' '
            . GetMessage('RARUS_SMS4B_CONTACTS_RAZ') . GetMessage('GET_CONTACTS_TEXT');
        $arResult['is_error'] = true;
        if (defined('BX_UTF') && BX_UTF) {
            $arResult['message'] = mb_convert_encoding($arResult['message'], 'UTF-8');
        } else {
            $arResult['message'] = iconv('windows-1251', 'UTF-8', $arResult['message']);
        }
        echo json_encode([$arResult]);
        exit;
    }
    $arResult['is_error'] = false;
    if (!CModule::IncludeModule('rarus.sms4b')) {
        $arResult['message'] = GetMessage('RARUS_SMS4B_CONTACTS_IZVINITE_MODULQ') . ' SMS4B '
            . GetMessage('RARUS_SMS4B_CONTACTS_NE_PODKLUCEN');
        $arResult['is_error'] = true;
        if (defined('BX_UTF') && BX_UTF) {
            $arResult['message'] = mb_convert_encoding($arResult['message'], 'UTF-8');
        } else {
            $arResult['message'] = iconv('windows-1251', 'UTF-8', $arResult['message']);
        }
        echo json_encode([$arResult]);
        exit;
    }

    $contacts_company = COption::GetOptionString('rarus.sms4b', 'contacts_company');

    try {
        $sender = new \Rarus\Sms4b\Sendings\Sender();
        $sender->componentContactSendSms([$_REQUEST['contact_number'] => $contacts_company], SITE_ID);

        if (count($lastThousand) == 100) {
            array_shift($lastThousand);
        } // выталкиваем самый старый номер
        array_push($lastThousand, $cleanNumber); // дописываем новый номер
        file_put_contents($lastNumbersFile, serialize($lastThousand)); //сохраняем список

        $arResult['message'] = GetMessage('RARUS_SMS4B_CONTACTS_SOOBSENIE_S_KONTAKTN');
    } catch (\Throwable $t) {
        $arResult['message'] = GetMessage('RARUS_SMS4B_CONTACTS_IZVINITE_SERVIS_VRE');
        $arResult['is_error'] = true;
    }

    if (defined('BX_UTF') && BX_UTF) {
        $arResult['message'] = mb_convert_encoding($arResult['message'], 'UTF-8');
    } else {
        $arResult['message'] = iconv('windows-1251', 'UTF-8', $arResult['message']);
    }
    echo json_encode([$arResult]);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_after.php');
