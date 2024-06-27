<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use MyWebstor\Hms\Schedule\ShiftWorkTable;

Loc::loadMessages(__FILE__);

class ShiftWorkProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return
            ShiftWorkTable::getList(array(
                "filter" => array(
                    "ID" => $ids
                ),
                "select" => array(
                    "ID"
                )
            ))
            ->fetchCollection()
            ->getIdList();
    }

    protected function makeItem(int $id): ?Item {
        $shiftWork = ShiftWorkTable::getList(array(
            "filter" => array(
                "ID" => $id
            ),
            "select" => array(
                "ID",
                "TITLE"
            )
        ))->fetch();
        if (!$shiftWork) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-shift-work",
            "title" => $shiftWork["TITLE"],
            "subtitle" => "",
            "link" => "/hms/config/shift_work/details/$id/",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $shiftWorkQuery = ShiftWorkTable::getList(array(
            "filter" => array(
                "%TITLE" => $searchQuery->getQuery()
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $shiftWorkQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = ShiftWorkTable::getList(array(
            "select" => array(
                "ID"
            ),
            "order" => array(
                "ID" => "DESC"
            ),
            "limit" => "10"
        ))
            ->fetchCollection()
            ->getIdList();

        $items = $this->getByIDs($ids);

        $freeItem = new Item(array(
            "id" => 0,
            "entityId" => "hms-shift-work",
            "title" => Loc::getMessage("HMS_SHIFT_WORK_PROVIDER_EMPTY"),
            "subtitle" => "",
            "link" => "",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
        array_unshift($items, $freeItem);

        $dialog->addItems($items);
        $dialog->addRecentItems($items);
    }
}
