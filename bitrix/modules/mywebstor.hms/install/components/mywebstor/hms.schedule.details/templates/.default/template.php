<?

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CBitrixComponentTemplate $this */
/** @var \CMain $APPLICATION */
global $APPLICATION;

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest()->toArray();

Loc::loadMessages(__DIR__);

include_once(__DIR__ . "/messages.php");

$toolbarManager = \Bitrix\UI\Toolbar\Manager::getInstance();
$toolbar = $toolbarManager->getToolbarById(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID)
    ?: $toolbarManager->createToolbar(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID, array());

$toolbar->deleteFavoriteStar();

$saveButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_SCHEDULE_BUTTON_SAVE"),
    "className" => "ui-btn-success",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.MyWebstor.HMS.Schedule.save();'
    )
));
$saveActivateButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_SCHEDULE_BUTTON_SAVE_ACTIVATE"),
    "className" => "ui-btn-success",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.MyWebstor.HMS.Schedule.save(true);'
    )
));
$deactivateButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_SCHEDULE_BUTTON_DEACTIVATE"),
    "className" => "ui-btn-light-border",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.MyWebstor.HMS.Schedule.deactivate();'
    )
));
$deleteButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_SCHEDULE_BUTTON_DELETE"),
    "className" => "ui-btn-danger",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.MyWebstor.HMS.Schedule.delete();'
    )
));

if (!$arResult["ID"]) {
    $toolbar->addButton($saveButton);
    $toolbar->addButton($saveActivateButton);
} else {
    if ($arResult["ACTIVE"] == "Y") {
        $toolbar->addButton($deactivateButton);
    } else {
        $toolbar->addButton($saveButton);
        $toolbar->addButton($saveActivateButton);
        $toolbar->addButton($deleteButton);
    }
}

\Bitrix\Main\UI\Extension::load([
    'ui.entity-selector',
    'ui.alerts',
    'ui.forms',
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
<div id="schedule-app"></div>
<script>
    addEventListener("load", () => {
        let schedule = BX.MyWebstor.HMS.Schedule.create();
    });
</script>
