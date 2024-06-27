<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;

Loc::loadMessages(__FILE__);

class ReceiveTypeProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        $receiveTypes = \MyWebstorHmsHelper::getReceiveTypes();
        if (empty($ids)) return $receiveTypes;

        return array_keys(array_intersect_key($receiveTypes, array_flip($ids)));
    }

    protected function getByIDs($ids) {
        $items = array();
        if (empty($ids)) return $items;

        $ids = $this->fetchEntryIds($ids);

        foreach ($ids as $id)
            $items[] = $this->makeItem($id);

        return $items;
    }

    protected function makeItem($id): ?Item {
        $receiveType = \MyWebstorHmsHelper::getReceiveTypes()[$id];
        if (!$receiveType) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => "hms-receive-type",
            "title" => $receiveType["name"],
            "subtitle" => $receiveType["code"],
            "link" => "",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $receiveTypeNames = array_map(function ($type) {
            return $type["name"];
        }, \MyWebstorHmsHelper::getReceiveTypes());
        $receiveTypeCodes = array_keys($receiveTypeNames);

        $ids = array_merge(
            preg_grep("/" . trim($searchQuery->getQuery()) . "/i", $receiveTypeCodes),
            array_keys(preg_grep("/" . trim($searchQuery->getQuery()) . "/ui", $receiveTypeNames)),
        );

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = array_keys(\MyWebstorHmsHelper::getReceiveTypes());

        $items = $this->getByIDs($ids);

        $dialog->addItems($items);
        $dialog->addRecentItems($items);
    }
}
