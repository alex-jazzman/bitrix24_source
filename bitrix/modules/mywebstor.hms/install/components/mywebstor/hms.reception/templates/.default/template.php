<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \CBitrixComponent $component
 * @var \CBitrixComponentTemplate $this
 * @var array $arParams
 * @var array $arResult
 * @var array $templateData
 * @var string $templateFolder
 * @var string $parentTemplateFolder
 * @var string $templateName
 * @var string $componentPath
 */
global $APPLICATION, $USER, $DB;

Loc::loadMessages(__FILE__);

include_once(__DIR__ . "/messages.php");

$toolbarManager = \Bitrix\UI\Toolbar\Manager::getInstance();
$toolbar = $toolbarManager->getToolbarById(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID)
    ?: $toolbarManager->createToolbar(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID, array());

$toolbar->deleteFavoriteStar();
$addButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_RECEPTION_BUTTON_ADD"),
    "className" => "ui-btn-success",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.SidePanel.Instance.open("/hms/reception/appointment/details/0/");'
    )
));

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest()->toArray();

\Bitrix\Main\UI\Extension::load(array(
    'ui.hint',
    'ui.entity-selector',
    'ui.entity-catalog',
    'date'
));

$assetInstance = \Bitrix\Main\Page\Asset::getInstance();
switch (isset($request["dev_mode"])) {
    case true:
        $assetInstance->addString(
            '<script type="module" src="//localhost/@vite/client"></script>'
        );
        $assetInstance->addString(
            '<script type="module" src="//localhost/main.js"></script>'
        );
        break;
    case false:
        $assetInstance->addString(
            '<script src="' . $this->GetFolder() . '/js/app.js?' . filemtime(__DIR__ . "/js/app.js") . '"></script>'
        );
        $assetInstance->addString(
            '<link href="' . $this->GetFolder() . '/css/app.css?' . filemtime(__DIR__ . "/css/app.css") . '" rel="stylesheet" />'
        );
        break;
}

?>
<div id="calendar-app"></div>
<script>
    BX.ready(() => {
        BX.MyWebstor.HMS.Reception.getInstance(
            <?= \CUtil::PhpToJSObject($arResult["DATA"]) ?>
        );
    });
</script>
