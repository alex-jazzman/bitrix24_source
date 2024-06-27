<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Engine\Response;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Loader;

class VhiAppointmentController extends \Bitrix\Main\Engine\Controller {
    /**
     * @return \Bitrix\Main\Engine\Response\HtmlContent
     * @throws \Bitrix\Main\LoaderException
     */
    public function getVhiClientInfoAction(): Response\HtmlContent {
        if (!Loader::includeModule('mywebstor.hms')) {
            return $this->sendErrorResponse('Could not load "mywebstor.hms" module.');
        }

        $template = $this->request->get('template') ?: '.default';
        $componentParams = array(
            "CONTACT_ID" => $this->request->get("CLIENT_ID")
        );

        return new Response\Component(
            'mywebstor:hms.vhi.appointment',
            $template,
            $componentParams,
            [
                'HIDE_ICONS' => 'Y',
                'ACTIVE_COMPONENT' => 'Y'
            ]
        );
    }

    private function sendErrorResponse(string $message) {
        $errorCollection = new ErrorCollection();
        $errorCollection->setError(new Error($message));

        return Response\AjaxJson::createError($errorCollection);
    }
}
