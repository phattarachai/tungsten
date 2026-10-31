@php
    $tungstenPage = (string) config('tungsten.vite.pages').'/'.$page['component'].'.jsx';
    $tungstenBrand = isset($tungstenPanel) ? $tungstenPanel->getBrandColor() : config('tungsten.brand_color');
    $tungstenStyle = $tungstenBrand ? "--color-brand: {$tungstenBrand}" : null;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="tungsten" @if ($tungstenStyle) style="{{ $tungstenStyle }}" @endif>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name') }}</title>

    @if (config('tungsten.favicon'))
        <link rel="icon" href="{{ asset(config('tungsten.favicon')) }}">
    @endif

    @viteReactRefresh
    @vite(array_values(array_filter([config('tungsten.vite.entry'), ! str_starts_with($page['component'], 'tungsten::') && file_exists(base_path($tungstenPage)) ? $tungstenPage : null])), config('tungsten.vite.build_directory'))
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
