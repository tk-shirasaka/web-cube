<?php

final class App extends Common {
    private static $_core    = null;

    public static function Build($alias, $path, $option = []) {
        if (!self::$_core) self::$_core = Core::Get();
        self::$_core->setPath($alias, $path, $option);
    }

    public static function Uses($root, $class, $ext = "php") {
        if (!self::$_core) self::$_core = Core::Get();
        $src    = debug_backtrace(false, 1)[0]["file"];
        $ext    = strtolower($ext);

        self::$_core->setClass($root, $class, $src, $ext);
    }

    public static function GetUses($src = null, $target = false) {
        if (!self::$_core)  self::$_core    = Core::Get();
        if (!$src)          $src            = debug_backtrace(false, 1)[0]["file"];

        return self::$_core->getUses($src, $target);
    }
}
