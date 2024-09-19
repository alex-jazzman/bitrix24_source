<?php
declare(strict_types = 1);

namespace Sotbit\RestAPI\Middleware;

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Slim\Psr7\Response;

class TrailingSlash extends Base implements MiddlewareInterface
{
    /**
     * @var bool Add or remove the slash
     */
    private bool $trailingSlash;

    /**
     * Configure whether add or remove the slash.
     */
    public function __construct(bool $trailingSlash = false)
    {
        $this->trailingSlash = $trailingSlash;
    }

    /**
     * Process a request and return a response.
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $uri = $request->getUri();
        $path = $this->normalize($uri->getPath());

        if ($uri->getPath() !== $path) {
            $response = new Response();
            return $response
                ->withHeader('Location', (string) $path)
                ->withStatus(StatusCode::STATUS_MOVED_PERMANENTLY);
        }

        return $handler->handle($request->withUri($uri->withPath($path)));
    }

    /**
     * Normalize the trailing slash.
     */
    private function normalize(string $path): string
    {
        if ($path === '') {
            return '/';
        }

        if (strlen($path) > 1) {
            if ($this->trailingSlash) {
                if (!str_ends_with($path, '/') && !pathinfo($path, PATHINFO_EXTENSION)) {
                    return $path.'/';
                }
            } else {
                return rtrim($path, '/');
            }
        }

        return $path;
    }
}