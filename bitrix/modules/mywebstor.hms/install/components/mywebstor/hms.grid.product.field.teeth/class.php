<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class HmsGridProductFieldTeethComponent extends \CBitrixComponent {
    public function executeComponent() {
        $this->prepareResult();
        if (!$this->arResult["ROW_ID"]) return "";

        ob_start();
        $this->includeComponentTemplate();
        $htmlField = ob_get_clean();

        return $htmlField;
    }

    protected function prepareResult() {
        $this->arResult["ROW_ID"] = $this->arParams["ROW_ID"];
        $this->arResult["VALUE"] = join(",", $this->arParams["VALUE"] ?: array());
    }
}
