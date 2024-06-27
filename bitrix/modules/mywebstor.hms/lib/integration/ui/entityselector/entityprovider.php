<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Main\Type\Collection;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\BaseProvider;

abstract class EntityProvider extends BaseProvider {
    public function __construct($options = array()) {
        parent::__construct();

        $this->options = $options;
    }

    public function isAvailable(): bool {
        /** @var \CUser $USER */
        global $USER;
        return $USER->IsAuthorized();
    }

    public function getItems($ids): array {
        return $this->getByIDs($ids);
    }

    protected function getByIDs($ids) {
        $items = array();
        Collection::normalizeArrayValuesByInt($ids);
        if (empty($ids)) return $items;

        $ids = $this->fetchEntryIds($ids);

        foreach ($ids as $id)
            $items[] = $this->makeItem($id);

        return $items;
    }

    abstract protected function fetchEntryIds(array $ids): array;

    abstract protected function makeItem(int $id): ?Item;
}
