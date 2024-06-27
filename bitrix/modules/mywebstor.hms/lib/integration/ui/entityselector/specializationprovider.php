<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use MyWebstor\Hms\SpecializationTable;

class SpecializationProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return SpecializationTable::getList(array(
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
        $specialization = SpecializationTable::getById($id)->fetch();
        if (!$specialization) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-specialization",
            "title" => $specialization["TITLE"],
            "subtitle" => "",
            "link" => "/hms/config/specialization/details/$id/",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $specializationQuery = SpecializationTable::getList(array(
            "filter" => array(
                "%TITLE" => $searchQuery->getQuery()
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $specializationQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = SpecializationTable::getList(array(
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
