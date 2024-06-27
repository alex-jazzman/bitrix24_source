<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use MyWebstor\Hms\OfficeTable;

Loc::loadMessages(__FILE__);

class OfficeProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return
            OfficeTable::getList(array(
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
        $office = OfficeTable::getList(array(
            "filter" => array(
                "ID" => $id
            ),
            "select" => array(
                "ID",
                "TITLE",
                "CLINIC_TITLE" => "CLINIC.TITLE"
            )
        ))->fetch();
        if (!$office) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-office",
            "title" => $office["TITLE"],
            "subtitle" => Loc::getMessage("HMS_ENTITY_SELECTOR_CLINIC", array(
                "#CLINIC#" => $office["CLINIC_TITLE"]
            )),
            "link" => "/hms/config/office/details/$id/",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $officeQuery = OfficeTable::getList(array(
            "filter" => array(
                "%TITLE" => $searchQuery->getQuery()
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $officeQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = OfficeTable::getList(array(
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
