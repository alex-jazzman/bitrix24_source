<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use MyWebstor\Hms\Schedule\FillingMethodTable;

Loc::loadMessages(__FILE__);

class FillingMethodProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return
            FillingMethodTable::getList(array(
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
        $fillingMethod = FillingMethodTable::getList(array(
            "filter" => array(
                "ID" => $id
            ),
            "select" => array(
                "ID",
                "TYPE",
                "TITLE"
            )
        ))->fetch();
        if (!$fillingMethod) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-filling-method",
            "title" => $fillingMethod["TITLE"],
            "subtitle" => Loc::getMessage("HMS_ENTITY_SELECTOR_TYPE", array(
                "#TYPE#" => FillingMethodTable::getTypes($fillingMethod["TYPE"])
            )),
            "link" => "/hms/config/filling_method/details/$id/",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $fillingMethodQuery = FillingMethodTable::getList(array(
            "filter" => array(
                "%TITLE" => $searchQuery->getQuery()
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $fillingMethodQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = FillingMethodTable::getList(array(
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

        $dialog->addItems($items);
        $dialog->addRecentItems($items);
    }
}
