<?

namespace MyWebstor\Hms\Controller;

use Bitrix\Main\Engine\Controller;

class Entity extends Controller {
    public function configureActions() {
        return array(
            "search" => array(
                "class" => \MyWebstor\Hms\Controller\Action\Entity\SearchAction::class
            )
        );
    }
}
