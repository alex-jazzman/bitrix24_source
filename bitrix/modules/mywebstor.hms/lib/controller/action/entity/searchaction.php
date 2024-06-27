<?

namespace MyWebstor\Hms\Controller\Action\Entity;

use Bitrix\Crm\ContactTable;
use Bitrix\Crm\Controller\Action\Entity\SearchAction as EntitySearchAction;
use Bitrix\Main\Type\Date;
use Bitrix\Main\UI\PageNavigation;

class SearchAction extends EntitySearchAction {
    public function provideData($searchQuery, ?array $options = null, ?PageNavigation $pageNavigation = null) {
        $results = parent::provideData($searchQuery, $options, $pageNavigation);
        if (empty($results)) return $results;

        $resultsID = array_map(function ($resultItem) {
            /** @var \Bitrix\Main\Search\ResultItem $resultItem */
            return $resultItem->getId();
        }, $results);

        $contactQuery = ContactTable::query();
        $contactQuery
            ->whereIn("ID", $resultsID)
            ->setSelect(array("ID", "BIRTHDATE"));
        $contactCollection = $contactQuery->fetchCollection();

        foreach ($results as $resultItem) {
            $contactID = $resultItem->getId();
            $contactObject = $contactCollection->getByPrimary(array("ID" => $contactID));
            if (
                !$contactObject
                || !($contactBirthdate = $contactObject->getBirthdate())
            ) continue;

            $birthdateString = $contactBirthdate->toString();
            $today = new Date();
            $diff = $today->getDiff($contactBirthdate);
            $dateWithoutYears = clone $contactBirthdate;
            $dateWithoutYears->add("P" . $diff->y . "Y");

            $birthdateString .=
                " (" .
                join(" ", array_values(array_filter(array(
                    FormatDate("Ydiff", $contactBirthdate->getTimestamp()),
                    $diff->m ? strtolower(FormatDate("mdiff", $dateWithoutYears->getTimestamp())) : null
                )))) .
                ")";

            $resultItem->setAttribute("birthdate", $birthdateString);
        }

        return $results;
    }
}
