<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Http\Request;
use Override;
use Phattarachai\Tungsten\PanelRegistry;

/**
 * `auth` for a panel with its own login: the same check, but a guest is sent to the panel's login page.
 */
class AuthenticatePanel extends Authenticate
{
    #[Override]
    protected function redirectTo(Request $request): ?string
    {
        return app(PanelRegistry::class)->forRoute($request->route()?->getName())?->loginUrl() ?? parent::redirectTo($request);
    }
}
