<?

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \CUserTypeManager $USER_FIELD_MANAGER
 */
global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);
Loc::loadMessages($_SERVER["DOCUMENT_ROOT"] . BX_ROOT . "/modules/main/options.php");

$moduleID = "mywebstor.hms";
Loader::includeModule($moduleID);

\Bitrix\Main\UI\Extension::load(array(
    "access"
));

$adminOptions = array(
    "settings" => array(
        Loc::getMessage("OPTION_HMS_MAIN_BLOCK"),
        "hms_lead_tab_enabled" => array("hms_lead_tab_enabled", Loc::getMessage("OPTION_HMS_LEAD_TAB_ENABLED"), Option::get($moduleID, "hms_lead_tab_enabled", "Y"), array("checkbox")),
        "hms_deal_tab_enabled" => array("hms_deal_tab_enabled", Loc::getMessage("OPTION_HMS_DEAL_TAB_ENABLED"), Option::get($moduleID, "hms_deal_tab_enabled", "N"), array("checkbox")),
        "hms_check_appointment_intersect" => array("hms_check_appointment_intersect", Loc::getMessage("OPTION_HMS_CHECK_APPOINTMENT_INTERSECT"), Option::get($moduleID, "hms_check_appointment_intersect", "N"), array("checkbox")),
        Loc::getMessage("OPTION_HMS_RIGHTS_BLOCK"),
        "hms_rights" => array("hms_rights", Loc::getMessage("OPTION_HMS_RIGHTS"), unserialize(Option::get($moduleID, "hms_rights", serialize(array()))), array("hidden")),
    ),
);

$adminTabs = array(
    array(
        "DIV" => "settings",
        "TAB" => Loc::getMessage("TAB_SETTINGS"),
        "ICON" => "hms_settings",
        "TITLE" => Loc::getMessage("TAB_TITLE_SETTINGS")
    ),
);

if ($REQUEST_METHOD == 'POST' && $Update <> '' && check_bitrix_sessid()) {
    $adminAllOptions = (function ($adminOptions) {
        $result = array();

        foreach ($adminOptions as $adminOptionsValue)
            foreach ($adminOptionsValue as $adminOptionName => $adminOptionValue)
                $result[$adminOptionName] = $adminOptionValue;

        return $result;
    })($adminOptions);

    foreach ($adminAllOptions as $name => $adminOption) {
        if (!is_array($adminOption)) continue;

        if (!$name)
            $name = current($adminOption);
        if (!$name) continue;

        $value = ${$name};
        if ($adminOption["3"]["0"] == 'checkbox' && $value != 'Y')
            $value = 'N';
        if ($adminOption["3"]["0"] == 'multiselectbox')
            $value = @implode(',', $value);
        if ($name == 'hms_rights')
            $value = serialize($value);

        Option::set($moduleID, $name, $value);
    }

    if ($_REQUEST["back_url_settings"] <> '')
        LocalRedirect($_REQUEST["back_url_settings"]);
    else
        LocalRedirect($APPLICATION->GetCurPage() . "?mid=" . urlencode($mid) . "&lang=" . urlencode(LANGUAGE_ID) . "&back_url_settings=" . urlencode($_REQUEST["back_url_settings"]));
}

$tabControl = new CAdminTabControl("tabControl", $adminTabs);
$tabControl->Begin(); ?>
<form method="POST" action="<? echo $APPLICATION->GetCurPage() ?>?mid=<?= htmlspecialcharsbx($mid) ?>&lang=<?= LANGUAGE_ID ?>">
    <? $tabControl->BeginNextTab(); ?>
    <?
    foreach ($adminOptions["settings"] as $adminOptionKey => $adminOption) {
        switch ($adminOptionKey) {
            case "hms_rights":
                $rights = $adminOption["2"];

                $access = new CAccess();
                $names = $access->GetNames($rights); ?>
                <tr id="RIGHTS_all" style="display: table-row;">
                    <td width="40%"><?= $adminOption["1"] ?></td>
                    <td width="60%">
                        <script>
                            var rightsCont = BX('RIGHTS_all');

                            function DeleteToAllAccessRow(ob) {
                                var divNode = BX('RIGHTS_div', true);
                                var div = BX.findParent(ob, {
                                    tag: 'div',
                                    className: 'toall-right'
                                }, divNode);
                                if (div)
                                    var right = div.getAttribute('data-bx-right');

                                if (div && right) {
                                    BX.remove(div);
                                    var artoAllRightsNew = [];

                                    for (var i = 0; i < arToAllRights.length; i++)
                                        if (arToAllRights[i] != right)
                                            artoAllRightsNew[artoAllRightsNew.length] = arToAllRights[i];

                                    arToAllRights = BX.clone(artoAllRightsNew);

                                    var hidden_el = BX('<?= htmlspecialcharsbx($adminOption["0"]) ?>_' + right);
                                    if (hidden_el)
                                        BX.remove(hidden_el);
                                }
                                return false;
                            }

                            function ShowToAllAccessPopup(val) {
                                val = val || [];

                                BX.Access.Init({
                                    other: {
                                        disabled: false,
                                        disabled_g2: true,
                                        disabled_cr: true
                                    },
                                    groups: {
                                        disabled: false
                                    },
                                    socnetgroups: {
                                        disabled: false
                                    },
                                    extranet: {
                                        disabled: true
                                    }
                                });

                                var startValue = {};
                                for (var i = 0; i < val.length; i++)
                                    startValue[val[i]] = true;

                                BX.Access.SetSelected(startValue);

                                BX.Access.ShowForm({
                                    callback: function(arRights) {
                                        var divNode = BX('RIGHTS_div', true);
                                        var pr = false;

                                        for (var provider in arRights) {
                                            pr = BX.Access.GetProviderName(provider);
                                            for (var right in arRights[provider]) {
                                                divNode.appendChild(BX.create('div', {
                                                    attrs: {
                                                        'data-bx-right': right
                                                    },
                                                    props: {
                                                        'className': 'toall-right'
                                                    },
                                                    children: [
                                                        BX.create('span', {
                                                            html: (pr.length > 0 ? pr + ': ' : '') + arRights[provider][right].name + '&nbsp;'
                                                        }),
                                                        BX.create('a', {
                                                            attrs: {
                                                                href: 'javascript:void(0);',
                                                                title: BX.message('SLToAllDel')
                                                            },
                                                            props: {
                                                                'className': 'access-delete'
                                                            },
                                                            events: {
                                                                click: function() {
                                                                    DeleteToAllAccessRow(this);
                                                                }
                                                            }
                                                        })
                                                    ]
                                                }));

                                                divNode.appendChild(BX.create('input', {
                                                    attrs: {
                                                        'type': 'hidden'
                                                    },
                                                    props: {
                                                        'name': '<?= htmlspecialcharsbx($adminOption["0"]) ?>[]',
                                                        'id': '<?= htmlspecialcharsbx($adminOption["0"]) ?>_' + right,
                                                        'value': right
                                                    }
                                                }));

                                                arToAllRights[arToAllRights.length] = arRights[provider][right].id;
                                            }
                                        }
                                    }
                                });

                                return false;
                            }
                        </script>
                        <div id="RIGHTS_div">
                            <? foreach ($rights as $right) { ?>
                                <input type="hidden" name="<? echo htmlspecialcharsbx($adminOption["0"]) ?>[]" id="<? echo htmlspecialcharsbx($adminOption["0"] . "_" . $right) ?>" value="<?= htmlspecialcharsbx($right) ?>">
                                <div data-bx-right="<?= htmlspecialcharsbx($right) ?>" class="toall-right">
                                    <span><?= (!empty($names[$right]["provider"]) ? $names[$right]["provider"] . ": " : "") . $names[$right]["name"] ?>&nbsp;</span>
                                    <a href="javascript:void(0);" onclick="DeleteToAllAccessRow(this);" class="access-delete" title="<?= GetMessage("SONET_LOG_TOALL_DEL") ?>"></a>
                                </div>
                            <? } ?>
                        </div>
                        <script>
                            var arToAllRights = <?= CUtil::PhpToJSObject($rights) ?>;
                        </script>
                        <div style="padding-top: 5px;">
                            <a href="javascript:void(0)" class="bx-action-href" onclick="ShowToAllAccessPopup(arToAllRights);"><?= GetMessage("OPTION_HMS_RIGHTS_ADD") ?></a>
                        </div>
                    </td>
                </tr>
    <?
                break;
            default:
                __AdmSettingsDrawRow($moduleID, $adminOption);
                break;
        }
    }
    ?>
    <? $tabControl->Buttons(); ?>
    <input type="submit" name="Update" value="<? echo Loc::getMessage("MAIN_SAVE") ?>">
    <input type="hidden" name="Update" value="Y">
    <?= bitrix_sessid_post(); ?>
    <? $tabControl->End(); ?>
</form>
