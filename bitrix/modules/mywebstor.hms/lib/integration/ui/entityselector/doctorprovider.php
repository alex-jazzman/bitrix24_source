<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use MyWebstor\Hms\DoctorTable;

class DoctorProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return
            DoctorTable::getList(array(
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
        $doctor = DoctorTable::getList(array(
            "filter" => array(
                "ID" => $id
            ),
            "select" => array(
                "ID",
                "USER_TITLE"
            )
        ))->fetch();
        if (!$doctor) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-doctor",
            "title" => $doctor["USER_TITLE"],
            "subtitle" => "",
            "link" => "/hms/config/doctor/details/$id/",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $doctorQuery = DoctorTable::getList(array(
            "filter" => array(
                array(
                    "LOGIC" => "OR",
                    "%USER.NAME" => $searchQuery->getQuery(),
                    "%USER.LAST_NAME" => $searchQuery->getQuery(),
                    "%USER.SECOND_NAME" => $searchQuery->getQuery(),
                )
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $doctorQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = DoctorTable::getList(array(
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
