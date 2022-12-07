<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller;

use Slim\Container;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Service\Order;
use Sotbit\RestAPI\Service\Support;
use Sotbit\RestAPI\Service\User;
use Sotbit\RestAPI\Service\Event;
use Sotbit\RestAPI\Exception\UserException;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class BaseController
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
abstract class BaseController
{
    public const RESPONSE_SUCCESS = 'success';
    public const RESPONSE_ERROR = 'error';

    /**
     * @var Container
     */
    protected $container;

    /**
     * @var int
     */
    protected $userId;

    /**
     * BaseController constructor.
     *
     * @param  Container  $container
     */
    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Response
     *
     * @param  Response  $response
     * @param  string  $status
     * @param $message
     * @param  int  $code
     *
     * @return Response
     */
    protected function response(
        Response $response,
        string $status,
        $message,
        int $code
    ): Response {
        if(!empty($message)) {
            $message = Core\Helper::convertEncodingToUtf8(
                Core\Helper::convertOutputArray($message)
            );
        }

        $result = [
            'code'      => $code,
            'status'    => $status,
            'message'   => $message,
            'timestamp' => time(),
        ];

        return $this->jsonResponse($response, $result);
    }


    /**
     * Response in JSON
     *
     * @param  Response  $response
     * @param  string  $status
     * @param $message
     * @param  int  $code
     *
     * @return Response
     */
    protected function jsonResponse(
        Response $response,
        array $result
    ): Response {
        return $response->withJson(
            $result,
            $result['code'],
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
            | JSON_FORCE_OBJECT
        );
    }

    /**
     * Get user id out of request
     *
     * @param  Request  $request
     *
     * @return int
     * @throws UserException
     */
    protected function getUserId(Request $request): int
    {
        $input = (array)$request->getParsedBody();
        $userId = $input['decoded']->sub;

        if(!$userId) {
            throw new UserException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_BAD_REQUEST);
        }

        return (int)$userId;
    }

    /**
     * Get login out of request
     *
     * @param  Request  $request
     *
     * @return int
     * @throws UserException
     */
    protected function getLogin(Request $request): string
    {
        $input = (array)$request->getParsedBody();
        $login = $input['decoded']->login;

        if(!$login) {
            throw new UserException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_BAD_REQUEST);
        }

        return (string)$login;
    }


    /**
     * Order find service
     *
     * @return Order\Find
     */
    protected function getServiceFindOrder(): Order\Find
    {
        return $this->container->get('find_order_service');
    }

    /**
     * Order create service
     *
     * @return Order\Create
     */
    protected function getServiceCreateOrder(): Order\Create
    {
        return $this->container->get('create_order_service');
    }

    /**
     * Order update service
     *
     * @return Order\Update
     */
    protected function getServiceUpdateOrder(): Order\Update
    {
        return $this->container->get('update_order_service');
    }

    /**
     * Support find service
     *
     * @return Support\Find
     */
    protected function getServiceFindSupport(): Support\Find
    {
        return $this->container->get('find_support_service');
    }

    /**
     * Support create service
     *
     * @return Support\Create
     */
    protected function getServiceCreateSupport(): Support\Create
    {
        return $this->container->get('create_support_service');
    }

    /**
     * Support update service
     *
     * @return Support\Update
     */
    protected function getServiceUpdateSupport(): Support\Update
    {
        return $this->container->get('update_support_service');
    }

    /**
     * Support delete service
     *
     * @return Support\Delete
     */
    protected function getServiceDeleteSupport(): Support\Delete
    {
        return $this->container->get('delete_support_service');
    }


    /**
     * User service
     *
     * @return User\UserService
     */
    protected function getUserService(): User\UserService
    {
        return $this->container->get('user_service');
    }

    /**
     * Event service
     *
     * @return Event\EventService
     */
    protected function getEventService(): Event\EventService
    {
        return $this->container->get('event_service');
    }


}
