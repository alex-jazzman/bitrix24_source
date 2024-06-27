<?

namespace MyWebstor\Hms\Object\Receive;

use \Bitrix\Main\Result;

interface ReceiveInterface {
    /**
     * @param array $data
     */
    public function saveByData($data): Result;
}
