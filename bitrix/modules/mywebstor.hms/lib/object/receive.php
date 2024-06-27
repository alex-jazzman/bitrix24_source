<?

namespace MyWebstor\Hms\Object;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\ORM\Objectify\EntityObject;
use Bitrix\Main\ORM\Objectify\State;
use MyWebstor\Hms\EO_Receive;
use MyWebstor\Hms\Object\Receive\BaseReceive;
use MyWebstor\Hms\Receive\BaseReceiveTable;

class Receive extends EO_Receive {
    /** @var null|BaseReceive|EntityObject */
    protected static $typedReceiveObject = null;

    /**
     * @return null|BaseReceiveTable|DataManager
     */
    protected function getReceiveObjectDataClass() {
        $type = $this->fillType();
        if ($type === \MyWebstorHmsHelper::HMS_RECEIVE_TYPE_BASE)
            return BaseReceiveTable::class;

        $event = new Event("mywebstor.hms", "onGetReceiveObjectDataClass");
        $event->send();
        foreach ($event->getResults() as $eventResult) {
            if ($eventResult->getType() !== EventResult::SUCCESS) continue;

            $parameters = $eventResult->getParameters();
            if (!is_array($parameters)) continue;

            if (
                is_array($parameters)
                && isset($parameters[$type])
                && class_exists($parameters[$type])
            ) return $parameters[$type];
        }

        return null;
    }

    /**
     * @return null|BaseReceive|EntityObject
     */
    public function getTypedReceiveObject($createIfNotExists = true) {
        if (static::$typedReceiveObject !== null)
            return static::$typedReceiveObject;

        if ($this->state == State::RAW) return null;

        $dataClass = $this->getReceiveObjectDataClass();
        if (!$dataClass) return null;

        $receiveID = $this->getId();
        $objectQueryResult = $dataClass::getById($receiveID);

        $typedReceiveObject = $objectQueryResult->fetchObject();
        if (
            !$typedReceiveObject
            && $createIfNotExists
        ) $typedReceiveObject = $this->createTypedReceiveObject();

        return (static::$typedReceiveObject = $typedReceiveObject ?: null);
    }

    public function createTypedReceiveObject() {
        if (static::$typedReceiveObject !== null)
            return static::$typedReceiveObject;

        if ($this->state === State::RAW) return null;

        $dataClass = $this->getReceiveObjectDataClass();
        if (!$dataClass) return null;

        $receiveID = $this->getId();
        /** @var BaseReceive|EntityObject $object */
        $object = $dataClass::createObject();
        $object->setId($receiveID);
        $result = $object->save();
        if (!$result->isSuccess())
            return null;

        return (static::$typedReceiveObject = $object);
    }
}
