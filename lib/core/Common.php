<?php

abstract class Common {
    private     $_exists        = false;
    protected   $_name          = null;
    protected   $_file          = null;
    protected   $_sub_dir       = null;
    protected   $_page          = [];
    protected   $_params        = [];
    protected   $_view          = [];

    private final function __construct($info) {
        $name           = $info->name;
        $this->_name    = $name;
        $this->_file    = $info->getFileName();
        $this->_sub_dir = dirname($this->_file). DS. str_replace(".php", "", basename($this->_file));
        $this->_page    = Core::Get()->getPage();
        $this->_params  = Core::Get()->getParams();
        $this->_view    = Core::Get()->getView();
    }

    public final function __get($name) {
        $ret           =& Core::Get()->getClass($name, $this->_file);
        if ($ret) $this->{$name} =& $ret;
        return $ret;
    }

    public final function __call($method, $args) {
        $ret            = null;
        if (strpos($method, "get") === 0) {
            $name = strtolower(preg_replace("/[A-Z]/", "_\\0", substr($method, 3)));
            if (!isset($this->{$name})) continue;
            if (!is_array($args)) $args = [$args];
            $ret = $this->{$name};

            foreach ($args as $key) {
                $ret = (isset($ret[$key])) ? $ret[$key] : null;
                if ($ret === null) break;
            }
        }
        return $ret;
    }

    public static final function Get() {
        $ret        = true;
        $class      = get_called_class();
        $info       = new ReflectionClass($class);

        if (Core::Get()->classExists($info->name, $info->getFileName()))    $ret = false;
        if ($info->isAbstract())                                            $ret = false;
        if ($ret and $info->isInterface())                                  $ret = false;
        if ($ret) {
            $instance   = new $class($info);
            $ret        = $instance->chkInstance();
        }
        if ($ret) $ret = $instance;

        return $ret;
    }

    public final function chkInstance() {
        $ret    = (!$this->_exists);
        if ($ret) $this->_exists = true;

        return $ret;
    }
}
