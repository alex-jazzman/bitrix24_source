<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller;

use Psr\Container\ContainerInterface as Container;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Symfony\Component\EventDispatcher\EventDispatcher;

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
     * @var ContainerInterface
     */
    protected ?Container $container;

    /**
     * @var int
     */
    protected $userId;

    /**
     * @var array
     */
    protected $params;

    /**
     * @var array|null
     */
    protected ?array $queryParams;

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

            Core\Helper::multisortArrayKey($message);
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
        array $data
    ): Response {
        $json = json_encode(
            $data,
            JSON_THROW_ON_ERROR | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE
            | JSON_PRETTY_PRINT | JSON_FORCE_OBJECT
        );

        if ($json === false) {
            throw new \RuntimeException(
                json_last_error_msg(),
                json_last_error()
            );
        }

        $response->getBody()->write($json);

        $responseWithJson = $response->withHeader(
            'Content-Type',
            'application/json;charset=utf-8'
        );

        if (isset($data['code'])) {
            return $responseWithJson->withStatus($data['code']);
        }

        return $responseWithJson;
    }

    /**
     * @param  Request  $request
     * @param  string  $param
     * @param $default
     *
     * @return mixed
     */
    protected function extractQueryParam(Request $request, string $param, $default = null): mixed
    {
        $this->queryParams = $request->getQueryParams();

        return $this->queryParams[$key] ?? $default;
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
            throw new UserException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
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
            throw new UserException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }

        return (string)$login;
    }

    /**
     * Event dispatcher
     *
     * @return mixed
     * @throws \Psr\Container\ContainerExceptionInterface
     */
    protected function getEvents(): EventDispatcher
    {
        return $this->container->get('event_dispatcher');
    }

}
