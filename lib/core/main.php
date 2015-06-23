<?php

final class Core {
    private static  $_this  = null;
    private $_classes       = [];
    private $_pathes        = [];
    private $_configure     = [];
    private $_data          = [];
    private $_routing       = [];
    private $_params        = [];
    private $_page          = [];
    private $_query         = [];
    private $_error         = [];
    private $_running       = null;

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
        App::Uses("Model",      "Master");
        App::Uses("View",       "View");

        $this->getClass("Utility.I18n",         __FILE__);
        $this->getClass("Config.ErrorHandler",  __FILE__);
        $this->getClass("View.View",            __FILE__);
    }

    public function flushPropaty($key) {
        $key    = "_". strtolower($key);

        if (is_array($this->{$key}))    $this->{$key}   = [];
        if (is_string($this->{$key}))   $this->{$key}   = "";
        if ($this->{$key} === false)    $this->{$key}   = false;
        if ($this->{$key} === null)     $this->{$key}   = null;
    }

    public function setPropaty($propaty, $append = false) {
        foreach ($propaty as $key => $val) {
            $key            = "_". strtolower($key);

            if (!isset($this->{$key})) continue;
            if ($append) {
                if (is_array($this->{$key}))    $this->{$key}[] = $val;
                if (is_string($this->{$key}))   $this->{$key}  .= "\\{$val}";
            } else {
                $this->{$key}   = $val;
            }
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
        foreach ($this->_classes as $root => $classes) {
            foreach ($classes as $class => $val) {
                $srch       = array_fill_keys(array_keys($val["sub_modules"]), "file");
                $sub_files  = array_search_key($srch, $val["sub_modules"]);

                if (isset($val["file"]) and $val["file"] === $src or array_search($src, $sub_files) !== false) {
                    return ["root"  => $root, "class" => $class];
                }
            }
        }
        return [];
    }

    public function classExists($name, $src) {
        $src    = $this->srchClass($src);

        if (!empty($src)) {
            $root   = $src["root"];
            $class  = $src["class"];

            $class  = ($class === $name) ? $this->_classes[$root][$class] : $this->_classes[$root][$class]["sub_modules"][$name];
        }

        return (isset($class) and ($class["instance"])) ? $class["instance"] : false;
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
        if (empty($this->_classes[$root]) or empty($this->_classes[$root][$class]) or (isset($sub) and empty($this->_classes[$root][$class]["sub_modules"][$name]))) {
            $uses   = $this->getUses($src, $root);
            if (isset($uses[$root])) {
                foreach ($uses[$root] as $key => $attr) {
                    if (isset($sub) and empty($attr["sub_modules"][$name])) continue;
                    $class = $key;
                    break;
                }
            }
        }

        if (isset($sub)) {
            $class_list =& $this->_classes[$root][$class]["sub_modules"][$sub];
            $flg        = ($class_list["file"] and $class_list["instance"] === null);
        } else {
            $class_list =& $this->_classes[$root][$class];
            $flg        = (array_search($src, $class_list["allow_list"]) !== false and $class_list["file"] and $class_list["instance"] === null);
        }

        if ($flg) {
            $this->_running = $name;
            switch ($class_list["ext"]) {
            case "php" :
                $class_list["instance"]  = $name::Get();
                if (method_exists($class_list["instance"], "init")) $class_list["instance"]->init();
                break;
            case "js" :
            case "css" :
                $class_list["instance"]  = file_get_contents($class_list["file"]);
                break;
            case "json" :
                $class_list["instance"]  = json_decode(file_get_contents($class_list["file"]), true);
                break;
            case "tpl" :
                $class_list["instance"]  = str_replace("\"", "\\\"", file_get_contents($class_list["file"]));
                break;
            }
        }

        $ret = $class_list["instance"];
        if (!$ret and isset($this->_classes[$root][$class]["allow_list"])) {
            foreach ($this->_classes[$root][$class]["allow_list"] as $allow) {
                if ($src === $allow or !($name))        continue;
                if (empty($sub))                        $name = "{$root}.{$name}";
                if (isset($class_list["allow_list"]))   $class_list["allow_list"][] = $src;
                if ($ret = $this->getClass($name, $allow)) break;
            }
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

    public function getView() {
        static $ret     = [];

        if (!$ret and !empty($this->_page)) {
            $path           = explode("/", $this->_page[0]["Page"]["path"]);
            $ret["Class"]   = ucfirst(array_shift($path));
            $ret["Action"]  = str_replace(" ", "", lcfirst(ucwords(strtr(array_shift($path), '_', ' '))));
            $ret["Args"]    = $path;
        }

        return $ret;
    }

    public function getParams() {
        static $skip    = false;
        $class          = "Parameter";

        if (!$skip and !$this->_params and $this->_running !== $class) {
            $skip   = true;
            $this->getClass("Utility.Parameter", __FILE__)->getParams();
        }

        return $this->_params;
    }

    public function getPage() {
        static $skip    = false;
        $class          = "Master";

        if (!$skip and !$this->_page and $this->_running !== $class) {
            $skip   = true;
            $this->getClass("Model.Master", __FILE__)->getPage();
        }
        return $this->_page;
    }

    public function getQuery() {
        return $this->_query;
    }

    public function getError() {
        return $this->_error;
    }

    public function getConfig($source = "") {
        static $skip    = false;
        $ret            = ["Configure" => $this->_configure, "Data" => $this->_data, "Routing" => $this->_routing];
        $class          = "Configure";

        if (!$skip and $this->_running !== $class) {
            $this->getClass("Config.Configure", __FILE__)->getConfig();
            $skip   = true;
        }

        foreach (explode(".", $source) as $key) {
            if (isset($ret[$key])) {
                $ret = $ret[$key];
                continue;
            }
            return false;
        }

        return $ret;
    }
}
