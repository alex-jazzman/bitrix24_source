<?

namespace MyWebstor\Hms\Object\Receive;

use Bitrix\Main\Result;
use Bitrix\Main\Type\DateTime;
use MyWebstor\Hms\Receive\EO_BaseReceive;

class BaseReceive extends EO_BaseReceive implements ReceiveInterface {
    protected $fields = array(
        "DIAGNOSIS",
        "REPORT",
        "RECOMMENDATION",
    );

    public function saveByData($data): Result {
        $data = $data["RECEIVE"];

        foreach ($this->fields as $fieldName) {
            if (
                !array_key_exists($fieldName, $data)
                || !$this->entity->hasField($fieldName)
            ) continue;

            $value = $data[$fieldName];

            $this->set($fieldName, $value);
        }

        if (isset($data["END_RECEIVE"])) {
            $receiveObject = $this->fillReceive();

            switch ($data["END_RECEIVE"]) {
                case "Y":
                    if (!$receiveObject->getDateEnd())
                        $receiveObject
                            ->setDateEnd(new DateTime())
                            ->save();
                    break;
                case "N":
                default:
                    $receiveObject
                        ->setDateEnd(null)
                        ->save();
                    break;
            }
        }

        $saveResult = $this->save();

        return $saveResult;
    }
}
