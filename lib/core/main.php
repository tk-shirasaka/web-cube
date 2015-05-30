<?php

final class Core {
    private static  $_this  = null;
    private $_classes       = [];
    private $_pathes        = [];
    private $_configure     = [];
    private $_data          = [];
    private $_routing       = [];
    private $_params        = [];

    private function __construct() {
        self::$_this =& $this;
    }

    public static function Get() {
        $called = debug_backtrace(false, 1)[0]["file"];
        $is_lib = strpos($called, LIB);

        if (!self::$_this) new Core;
        return ($is_lib !== false) ? self::$_this : false;
    }

    public function start() {
        App::Uses("Config",     "Configure");
        App::Uses("Utility",    "Parameter");
        App::Uses("Utility",    "I18n");
        App::Uses("Config",     "ErrorHandler");
        App::Uses("Model",      "ModelMaster");

        $this->getClass("Config.Configure",     __FILE__);
        $this->getClass("Utility.Parameter",    __FILE__);
        $this->getClass("Utility.I18n",         __FILE__);
        $this->getClass("Config.ErrorHandler",  __FILE__);
        $this->getClass("Model.ModelMaster",    __FILE__);
    }

    public function setPropaty($propaty) {
        foreach ($propaty as $key => $val) {
            $key            = "_". strtolower($key);

            if (!isset($this->{$key})) continue;
            $this->{$key}   = $val;
        }
    }

    public function setPath($aliase, $path, $option) {
        $default    = [
            "lib" => false,
            "app" => true,
        ];
        $option     = array_merge($default, $option);

        if (!isset($this->_pathes[$aliase])) $this->_pathes[$aliase] = [];
        if ($option["lib"]) $this->_pathes[$aliase][] = LIB. DS. strtolower($path);
        if ($option["app"]) $this->_pathes[$aliase][] = APP. DS. $path;
    }

    public function setClass($root, $class, $src, $ext) {
        $default    = [
            "instance"      => null,
            "file"          => null,
            "ext"           => null,
            "allow_list"    => [],
            "sub_modules"   => [],
        ];

        if (!isset($this->_classes[$root])) $this->_classes[$root] = [];
        if (!isset($this->_classes[$root][$class])) $this->_classes[$root][$class] = $default;
        $this->_classes[$root][$class]["allow_list"][] = $src;

        foreach ($this->_pathes[$root] as $path) {
            $dir_name  = $path. DS. $class;
            $file_name = $path. DS. "{$class}.{$ext}";
            if (file_exists($dir_name) and is_dir($dir_name) and empty($this->_classes[$root][$class]["sub_modules"])) {
                foreach (glob($dir_name. DS. "*") as $sub_file_name) {
                    $sub_file           = pathinfo($sub_file_name);
                    $sub_module         = $default;
                    $sub_module["file"] = $sub_file_name;
                    $sub_module["ext"]  = $sub_file["extension"];
                    unset($sub_module["allow_list"]);
                    unset($sub_module["sub_modules"]);

                    $this->_classes[$root][$class]["sub_modules"][$sub_file["filename"]] = $sub_module;
                    if ($sub_module["ext"] === "php") include_once $sub_module["file"];
                }
            }
            if (file_exists($file_name)) {
                $this->_classes[$root][$class]["file"]  = $file_name;
                $this->_classes[$root][$class]["ext"]   = $ext;
                if ($ext === "php") include_once $file_name;
                break;
            }
        }
    }

    public function srchClass($src) {
        $ret = [];
        foreach ($this->_classes as $root => $classes) {
            if (!empty($ret)) break;
            foreach ($classes as $class => $val) {
                $srch       = array_fill_keys(array_keys($val["sub_modules"]), "file");
                $sub_files  = array_search_key($srch, $val["sub_modules"]);
                if ($val["file"] === $src or array_search($src, $sub_files) !== false) {
                    $ret = [
                        "root"  => $root,
                        "class" => $class,
                    ];
                    break;
                }
            }
        }
        return $ret;
    }

    public function &getClass($name, $src) {
        $ret    = false;
        $name   = explode(".", $name);
        if (count($name) === 1) {
            $srch   = $this->srchClass($src);
            $root   = (empty($srch)) ? "" : $srch["root"];
            $class  = (empty($srch)) ? "" : $srch["class"];
            $sub    = $name[0];
            $name   = $name[0];
        } else if (count($name) === 2) {
            $root   = $name[0];
            $class  = $name[1];
            $name   = $name[1];
        }
        $flg    = isset($sub) ?
                  (isset($this->_classes[$root]) and isset($this->_classes[$root][$class]) and isset($this->_classes[$root][$class]["sub_modules"][$sub])) :
                  (isset($this->_classes[$root]) and isset($this->_classes[$root][$class]));

        if (!$flg and isset($sub)) {
            $uses   = $this->getUses($src, $root);
            foreach ($uses[$root] as $class => $attr) {
                if (isset($attr["sub_modules"][$name])) {
                    $flg    = true;
                    break;
                }
            }
        }

        if ($flg) {
            if (isset($sub)) {
                $class  =& $this->_classes[$root][$class]["sub_modules"][$sub];
                $flg    = ($class["file"] and $class["instance"] === null);
            } else {
                $class  =& $this->_classes[$root][$class];
                $flg    = (array_search($src, $class["allow_list"]) !== false and $class["file"] and $class["instance"] === null);
            }

            if ($flg) {
                switch ($class["ext"]) {
                case "php" :
                    $class["instance"] = $name::Get();
                    if (method_exists($class["instance"], "init")) $class["instance"]->init();
                    break;
                case "json" :
                    $class["instance"] = json_decode(file_get_contents($class["file"]), true);
                    break;
                }
            }
            $ret = $class["instance"];
        }
        return $ret;
    }

    public function getUses($src, $target = false) {
        $ret = [];

        foreach ($this->_classes as $key => $val) {
            if ($target and $target !== $key) continue;
            $srch       = array_fill_keys(array_keys($val), ["instance", "allow_list", "sub_modules"]);
            $allows     = array_search_key($srch, $val);
            $ret[$key]  = [];

            foreach ($allows as $class => $attr) {
                if (array_search($src, $attr["allow_list"]) !== false) $ret[$key][$class] = $attr;
            }
        }
        return $ret;

    }

    public function getParams() {
        return $this->_params;
    }

    public function getConfig($source = false) {
        $ret        = ["Configure" => $this->_configure, "Data" => $this->_data, "Routing" => $this->_routing];
        $sources    = ["Configure" => "_configure", "Data" => "_data", "Routing" => "_routing"];

        if ($source) $ret = $this->{$sources[$source]};

        return $ret;
    }
}
