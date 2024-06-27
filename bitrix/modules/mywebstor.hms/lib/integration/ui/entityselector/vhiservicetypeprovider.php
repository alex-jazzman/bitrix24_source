<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use Bitrix\UI\EntitySelector\Tab;
use MyWebstor\Hms\Vhi\VhiServiceTypeTable;

Loc::loadMessages(__FILE__);

class VhiServiceTypeProvider extends EntityProvider {
    protected const VHI_SERVICE_TYPE_ENTITY_ID = "hms-vhi-service-type";
    protected const VHI_SERVICE_TYPE_ENTITY_TAB = "hms-vhi-service-types";

    protected function fetchEntryIds(array $ids): array {
        return
            VhiServiceTypeTable::getList(array(
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
        $vhiServiceType = VhiServiceTypeTable::getList(array(
            "filter" => array(
                "ID" => $id
            ),
            "select" => array(
                "ID",
                "TITLE",
            )
        ))->fetch();
        if (!$vhiServiceType) return null;

        return new Item(array(
            "id" => $id,
            "entityId" => static::VHI_SERVICE_TYPE_ENTITY_ID,
            "title" => $vhiServiceType["TITLE"],
            "tabs" => static::VHI_SERVICE_TYPE_ENTITY_TAB,
            "availableInRecentTab" => false,
            "subtitle" => "",
            "searchable" => false,
            "nodeOptions" => array(
                "dynamic" => false,
                "open" => false,
            ),
            "avatar" => null,
            "children" => array(
                array(
                    "id" => $id .  "_Y",
                    "title" => "? " . $vhiServiceType["TITLE"],
                    "entityId" => static::VHI_SERVICE_TYPE_ENTITY_ID,
                    "nodeOptions" => array(
                        "title" => Loc::getMessage('HMS_ENTITY_SELECTOR_VHI_SERVICE_TYPE_YES'),
                        "renderMode" => "override",
                    )
                ),
                array(
                    "id" => $id .  "_N",
                    "title" => "? " . $vhiServiceType["TITLE"],
                    "entityId" => static::VHI_SERVICE_TYPE_ENTITY_ID,
                    "nodeOptions" => array(
                        "title" => Loc::getMessage('HMS_ENTITY_SELECTOR_VHI_SERVICE_TYPE_NO'),
                        "renderMode" => "override",
                    )
                ),
            )
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $vhiServiceTypeQuery = VhiServiceTypeTable::getList(array(
            "filter" => array(
                "%TITLE" => $searchQuery->getQuery()
            ),
            "select" => array(
                "ID"
            )
        ))->fetchCollection();
        $ids = $vhiServiceTypeQuery->getIdList();

        $dialog->addItems($this->getByIDs($ids));
    }

    public function fillDialog(Dialog $dialog): void {
        $ids = VhiServiceTypeTable::getList(array(
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

        $dialog->addTab(new Tab(array(
            "id" => static::VHI_SERVICE_TYPE_ENTITY_TAB,
            "title" => Loc::getMessage("HMS_ENTITY_SELECTOR_TAB_TITLE"),
            "header" => Loc::getMessage("HMS_ENTITY_SELECTOR_TAB_HEADER"),
            "itemMaxDepth" => 2,
        )));
    }
}
