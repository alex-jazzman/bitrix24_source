<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository;

use Bitrix\Sale;
use Bitrix\Main\Loader;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Repository\Sale as _Sale,
    Sotbit\RestAPI\Exception\SaleException,
    Sotbit\RestAPI\Core,
    Sotbit\RestAPI\Localisation as l;

class SaleRepository extends BaseRepository
{
    protected $error = [];
    protected $orderClass;
    protected $basketClass;

    protected $statuses = [];
    protected $paySystems = [];
    protected $deliveries = [];

    /**
     * OrderRepository constructor.
     *
     * @throws \Bitrix\Main\LoaderException
     */
    public function __construct()
    {
        parent::__construct();
        if(!Loader::includeModule("sale")) {
            throw new SaleException(l::get('ERROR_MODULE_SALE'), StatusCode::HTTP_BAD_REQUEST);
        }
        if(!Loader::includeModule("catalog")) {
            throw new SaleException(l::get('ERROR_MODULE_CATALOG'), StatusCode::HTTP_BAD_REQUEST);
        }

        $this->permission = new _Sale\Permission();

        $registry = Sale\Registry::getInstance(Sale\Registry::REGISTRY_TYPE_ORDER);

        /** @var Sale\Order $orderClass */
        $this->orderClass = Sale\Registry::getInstance(Sale\Registry::REGISTRY_TYPE_ORDER)->getOrderClassName();

        /** @var Sale\Basket $basketClass */
        $this->basketClass = $registry->getBasketClassName();
    }

    public function getOrder(int $orderId, int $userId)
    {
        // check permission
        //$this->permission->user($userId)->section($iblockId, 0);

        $order = new _Sale\Order();

        return $order->setUserId($userId)->getById($orderId);
    }

    public function getOrderList(array $params)
    {
        $userId = $params['user_id'];

        // prepare params to catalog params
        $params = $this->prepareNavigation($params);

        // check permission
        //$this->permission->user($userId)->section((int) $params['filter']['IBLOCK_ID'], 0);

        $order = new _Sale\Order();

        return $order->setUserId($userId)->getList($params);
    }

    public function getOrderStatus(int $orderId, int $userId)
    {
        // check permission
        //$this->permission->user($userId)->section($iblockId, 0);

        $order = new _Sale\Order();

        return $order->setUserId($userId)->getStatus($orderId);
    }

    public function setOrderCancel(string $orderId, string $reason, int $userId)
    {
        // check permission
        //$this->permission->user($userId)->section($iblockId, 0);

        $order = new _Sale\Order();

        return $order->setUserId($userId)->setCancel($orderId, $reason);
    }


    /**
     * Get basket
     *
     * @param  array  $params
     *
     * @return array
     * @throws SaleException
     */
    public function getBasket(array $params): array
    {
        $userId = $params['user_id'];
        // check permission
        //$this->permission->user($userId)->section($iblockId, $sectionId);

        $basket = new _Sale\Basket();

        return $basket->setUserId($userId)->get($params);
    }

    public function addBasket(array $params)
    {
        $userId = $params['user_id'];

        // check permission
        //$this->permission->user($userId)->section($iblockId, $sectionId);

        $basket = new _Sale\Basket();

        return $basket->setUserId($userId)->add($params);
    }

    public function deleteBasket(array $params)
    {
        $userId = $params['user_id'];

        // check permission
        //$this->permission->user($userId)->section($iblockId, $sectionId);

        $basket = new _Sale\Basket();

        return $basket->setUserId($userId)->delete($params);
    }

/*    public function getBasketCoupons(int $userId): array
    {
        $basket = new _Sale\Basket();

        return $basket->setUserId($userId)->getCoupons();
    }

    public function addBasketCoupon($coupon, int $userId): array
    {
        $basket = new _Sale\Basket();

        return $basket->setUserId($userId)->addCoupon($coupon);
    }

    public function deleteBasketCoupon(int $id, int $userId): array
    {
        $basket = new _Sale\Basket();

        return $basket->setUserId($userId)->deleteCoupon($id);
    }
*/

    /**
     * Get buyer id from user id
     *
     * @param  int  $userId
     *
     * @return false|int
     * @throws \Bitrix\Main\ArgumentException
     */
    public function getSaleFuserId(int $userId)
    {
        return Sale\Fuser::getIdByUserId($userId);
    }

    /**
     * Get user id from buyer id
     *
     * @param  int  $fuserId
     *
     * @return int
     * @throws \Bitrix\Main\ArgumentException
     */
    public function getSaleUserId(int $fuserId)
    {
        return Sale\Fuser::getUserIdById($fuserId);
    }

    /**
     * Get all active pay systems
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentException
     */
    public function getPaySystems(): array
    {
        $query = Sale\PaySystem\Manager::getList(
            [
                'filter' => [
                    'ACTIVE' => 'Y',
                ],
            ]
        );
        while($paySystem = $query->Fetch()) {
            $this->paySystems[$paySystem['ID']] = $paySystem;
        }

        return $this->paySystems;
    }

    public function getDeliveries(): array
    {
        $query = Sale\Delivery\Services\Table::getList(
            [
                'filter' => [
                    'ACTIVE' => 'Y',
                ],
            ]
        );
        while($delivery = $query->Fetch()) {
            $this->deliveries[$delivery['ID']] = $delivery;
        }

        return $this->deliveries;
    }

    /**
     * Get all statuses from sale
     *
     * @return array
     */
    public function getStatuses(): array
    {
        $query = Sale\Internals\StatusLangTable::getList(
            [
                'order' => ['STATUS.SORT' => 'ASC'],
                //'filter' => array('STATUS.TYPE'=>'O','LID'=>LANGUAGE_ID),
                'select' => ['STATUS_ID', 'NAME', 'DESCRIPTION'],
            ]
        );

        while($status = $query->fetch()) {
            $this->statuses[$status['STATUS_ID']] = $status['NAME'];
        }

        return $this->statuses;
    }

    /**
     * Get all person type from sale
     *
     * @return array
     */
    public function getPersonTypes(): array
    {
        return Sale\PersonType::load($this->siteId) ?? [];
    }

    public function getPersonTypeName($id): string
    {
        $personTypes = $this->getPersonTypes();

        if(is_array($personTypes) && isset($personTypes[$id])) {
            return $personTypes[$id]['NAME'];
        }

        return '';
    }

}
