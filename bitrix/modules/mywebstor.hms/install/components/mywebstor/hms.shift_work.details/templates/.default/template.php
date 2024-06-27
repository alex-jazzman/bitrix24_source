<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;

/** @var \CMain $APPLICATION */
/** @var \CUser $USER */
/** @var \CDatabase $DB */
/** @var \CBitrixComponent $component */
/** @var \CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @var array $templateData */
/** @var string $templateFolder */
/** @var string $parentTemplateFolder */
/** @var string $templateName */
/** @var string $componentPath */

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest()->toArray();

Loc::loadMessages(__DIR__);

include_once(__DIR__ . "/messages.php");

$toolbarManager = \Bitrix\UI\Toolbar\Manager::getInstance();
$toolbar = $toolbarManager->getToolbarById(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID)
    ?: $toolbarManager->createToolbar(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID, array());

$toolbar->deleteFavoriteStar();

$saveButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_SHIFT_WORK_BUTTON_SAVE"),
    "className" => "ui-btn-success",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.MyWebstor.HMS.ShiftWork.save();'
    )
));
$deleteButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_SHIFT_WORK_BUTTON_DELETE"),
    "className" => "ui-btn-danger",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.MyWebstor.HMS.ShiftWork.delete();'
    )
));

$toolbar->addButton($saveButton);
if ($arResult["ID"] > 0)
    $toolbar->addButton($deleteButton);

\Bitrix\Main\UI\Extension::load([
    'ui.entity-selector',
    'ui.forms',
    'ui.alerts',
    'ui.buttons',
    'color_picker',
    'mywebstor.hms.entity-selector',
    'date'
]);

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
            '<script defer="defer" src="' . $this->GetFolder() . '/js/app.js?' . filemtime(__DIR__ . "/js/app.js") . '"></script>'
        );
        $assetInstance->addString(
            '<link href="' . $this->GetFolder() . '/css/app.css?' . filemtime(__DIR__ . "/css/app.css") . '" rel="stylesheet" />'
        );
        break;
}

?>
<div id="shift-work-app"></div>
<script>
    addEventListener("load", () => {
        let shiftWork = BX.MyWebstor.HMS.ShiftWork.create();
    });
</script>
