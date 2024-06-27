<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use MyWebstor\Hms\Vhi\VhiTypeTable;

Loc::loadMessages(__FILE__);

class VhiTypeProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return
            VhiTypeTable::getList(array(
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
        $vhiType = VhiTypeTable::getList(array(
            "filter" => array(
                "ID" => $id
            ),
            "select" => array(
                "ID",
                "TITLE",
            )
        ))->fetch();
        if (!$vhiType) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-vhi-type",
            "title" => $vhiType["TITLE"],
            "subtitle" => "",
            "link" => "",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $vhiTypeQuery = VhiTypeTable::getList(array(
            "filter" => array(
                "%TITLE" => $searchQuery->getQuery()
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $vhiTypeQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = VhiTypeTable::getList(array(
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
