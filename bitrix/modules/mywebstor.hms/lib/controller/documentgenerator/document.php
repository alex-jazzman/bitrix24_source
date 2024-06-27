<?

namespace MyWebstor\Hms\Controller\DocumentGenerator;

use Bitrix\Crm\Integration\DocumentGeneratorManager;
use Bitrix\Main\Engine\Response\DataType\ContentUri;
use Bitrix\Main\Engine\UrlManager;
use Bitrix\Main\Result;
use Bitrix\Main\Engine\Controller;
use Bitrix\DocumentGenerator\Controller\Document as DocGenControllerDocument;

class Document extends Controller {
    const CONTROLLER_PATH = 'hms.documentgenerator';

    protected function getDocumentGeneratorController() {
        return (new DocGenControllerDocument());
    }

    public function getAutoWiredParameters() {
        return $this->getDocumentGeneratorController()->getAutoWiredParameters($this);
    }

    public function updateAction(\Bitrix\DocumentGenerator\Document $document, array $values = array(), $stampsEnabled = 1) {
        $result = $this->proxyAction('updateAction', [$document, $values, $stampsEnabled]);

        if (is_array($result)) {
            $result['document'] = $this->prepareDocumentData($result['document']);
        }

        return $result;
    }

    public function enablePublicUrlAction(\Bitrix\DocumentGenerator\Document $document, $status = 1) {
        return $this->proxyAction('enablePublicUrlAction', [$document, $status]);
    }

    public function getFieldsAction(\Bitrix\DocumentGenerator\Document $document, array $values = []) {
        return $this->proxyAction('getFieldsAction', [$document, $values]);
    }

    protected function proxyAction($action, array $arguments = []) {
        $controller = $this->getDocumentGeneratorController();
        $controller->setScope($this->getScope());
        /** @var Result $result */
        $result = call_user_func_array([$controller, $action], $arguments);
        $this->errorCollection->add($controller->getErrors());
        if ($result === false) {
            $result = null;
        }

        return $result;
    }

    protected function prepareDocumentData(array $data) {
        if (isset($data['imageUrl']) && !empty($data['imageUrl'])) {
            $data['imageUrl'] = $this->getDocumentFileLink($data['id'], 'getImage', $data['updateTime']);
        }
        if (isset($data['pdfUrl']) && !empty($data['pdfUrl'])) {
            $data['pdfUrl'] = $this->getDocumentFileLink($data['id'], 'getPdf', $data['updateTime']);
        }
        $data['downloadUrl'] = $this->getDocumentFileLink($data['id'], 'download', $data['updateTime']);
        if (isset($data['value'])) {
            $data['entityId'] = $data['value'];
            unset($data['value']);
        }
        if (isset($data['provider'])) {
            $providersMap = DocumentGeneratorManager::getInstance()->getCrmOwnerTypeProvidersMap();
            $data['entityTypeId'] = str_ireplace(array_values($providersMap), array_keys($providersMap), $data['provider']);
            unset($data['provider']);
        }
        if (isset($data['printUrl'])) {
            unset($data['printUrl']);
        }

        return $data;
    }

    protected function getDocumentFileLink($documentId, $action, $updateTime = null) {
        if (!$updateTime) {
            $updateTime = time();
        }
        $link = UrlManager::getInstance()->create(static::CONTROLLER_PATH . '.document.' . $action, ['id' => $documentId, 'ts' => $updateTime]);
        $link = new ContentUri(UrlManager::getInstance()->getHostUrl() . $link->getLocator());

        return $link;
    }
}
