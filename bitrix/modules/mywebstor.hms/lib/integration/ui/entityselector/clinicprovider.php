<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use MyWebstor\Hms\ClinicTable;

class ClinicProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return ClinicTable::getList(array(
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
        $clinic = ClinicTable::getById($id)->fetch();
        if (!$clinic) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-clinic",
            "title" => $clinic["TITLE"],
            "subtitle" => "",
            "link" => "/hms/config/clinic/details/$id/",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $clinicQuery = ClinicTable::getList(array(
            "filter" => array(
                "%TITLE" => $searchQuery->getQuery()
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $clinicQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = ClinicTable::getList(array(
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
