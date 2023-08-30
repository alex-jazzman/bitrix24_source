<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Handler;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Localisation as l;

class NotAllowedErrorHandler extends \Slim\Handlers\NotAllowed
{
    public function __invoke(
        Request $request,
        Response $response,
        array $methods
    ): Response {
        $statusCode = 405;
        if(\SotbitRestAPI::isDebug()) {
            $data = [
                'status'  => 'error',
                'code'    => $statusCode,
                'message' => Core\Helper::convertEncodingToUtf8(
                    $response->withStatus($statusCode)->getReasonPhrase().', method must be one of: '.implode(
                        ', ',
                        $methods
                    )
                ),
            ];
        } else {
            $data = [
                'status'  => 'error',
                'message' => Core\Helper::convertEncodingToUtf8(l::get('ERROR_SERVER')),
            ];
        }

        // write log
        $logWriter = new Core\LogWriter();
        $logWriter->setRequest($request);
        $logWriter->add(
            [
                'RESPONSE_HTTP_CODE' => $statusCode.':'.$data['status'],
            ]
        );

        $body = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        $response->getBody()->write($body);

        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-type', 'application/problem+json');
    }
}
