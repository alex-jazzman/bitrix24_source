<?

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

\Bitrix\Main\UI\Extension::load("ui.buttons");
\Bitrix\Main\UI\Extension::load("ui.buttons.icons");
\CJSCore::init(["loader", "popup", "sidepanel", "date"]);
$this->IncludeLangFile();

function displayField($placeholder, array $field, $required = false) {
    $title = $field['TITLE'];
    if (!$title) {
        $title = $placeholder;
    }
?><div class="hms-document-edit-item">
        <label class="hms-document-edit-label" for="field-<?= \CUtil::JSEscape($placeholder); ?>"><? echo htmlspecialcharsbx($title) ?></label><?
                                                                                                                                            if (is_array($field['VALUE'])) {
                                                                                                                                            ?>
            <select class="hms-document-edit-select" name="values[<?= htmlspecialcharsbx($placeholder); ?>]" id="field-<?= \CUtil::JSEscape($placeholder); ?>">
                <? foreach ($field['VALUE'] as $value) {
                                                                                                                                                    $title = $value['TITLE'];
                                                                                                                                                    if (!$title) {
                                                                                                                                                        $title = $value['VALUE'];
                                                                                                                                                    }
                ?>
                    <option value="<?= htmlspecialcharsbx($value['VALUE']); ?>" <? if ($value['SELECTED']) { ?> selected<? } ?>><?= htmlspecialcharsbx($title); ?></option>
                <? } ?>
            </select>
        <?
                                                                                                                                            } elseif ($field['TYPE'] && $field['TYPE'] === \Bitrix\DocumentGenerator\DataProvider::FIELD_TYPE_TEXT) {
        ?>
            <textarea class="hms-document-edit-input hms-document-edit-input-textarea" name="values[<?= htmlspecialcharsbx($placeholder); ?>]" id="field-<?= \CUtil::JSEscape($placeholder); ?>" <? if ($required) { ?> required<? }
                                                                                                                                                                                                                    if (array_key_exists('DEFAULT', $field)) {
                                                                                                                                                                                                                        ?> bx-default="<?= htmlspecialcharsbx($field['DEFAULT'] ?? ''); ?>" <?
                                                                                                                                                                                                                    }
                                                                                ?>><?= htmlspecialcharsbx($field['VALUE']); ?></textarea>
        <?
                                                                                                                                            } elseif ($field['TYPE'] && $field['TYPE'] === \Bitrix\DocumentGenerator\DataProvider::FIELD_TYPE_DATE || $field['VALUE'] instanceof \Bitrix\DocumentGenerator\Value\DateTime) {
        ?>
            <input onclick="BX.calendar({node: this, field: this, bTime: true, bSetFocus: false, bUseSecond: true})" class="hms-document-edit-input hms-document-edit-date" name="values[<?= htmlspecialcharsbx($placeholder); ?>]" value="<?= htmlspecialcharsbx($field['VALUE']); ?>" <? if ($required) { ?> required<? } ?> id="field-<?= \CUtil::JSEscape($placeholder); ?>" <?
                                                                                                                                                                                                                                                                                                                                                                        if (array_key_exists('DEFAULT', $field)) {
                                                                                                                                                                                                                                                                                                                                                                        ?> bx-default="<?= htmlspecialcharsbx($field['DEFAULT'] ?? ''); ?>" <?
                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                ?>>
        <?
                                                                                                                                            } else {
        ?>
            <input class="hms-document-edit-input" name="values[<?= htmlspecialcharsbx($placeholder); ?>]" value="<?= htmlspecialcharsbx($field['VALUE']); ?>" <? if ($required) { ?> required<? } ?> id="field-<?= \CUtil::JSEscape($placeholder); ?>" <?
                                                                                                                                                                                                                                            if (array_key_exists('DEFAULT', $field)) {
                                                                                                                                                                                                                                            ?> bx-default="<?= htmlspecialcharsbx($field['DEFAULT'] ?? ''); ?>" <?
                                                                                                                                                                                                                                            }
                                                                                ?>>
        <?
                                                                                                                                            }
        ?>
    </div><?
        }

        function findStringPosition($string, $needle, $offset = 0) {
            $functionName = 'stripos';
            if (defined('BX_UTF') && BX_UTF && function_exists('mb_stripos')) {
                $functionName = 'mb_stripos';
            }

            return $functionName($string, $needle, $offset);
        }

        function displayGroup(array &$allGroups, $name, $groups, array &$placeholders, array $fields, $isRoot = false) {
            $showGroup = false;
            foreach ($placeholders as $placeholder => $value) {
                if (findStringPosition($placeholder, $name) !== false && !empty($value)) {
                    $showGroup = true;
                    break;
                }
            }
            if (!$showGroup) {
                return;
            }
            $classSuffix = 'group';
            if ($isRoot) {
                $classSuffix = 'root';
            }
            $nameParts = explode('.', $name);
            $title = $nameParts[count($nameParts) - 1];
            ?><div class="hms-document-edit-<?= $classSuffix; ?>" id="hms-document-edit-group-<?= \CUtil::JSEscape($title); ?>">
        <h3 class="hms-document-edit-<?= $classSuffix; ?>-title"><?= htmlspecialcharsbx($title); ?></h3><?
                                                                                                    // first show selects
                                                                                                    ?><div class="hms-document-edit-fields"><?
                                            if (is_array($placeholders[$name])) {
                                                foreach ($placeholders[$name] as $key => $placeholder) {
                                                    if (is_array($fields[$placeholder]['VALUE'])) {
                                                        displayField($placeholder, $fields[$placeholder]);
                                                        unset($placeholders[$name][$key]);
                                                        break;
                                                    }
                                                }
                                            }
                                            if (is_array($placeholders[$name])) {
                                                foreach ($placeholders[$name] as $key => $placeholder) {
                                                    displayField($placeholder, $fields[$placeholder]);
                                                    unset($placeholders[$name][$key]);
                                                }
                                            }
                                            ?></div><?
            if (is_array($groups)) {
                foreach ($groups as $group => $children) {
                    $groupName = $name . '.' . $group;
                    if (is_array($placeholders[$groupName]) && !empty($placeholders[$groupName])) {
                        displayGroup($allGroups, $groupName, $allGroups[$groupName], $placeholders, $fields);
                    }
                }
            }
            ?>
    </div><?
        }

        if ($arParams['IS_SLIDER']) {
            $APPLICATION->RestartBuffer();
            ?>
    <!DOCTYPE html>
    <html>

    <head>
        <script data-skip-moving="true">
            // Prevent loading page without header and footer
            if (window === window.top) {
                window.location = "<?= CUtil::JSEscape((new \Bitrix\Main\Web\Uri(\Bitrix\Main\Application::getInstance()->getContext()->getRequest()->getRequestUri()))->deleteParams(['IFRAME', 'IFRAME_TYPE'])); ?>" + window.location.hash;
            }
        </script>
        <? $APPLICATION->ShowHead(); ?>
    </head>

    <body class="hms__document-view--slider-wrap">
        <div class="hms__document-view--title">
            <div class="pagetitle-wrap">
                <div class="pagetitle-inner-container">
                    <div class="pagetitle">
                        <span id="pagetitle" class="pagetitle-item hms__document-view--pagetitle-item"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_EDIT_TITLE'); ?>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    <? } ?>
    <div class="hms-document-edit-wrap">
        <div id="hms-document-edit-error"></div>
        <div>
            <form id="hms-document-edit-form" method="post" enctype="multipart/form-data">
                <?= bitrix_sessid_post() ?>
                <input type="hidden" name="mode" value="change" />
                <? if ($arParams['DOCUMENT_ID'] > 0) { ?>
                    <input type="hidden" name="documentId" value="<?= intval($arParams['DOCUMENT_ID']); ?>" />
                <? } else { ?>
                    <input type="hidden" name="templateId" value="<?= intval($arParams['TEMPLATE_ID']); ?>" />
                    <input type="hidden" name="value" value="<?= intval($arParams['VALUE']); ?>" />
                    <input type="hidden" name="providerClassName" value="<?= htmlspecialcharsbx($arParams['PROVIDER']); ?>" />
                <? }
                if ($arParams['IS_SLIDER']) {
                ?><input type="hidden" name="IFRAME" value="Y" />
                    <input type="hidden" name="IFRAME_TYPE" value="SIDE_SLIDER" /><?
                                                                                }
                                                                                if ($arParams['SITE_ID']) {
                                                                                    ?><input type="hidden" name="site_id" value="<?= htmlspecialcharsbx($arParams['SITE_ID']); ?>" /><?
                                                                                                            }
                                                                                                                ?>
                <div class="hms-document-edit-block">
                    <?
                    $foundPlaceholders = [];
                    $groups = [
                        Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_EDIT_UNKNOWN_GROUP_NAME') => [],
                        Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_EDIT_DOCUMENT_GROUP_NAME') => [],
                    ];
                    foreach ($arResult['FIELDS'] as $placeholder => $field) {
                        if (!$field['GROUP'] || empty($field['GROUP'])) {
                            $foundPlaceholders[Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_EDIT_UNKNOWN_GROUP_NAME')][] = $placeholder;
                        } else {
                            $fullGroup = Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_EDIT_DOCUMENT_GROUP_NAME');
                            if (is_array($field['GROUP'])) {
                                foreach ($field['GROUP'] as $group) {
                                    if ($group == $fullGroup) {
                                        continue;
                                    }
                                    $groups[$fullGroup][$group] = [];
                                    $fullGroup .= '.' . $group;
                                }
                            }

                            if (isset($field['TYPE']) && $field['TYPE'] == \Bitrix\DocumentGenerator\DataProvider::FIELD_TYPE_IMAGE || $field['TYPE'] == \Bitrix\DocumentGenerator\DataProvider::FIELD_TYPE_STAMP) {
                                continue;
                            }
                            $foundPlaceholders[$fullGroup][] = $placeholder;
                        }
                    }
                    foreach ($groups as $name => $children) {
                        displayGroup($groups, $name, $children, $foundPlaceholders, $arResult['FIELDS'], true);
                    }
                    ?></div>
            </form>
            <div class="hms-document-edit-buttons">
                <button class="ui-btn ui-btn-md ui-btn-success" id="hms-document-edit-save"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_EDIT_SAVE'); ?></button>
                <button class="ui-btn ui-btn-md ui-btn-link" id="hms-document-edit-cancel" type="button"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_EDIT_CANCEL'); ?></button>
            </div>
        </div>
    </div>
    <script>
        BX.ready(function() {
            BX.MyWebstor.Hms.DocumentEdit.init();
            <?= 'BX.message(' . \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) . ');' ?>
        });
    </script>
    <?
    if ($arParams['IS_SLIDER']) {
    ?>
    </body>

    </html><?
            \CMain::FinalActions();
        }
