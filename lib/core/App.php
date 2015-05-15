<?php

final class App extends Common {
    private static $_core    = null;

    public static function Build($alias, $path, $option = []) {
        if (!self::$_core) self::$_core = Core::Get();
        $core   = self::$_core;
        $core->setPath($alias, $path, $option);
    }

    public static function Uses($root, $class, $ext = "php") {
        if (!self::$_core) self::$_core = Core::Get();
        $core   = self::$_core;
        $src    = debug_backtrace(false, 1)[0]["file"];
        $ext    = strtolower($ext);

        $core->setClass($root, $class, $src, $ext);
    }
}
