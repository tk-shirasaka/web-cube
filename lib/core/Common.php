<?php

abstract class Common {
    private     $_exists        = false;
    private     $_name          = null;
    private     $_file          = null;
    private     $_sub_dir       = null;
    private     $_page          = [];
    private     $_params        = [];
    private     $_view          = [];

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
        $ret    = null;
        $args   = implode(".", $args);
        $name   = strtolower(preg_replace("/[A-Z]/", "_\\0", substr($method, 3)));

        if (strpos($method, "get") === 0) {
            if (empty($this->{$name}))  return null;
            if (!$args)                 return $this->{$name};

            $ret = $this->{$name};
            foreach (explode(".", $args) as $key) {
                if (empty($ret[$key]))  return null;
                $ret = $ret[$key];
            }
        }
        return $ret;
    }

    public static final function Get() {
        $class      = get_called_class();
        $info       = new ReflectionClass($class);

        if (Core::Get()->classExists($info->name, $info->getFileName()))    return false;
        if ($info->isAbstract() or $info->isInterface())                    return false;

        $instance   = new $class($info);
        if ($instance->chkInstance()) return $instance;

        return false;
    }

    public final function chkInstance() {
        $ret    = (!$this->_exists);
        if ($ret) $this->_exists = true;

        return $ret;
    }
}
