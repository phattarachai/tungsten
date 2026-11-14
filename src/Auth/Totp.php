<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Auth;

use BaconQrCode\Renderer\Color\Rgb;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\Fill;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Exceptions\Google2FAException;
use PragmaRX\Google2FA\Google2FA;

/**
 * Authenticator-app codes (RFC 6238, 30-second steps, 6 digits) and the QR that enrols an app. A code is accepted once:
 * the last step a user used is cached, so a code read over a shoulder can't be replayed in the same window.
 */
class Totp
{
    public function __construct(private readonly Google2FA $engine, private readonly Cache $cache) {}

    public function generateSecret(): string
    {
        return $this->engine->generateSecretKey(32);
    }

    /**
     * The `otpauth://` URL an authenticator app reads from the QR.
     */
    public function provisioningUrl(string $label, string $secret): string
    {
        return $this->engine->getQRCodeUrl($this->issuer(), $label, $secret);
    }

    public function qrSvg(string $label, string $secret): string
    {
        $style = new RendererStyle(192, 0, null, null, Fill::uniformColor(new Rgb(255, 255, 255), new Rgb(24, 24, 27)));
        $svg = (new Writer(new ImageRenderer($style, new SvgImageBackEnd)))->writeString($this->provisioningUrl($label, $secret));

        return trim(substr($svg, (int) strpos($svg, "\n") + 1));
    }

    /**
     * Whether `$code` is the current code for `$secret` (within `tungsten.login.two_factor.window` steps), and newer
     * than the last code `$key` (the user) used.
     *
     * @throws Google2FAException on a malformed secret
     */
    public function verify(string $secret, string $code, string|int $key): bool
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';

        if (preg_match('/^\d{6}$/', $code) !== 1) {
            return false;
        }

        $cacheKey = "tungsten.totp.{$key}";
        $window = (int) config('tungsten.login.two_factor.window', 1);
        $last = $this->cache->get($cacheKey);
        $step = $this->engine->verifyKeyNewer($secret, $code, is_int($last) ? $last : 0, $window);

        if (! is_int($step)) {
            return false;
        }

        $this->cache->put($cacheKey, $step, ($window * 2 + 1) * 30);

        return true;
    }

    /**
     * Fresh recovery codes, `tungsten.login.two_factor.recovery_codes` of them, each like `k3x9p-7mq2d`.
     *
     * @return list<string>
     */
    public function recoveryCodes(): array
    {
        $count = max(1, (int) config('tungsten.login.two_factor.recovery_codes', 8));

        return array_map(fn (): string => Str::lower(Str::random(5).'-'.Str::random(5)), range(1, $count));
    }

    private function issuer(): string
    {
        return (string) (config('tungsten.login.two_factor.issuer') ?: config('app.name', 'Laravel'));
    }
}
