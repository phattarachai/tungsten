@php
    $tungstenPage = (string) config('tungsten.vite.pages').'/'.$page['component'].'.jsx';
    $tungstenBrand = isset($tungstenPanel) ? $tungstenPanel->getBrandColor() : config('tungsten.brand_color');
    $tungstenStyle = $tungstenBrand ? "--color-brand: {$tungstenBrand}" : null;
    $tungstenEnv = \Phattarachai\Tungsten\Tungsten::environment();
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="tungsten" @if ($tungstenStyle) style="{{ $tungstenStyle }}" @endif>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @if ($tungstenEnv)
        <meta name="tungsten-env" content="{{ $tungstenEnv['label'] }}">
    @endif

    <title inertia>{{ $tungstenEnv ? $tungstenEnv['label'].' · ' : '' }}{{ config('app.name') }}</title>

    @foreach (array_filter((array) config('tungsten.favicon')) as $tungstenIcon)
        <link rel="icon" href="{{ asset($tungstenIcon) }}" @if (str_ends_with($tungstenIcon, '.svg')) type="image/svg+xml" @elseif (str_ends_with($tungstenIcon, '.png')) type="image/png" @endif>
    @endforeach
    @if (config('tungsten.apple_touch_icon'))
        <link rel="apple-touch-icon" href="{{ asset(config('tungsten.apple_touch_icon')) }}">
    @endif

    @viteReactRefresh
    @vite(array_values(array_filter([config('tungsten.vite.entry'), ! str_starts_with($page['component'], 'tungsten::') && file_exists(base_path($tungstenPage)) ? $tungstenPage : null])), config('tungsten.vite.build_directory'))
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
