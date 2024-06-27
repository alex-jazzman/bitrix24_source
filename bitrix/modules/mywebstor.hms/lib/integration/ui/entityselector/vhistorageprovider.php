<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Crm\Communication\Normalizer;
use Bitrix\Crm\ContactTable;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use Bitrix\UI\EntitySelector\Tab;
use MyWebstor\Hms\Vhi\VhiStorageTable;

Loc::loadMessages(__FILE__);

class VhiStorageProvider extends EntityProvider {
    protected function fetchEntryIds(array $ids): array {
        return
            VhiStorageTable::getList(array(
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
        $vhiStorageObject = VhiStorageTable::getList(array(
            "filter" => array(
                "ID" => $id
            ),
            "select" => array(
                "*",
                "CONTACT_TITLE"
            )
        ))->fetchObject();
        if (!$vhiStorageObject) return null;

        return new Item(array(
            "id" => $vhiStorageObject->getId(),
            "entityId" => "hms-vhi-storage",
            "title" => array(
                "text" => "<strong>" . $vhiStorageObject->getNumber() . "</strong>, " . $vhiStorageObject->getDateStart()->toString() . " - " . $vhiStorageObject->getDateEnd()->toString(),
                "type" => "html"
            ),
            "subtitle" => array(
                "text" => join("<br>", array(
                    $vhiStorageObject->getContactTitle(),
                    $vhiStorageObject->getBirthdate(),
                    $vhiStorageObject->getPhone()
                )),
                "type" => "html"
            ),
            "link" => "",
            "linkTitle" => "",
            "avatar" => "",
            "searchable" => true,
            "hidden" => false
        ));
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $vhiStorageQuery = VhiStorageTable::query();
        $vhiStorageQuery
            ->setSelect(array("ID"));

        $searchString = trim($searchQuery->getQuery());

        $condition = new ConditionTree;
        $condition->logic(ConditionTree::LOGIC_OR);
        $condition
            ->whereLike("NUMBER", "%" . $searchString . "%")
            ->whereLike("LAST_NAME", "%" . $searchString . "%")
            ->whereLike("NAME", "%" . $searchString . "%")
            ->whereLike("SECOND_NAME", "%" . $searchString . "%")
            ->whereLike("PHONE", "%" . $searchString . "%");

        $vhiStorageQuery->where($condition);

        $items = array();
        $vhiStorageCollection = $vhiStorageQuery->fetchCollection();
        foreach ($vhiStorageCollection as $vhiStorageObject) {
            $item = $this->makeItem($vhiStorageObject->getId());

            $items[] = $item;
        }

        $dialog->addItems($items);
    }

    public function fillDialog(Dialog $dialog): void {
        $contactID = $this->options["CONTACT_ID"];
        if ($contactID && $contactID > 0) {
            $contactObject = ContactTable::getList(array(
                "filter" => array(
                    "ID" => $contactID
                ),
                "select" => array(
                    "*",
                    "PHONE"
                )
            ))->fetchObject();
            if (isset($contactObject)) {
                $tab = new Tab(array(
                    'id' => 'similar',
                    'title' => Loc::getMessage('HMS_ENTITY_SELECTOR_TAB_TITLE'),
                    'header' => Loc::getMessage('HMS_ENTITY_SELECTOR_TAB_HEADER'),
                ));
                $dialog->addTab($tab);

                $condition = new ConditionTree;
                $condition->logic(ConditionTree::LOGIC_OR);

                $fioCondition = new ConditionTree;
                $fioCondition->logic(ConditionTree::LOGIC_AND);
                if ((($contactLastName = $contactObject->getLastName())) !== null)
                    $fioCondition->whereLike("LAST_NAME", "%" . trim($contactLastName) . "%");
                if ((($contactName = $contactObject->getName())) !== null)
                    $fioCondition->whereLike("NAME", "%" . trim($contactName) . "%");
                if ((($contactSecondName = $contactObject->getSecondName())) !== null)
                    $fioCondition->whereLike("SECOND_NAME", "%" . trim($contactSecondName) . "%");
                if ((($contactBirthdate = $contactObject->getBirthdate())) !== null)
                    $fioCondition->where("BIRTHDATE", $contactBirthdate);

                $condition->where($fioCondition);
                if (($contactPhone = Normalizer::normalizePhone($contactObject->getPhone())))
                    $condition->whereLike("PHONE", "%" . $contactPhone . "%");

                $vhiStorageQuery = VhiStorageTable::query();
                $vhiStorageQuery
                    ->where($condition)
                    ->setSelect(array("ID"));

                $items = array();
                $vhiStorageCollection = $vhiStorageQuery->fetchCollection();
                foreach ($vhiStorageCollection as $vhiStorageObject) {
                    $item = $this->makeItem($vhiStorageObject->getId());
                    $item->addTab("similar");

                    $items[] = $item;
                }

                $dialog->addItems($items);
                return;
            }
        }

        $ids = VhiStorageTable::getList(array(
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
