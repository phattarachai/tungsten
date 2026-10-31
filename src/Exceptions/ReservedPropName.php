<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Exceptions;

use LogicException;

/**
 * A panel page returned a prop named like one the panel shares (`panel`, `panels`, `panel_links`, `nav`, `auth`, `flash`): the page's
 * value would replace the shared one and break the shell.
 */
class ReservedPropName extends LogicException
{
    /**
     * @param  list<string>  $names
     */
    public static function on(string $component, array $names): self
    {
        $list = implode(', ', $names);

        return new self("Tungsten: page [{$component}] returns the prop(s) [{$list}], which the panel shares itself; the page's value would replace the shared one and break AppLayout. Rename the page prop.");
    }
}
