<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Application;
use Bitrix\Main\Page\Asset;
use Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError;
use Rarus\Sms4b\Exceptions\Sms4bException;
use \Rarus\Sms4b\Sendings\Sender;
use Rarus\Sms4b\Sendings\Source;
use Rarus\Sms4b\Config\Service as ConfigService;

Loc::loadLanguageFile(__FILE__);

$module_id = 'rarus.sms4b';
$gmt = $timestampStartUp = $numbersForSendCount = $period = $sender = $destination = 0;
$errorMessages = '';
$arPhonesMessages = $arPhones = [];
$requestData = Application::getInstance()->getContext()->getRequest();

if ($GLOBALS['APPLICATION']->GetGroupRight('rarus.sms4b') < 'R') {
    $GLOBALS['APPLICATION']->AuthForm(Loc::getMessage('SMS4B_MAIN_SMS4B_MAIN_ACCESS_DENIED'));
}

Loader::includeModule('rarus.sms4b');
$sms4b = new Csms4b();

$arTime = localtime(time(), true);

Asset::getInstance()->addJs('/bitrix/js/' . $module_id . '/jquery.js');
Asset::getInstance()->addJs('/bitrix/js/' . $module_id . '/sms4b_sendsms.js');
$GLOBALS['APPLICATION']->SetAdditionalCSS('/bitrix/js/' . $module_id . '/css/sms4b_sendsms.css');


$arResult['RESULT_MESSAGE']['TYPE'] = '';

try {
    $arResult['BALANCE'] = $sms4b->getBalance();
    $arResult['ADDRESSES'] = $sms4b->getAllSenders();
} catch (Sms4bException $t) {
    $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
    $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_MOD_OPTIONS');
    $arResult['CAN_SEND'] = 'N';
}
    if ($arResult['BALANCE'] !== null && $arResult['BALANCE'] < 0.1) {
        $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
        $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_SMS4B_MAIN_NO_MESSAGES') . '<br>';
        $arResult['CAN_SEND'] = 'N';
    } else {
        if (strlen($requestData->getPost('apply')) > 0) {
            //take data entered by user
            $sender = htmlspecialchars($requestData->getPost('sender_number'));
            $message = $requestData->getPost('message');

            //need message about sending?
            $request = ($requestData->getPost('reply') === 'on') ? 0 : 1;

            $destination = $sms4b->parse_numbers($requestData->getPost('destination_number'));
            $numbersForSendCount = count($destination);

            $arResult['DOUBLED_NUMBERS'] = $sms4b->doubled_numbers;

            $dataFieldError = false;

            if ($arResult['BALANCE'] > 100 && in_array($sms4b::TEST_SENDER, $arResult['ADDRESSES'])) {
                $dataFieldError = true;
                $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_BLOCK_SMS')
                    . " <a href=\"https:\/\/www.sms4b.ru/office/settings/names.php\" target=\"_blank\">"
                    . Loc::getMessage('SMS4B_MAIN_ORDER_SMS_NAME') . '</a>';
            }

            if ($sender == '' || !in_array($sender, $arResult['ADDRESSES'])) {
                $dataFieldError = true;
                $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_ERROR_NOT_SET_SENDER_NUMBER');
            }

            if ($numbersForSendCount == 0
                || $requestData->getPost('destination_number') == Loc::getMessage('SMS4B_MAIN_DEST_COMMENT')) {
                $dataFieldError = true;
                $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_ERROR_NOT_SET_DEST_NUMBERS');
            }

            if ($message == '' || $requestData->getPost('message') == Loc::getMessage('SMS4B_MAIN_TEXT_COMMENT')) {
                $dataFieldError = true;
                $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_ERROR_NOT_SET_TEXT');
            }

            if (!$requestData->getPost('BEGIN_SEND_AT')) {
                $startUp = null;
            } else {
                try {
                    $startUp = new \DateTime($requestData->getPost('BEGIN_SEND_AT'));
                } catch (\Exception $e) {
                    $dataFieldError = true;
                    $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                    $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_ERROR_BEGIN_SEND');
                }
            }

            if ($requestData->getPost('ACTIVE_DATE_ACTUAL') !== 'Y'
                || ($requestData->getPost('DATE_ACTUAL') === null)) {
                $dateActual = null;
            } else {
                try {
                    $dateActual = new \DateTime($requestData->getPost('DATE_ACTUAL'));
                } catch (\Exception $e) {
                    $dataFieldError = true;
                    $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                    $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_MAIN_ERROR_ACTUAL_DATE');
                }
            }

            if ($requestData->getPost('ACTIVE_NIGHT_TIME_NS') !== 'Y'
                || ($requestData->getPost('DATE_FROM_NS') === null
                    && $requestData->getPost('DATE_TO_NS') === null)) {
                $period = '';
            } else {
                $period = $requestData->getPost('DATE_FROM_NS') . $requestData->getPost('DATE_TO_NS');
            }
            $translit = ($requestData->getPost('translit') === 'Y');

            $arPhones = $sms4b->parse_numbers($requestData->getPost('destination_number'));
            if (!$dataFieldError) {
                foreach ($arPhones as $phone) {
                    $arPhonesMessages[$phone] = $requestData->getPost('message');
                }

                $arResult['RESULT_MESSAGE']['TYPE'] = 'OK';
                $senderService = new Sender();
                try {
                    $senderService->formSendSms($arPhonesMessages,
                        $sender,
                        $translit,
                        Source\Source::createSourceInstance(Source\AdminForm::ADMIN_FORM),
                        $startUp,
                        $dateActual,
                        $period
                    );
                } catch (Sms4bValidationError $error) {
                    $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                    $arResult['RESULT_MESSAGE']['MESSAGE'][] = $error->getMessage();
                    $arResult['CAN_SEND'] = 'N';
                } catch (Sms4bException $e) {
                    $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
                    $arResult['RESULT_MESSAGE']['MESSAGE'][] = Loc::getMessage('SMS4B_SEND_SMS_ERROR');
                    $arResult['CAN_SEND'] = 'N';
                }
            }
        }
    }

if ($arResult['RESULT_MESSAGE']['TYPE'] === 'ERROR') {
    $arError = $arResult['RESULT_MESSAGE']['MESSAGE'];
    $dest = htmlspecialchars($requestData->getPost('destination_number'));
    $sender = htmlspecialchars($requestData->getPost('sender_number'));
    $mess = htmlspecialchars($requestData->getPost('message'));
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');
?>
<form name="form1" method="POST" action="<?= $GLOBALS['APPLICATION']->GetCurPage() ?>"
      onsubmit="form1.sub.disabled=true;">
    <script>
        $(document).ready(function () {
            var params = {};
            params.summerTime = '<?=($arTime['tm_isdst'] > 0) ? 1 : 0?>';
            var obSendingForm = new SendingForm(params);
        })
    </script>

    <?= bitrix_sessid_post() ?>
    <input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">

    <?php
    $aTabs = [
        [
            'DIV'   => 'edit1',
            'TAB'   => Loc::getMessage('SMS4B_MAIN_SEND_MESS'),
            'ICON'  => 'sms4b_sendsms',
            'TITLE' => Loc::getMessage('SMS4B_MAIN_SEND_MESS')
        ]
    ];
    $tabControl = new CAdminTabControl('tabControl', $aTabs);
    ?>

    <?php
    $tabControl->Begin();

    $tabControl->BeginNextTab();

    if ($arResult['RESULT_MESSAGE']['TYPE'] === 'ERROR') {
        foreach ($arError as $strError) {
            $errorMessages .= "$strError<br>";
        }
        $message = new CAdminMessage([
            'MESSAGE' => $errorMessages,
            'TYPE'    => 'ERROR',
            'HTML'    => true
        ]);

        echo '<div class="adm-detail-content">' . $message->Show() . '</div>';
    }

    if ($arResult['RESULT_MESSAGE']['TYPE'] === 'OK') {
        $message = new CAdminMessage([
            'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SMS4B_WAS_SEND'),
            'TYPE'    => 'OK',
            'HTML'    => true
        ]);
        echo '<div class="adm-detail-content">' . $message->Show() . '</div>';
    }

    global $USER;
    $rsUser_b = CUser::GetByID($USER->GetID());
    $arUser_b = $rsUser_b->Fetch();
    ?>

    <tr>
        <td class="left_td">
            <strong><?= Loc::getMessage('SMS4B_MAIN_NUMBER_SENDER') ?></strong><span class="orange">*</span>
        </td>
        <td>
            <?php
            $configService = new ConfigService();
            if ($requestData->getPost('apply') !== null && $requestData->getPost('sender_number')) {
                $selectSender = $requestData->getPost('sender_number');
            } else {
                $sId = $configService->getSiteIdDefault();
                $selectSender = COption::GetOptionString('rarus.sms4b', 'defsender', '', $sId);
            }
            ?>
            <select name="sender_number" id="senderNumber">
                <?php if (empty($arResult['ADDRESSES'])): ?>
                    <option></option>
                <?php else: ?>
                    <?php foreach ($arResult['ADDRESSES'] as $arIndex): ?>
                        <option value="<?= htmlspecialchars($arIndex) ?>"
                            <?php if ($selectSender == $arIndex): ?> selected <?php endif; ?>><?= $arIndex ?>
                        </option>
                    <?php endforeach; ?>
                <?php endif; ?>
            </select>
        </td>
    </tr>
    <tr>
        <td class="left_td">
            <strong><?= Loc::getMessage('SMS4B_MAIN_NUMBER_DESTINATION') ?></strong><span class="orange">*</span>
            <br/>
        </td>
        <td>
            <div class="counters">
                <div id="correct-nums-div"><?= Loc::getMessage('SMS4B_MAIN_RECEIVERS') ?><span
                            id="correct-nums-tip"></span><span
                            id="correct-nums">0</span></div>
                <div id="need-sms-div"><?= Loc::getMessage('SMS4B_MAIN_NEED_SMS') ?><span id="need-sms-tip"></span>
                    <span id="need-sms">0</span></div>
                <div id="countDoubled"><a href="javascript:void(0);"
                     id="countDoubledLink"><?= Loc::getMessage('SMS4B_MAIN_KILL_DOUBLED_NUMBERS') ?></a>
                </div>
                <div class="clear"></div>
            </div>
            <textarea id="destinationNumber" name="destination_number"
                      <?php if (!$requestData->getPost('destination_number')): ?>class="gray"<?php endif; ?>
                ><?php if ($requestData->getPost('destination_number')): ?><?= implode("\n",
                    $destination) ?><?php else: ?><?= Loc::getMessage('SMS4B_MAIN_DEST_COMMENT') ?><?php endif; ?>
            </textarea>
        </td>
    </tr>
    <tr>
        <td class="left_td">
            <strong><?= Loc::getMessage('SMS4B_MAIN_MESSAGE_TEXT') ?></strong><span class="orange">*</span>
            <div><a href="javascript:void(0);" id="caption"><?= Loc::getMessage('SMS4B_MAIN_CAPTION') ?></a></div>
        </td>
        <td>
            <div class="counters">
                <div id="lengmess-div"><?= Loc::getMessage('SMS4B_MAIN_TEXT_LENGTH') ?><span
                            id="lengmess-tip"></span><span
                            id="lengmess">0</span></div>
                <div id="size-part-div"><?= Loc::getMessage('SMS4B_MAIN_PART_SIZE') ?><span
                            id="size-part-tip"></span><span
                            id="size-part">160</span></div>
                <div id="parts-div"><?= Loc::getMessage('SMS4B_MAIN_PARTS') ?><span id="parts-tip"></span><span
                            id="parts">0</span>
                </div>
                <div class="clear"></div>
            </div>
            <textarea id="message" rows="7" name="message"
                      <?php if (!$requestData->getPost('message')): ?>class="gray"<?php endif; ?>
            ><?php if ($requestData->getPost('message')): ?><?= $requestData->getPost('message') ?>
                <?php else: ?><?= Loc::getMessage('SMS4B_MAIN_TEXT_COMMENT') ?>
                <?php endif; ?>
            </textarea><br/>
            <div class="clear"></div>
        </td>
    </tr>
    <tr>
        <td class="left_td">
            <b><?= Loc::getMessage('SMS4B_MAIN_TRANSLIT_TO') ?></b>
        </td>
        <td>
            <input type="checkbox" id="translit" name="translit" value="Y"
                   <?php if ($requestData->getPost('translit')): ?>checked<?php endif; ?>/>
        </td>
    </tr>
    <tr>
        <td class="left_td">
            <b><?= Loc::getMessage('SMS4B_MAIN_BEGIN_SEND_AT') ?></b>
        </td>
        <td>
            <?php $now = new DateTime('now'); ?>
            <input type="text" class="typeinput" id="BEGIN_SEND_AT" name="BEGIN_SEND_AT" size="20"
                   value="<?= gmdate('d.m.Y H:i',
                       time() + ((int)COption::GetOptionString('rarus.sms4b',
                               'gmt') * 3600)) ?>"/
            ><?php $GLOBALS['APPLICATION']->IncludeComponent('bitrix:main.calendar',
                '', [
                    'SHOW_INPUT'         => 'N',
                    'FORM_NAME'          => 'form1',
                    'INPUT_NAME'         => 'BEGIN_SEND_AT',
                    'INPUT_NAME_FINISH'  => '',
                    'INPUT_VALUE'        => '',
                    'INPUT_VALUE_FINISH' => '',
                    'SHOW_TIME'          => 'Y',
                    'HIDE_TIMEBAR'       => 'N'
                ], false); ?>
        </td>
    </tr>
    <tr>
        <td class="left_td">
            <input type="checkbox" id="ACTIVE_DATE_ACTUAL" name="ACTIVE_DATE_ACTUAL" value="Y"
                   onclick="activeNightTimeNsEvent('ACTIVE_DATE_ACTUAL','DATE_ACTUAL','');"
                <?php if ($requestData->getPost('ACTIVE_DATE_ACTUAL') == 'Y'): ?> checked <?php endif; ?> />
            <b><label for="ACTIVE_DATE_ACTUAL"
                      class="normal"><?= Loc::getMessage('SMS4B_MAIN_DATE_ACTUAL') ?></label></b>
        </td>
        <td>
            <input type="text" class="typeinput" id="DATE_ACTUAL" name="DATE_ACTUAL" size="20"
                   value="<?= gmdate('d.m.Y H:i',
                       time() + ((int)COption::GetOptionString('rarus.sms4b', 'gmt') * 3600) + 86400) ?>"
                   disabled/><?php $GLOBALS['APPLICATION']->IncludeComponent('bitrix:main.calendar',
                '', [
                    'SHOW_INPUT'         => 'N',
                    'FORM_NAME'          => 'form1',
                    'INPUT_NAME'         => 'DATE_ACTUAL',
                    'INPUT_NAME_FINISH'  => '',
                    'INPUT_VALUE'        => '',
                    'INPUT_VALUE_FINISH' => '',
                    'SHOW_TIME'          => 'Y',
                    'HIDE_TIMEBAR'       => 'N'
                ], false); ?>
        </td>
    </tr>
    <tr>
        <td class="left_td">
            <input type="checkbox" id="ACTIVE_NIGHT_TIME_NS" name="ACTIVE_NIGHT_TIME_NS" value="Y"
                   onclick="activeNightTimeNsEvent('ACTIVE_NIGHT_TIME_NS','DATE_FROM_NS','DATE_TO_NS');"
                <?php if ($requestData->getPost('ACTIVE_NIGHT_TIME_NS') == 'Y'): ?> checked <?php endif; ?> />
            <b><label for="ACTIVE_NIGHT_TIME_NS"
                      class="normal"><?= Loc::getMessage('SMS4B_MAIN_NIGHT_TIME_NS') ?></label></b>
        </td>
        <td>
            <select id="DATE_FROM_NS"
                    name="DATE_FROM_NS"
                <?php if ($requestData->getPost('ACTIVE_NIGHT_TIME_NS') != 'Y'): ?> disabled <?php endif; ?>>
                <?php $checked_symbol_date_from_ns = chr(87); ?>
                <?php for ($i = 0; $i < 24; $i++): ?>
                    <option
                            value="<?= chr(65 + $i) ?>"
                        <?php if (chr(65 + $i) == $checked_symbol_date_from_ns): ?> selected <?php endif; ?>>
                        <?= $i ?>:00
                    </option>
                <?php endfor; ?>
            </select> <?= Loc::getMessage('SMS4B_MAIN_TO') ?>
            <select id="DATE_TO_NS" name="DATE_TO_NS">
                <?php $checked_symbol_date_to_ns = chr(73); ?>
                <?php for ($i = 0; $i < 24; $i++): ?>
                    <option
                            value="<?= chr(65 + $i) ?>"
                        <?php if (chr(65 + $i) == $checked_symbol_date_to_ns): ?> selected <?php endif; ?>>
                        <?= $i ?>:59
                    </option>
                <?php endfor; ?>
            </select>
        </td>
    </tr>

    <tr>
        <td class="left_td">
            <label for="uniformSending" class="normal"> <b><?= Loc::getMessage('SMS4B_MAIN_UNIFORM') ?></b><span
                        class="required"><sup>1</sup></span></label>
        </td>
        <td>
            <input type="checkbox" id="uniformSending" name="uniformSending" value="Y"
                   <?php if ($requestData->getPost('uniformSending')): ?>checked<?php endif; ?>/>
        </td>
    </tr>

    <tr>
        <td colspan="2">
            <div class="adm-info-message">
                <span class="required"><sup>1</sup></span><?= Loc::getMessage('SMS4B_MAIN_SMS4B_UNIFORM_DESC') ?>
                <br>
            </div>
        </td>
    </tr>
    <?php

    $tabControl->Buttons();
    ?>
    <input type="submit" value="<?= Loc::getMessage('SMS4B_MAIN_SUBMIT') ?>" name="apply">
    <?php
    $tabControl->End();
    ?>
</form>

<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php');
?>
