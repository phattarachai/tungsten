<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\PanelRegistry;

/**
 * The action of every page route. A cached route stores this class name; a closure over the page object would
 * come back as an incomplete object after `route:cache`.
 */
class PageController
{
    public function __invoke(Request $request, PanelRegistry $panels): Response
    {
        $page = $panels->pageForRoute($request->route()?->getName());

        abort_unless($page instanceof Page, 404);

        return Inertia::render($page->component(), $page->props($request));
    }
}
