<?php
global $APPLICATION;
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_admin_after.php");
$APPLICATION->SetTitle("Настройки клиента");

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest()->getValues();
$url = "";
$token = "";
if ($request["apply"] == "Применить") {
    $token = $request["token"];
    $url = $request["url"];
    COption::SetOptionString("main", "mws_CAW_token", serialize($token));
    COption::SetOptionString("main", "mws_CAW_url", serialize($url));
} else {
    $token = unserialize(COption::GetOptionString("main", "mws_CAW_token", "a:0:{}"));
    $url = unserialize(COption::GetOptionString("main", "mws_CAW_url", "a:0:{}"));
}

?>
    <form name="settings_form" method="POST">
        <div class="adm-detail-block">
            <div class="adm-detail-content-wrap">
                <div class="adm-detail-content" style="display: block;">
                    <div class="adm-detail-content-item-block" style="height: auto; overflow-y: visible;">
                        <table class="adm-detail-content-table edit-table" id="edit1_edit_table" style="opacity: 1;">
                            <tbody>
                            <tr>
                                <td class="adm-detail-content-cell-l">Домен микросервиса</td>
                                <td class="adm-detail-content-cell-r">
                                    <input type="text" size="30" maxlength="255" name="url" value="<?= $url ?>"/>
                                </td>
                            </tr>
                            <tr>
                                <td class="adm-detail-content-cell-l">Токен микросервиса</td>
                                <td class="adm-detail-content-cell-r">
                                    <input type="text" size="30" maxlength="255" name="token" value="<?= $token ?>"/>
                                </td>
                            </tr>

                            <tr>
                                <td colspan="2">
                                    <div class="adm-info-message" style="display:block;">
                                        Для работы модуля необходимо заполнить следующие поля
                                        <ul>
                                            <li>Домен микросервиса пример (microserver.example.com или example.com)</li>
                                            <li>Токен микросервиса</li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="adm-detail-content-btns-wrap">
                    <div class="adm-detail-content-btns">
                        <input type="submit" name="apply" value="Применить" title="Сохранить изменения"
                               class="adm-btn-save"/>
                    </div>
                </div>
            </div>
        </div>

    </form>

<?php require($_SERVER["DOCUMENT_ROOT"] . BX_ROOT . "/modules/main/include/epilog_admin.php"); ?>