<?

namespace MyWebstor\Hms\Object;

use Bitrix\Main\ORM\Objectify\State;
use MyWebstor\Hms\EO_Appointment;
use MyWebstor\Hms\ReceiveTable;

class Appointment extends EO_Appointment {
    public function getReceive($isCreate = false) {
        $receiveObject = parent::getReceive();
        if (isset($receiveObject))
            return $receiveObject;

        if (!$isCreate || $this->state === State::RAW)
            return null;

        $specializationObject = $this->fillSpecialization();
        $receiveType = $specializationObject ? $specializationObject->getReceiveType() : null;

        $receiveObject = ReceiveTable::createObject();
        $receiveObject
            ->setId($this->getId())
            ->setType($receiveType ?: \MyWebstorHmsHelper::HMS_RECEIVE_TYPE_BASE);
        $saveResult = $receiveObject->save();
        if (!$saveResult->isSuccess())
            return null;

        $receiveObject->getTypedReceiveObject(true);

        $this->setReceive($receiveObject);
        return $receiveObject;
    }
}
