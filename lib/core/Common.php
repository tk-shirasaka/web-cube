<?php

abstract class Common {
    private     $_exists        = false;
    protected   $_name          = null;
    protected   $_file          = null;
    protected   $_sub_dir       = null;
    protected   $_page          = [];
    protected   $_params        = [];

    private final function __construct($info) {
        $name           = $info->name;
        $this->_name    = $name;
        $this->_file    = $info->getFileName();
        $this->_sub_dir = dirname($this->_file). DS. str_replace(".php", "", basename($this->_file));
        $this->_page    = Core::Get()->getPage();
        $this->_params  = Core::Get()->getParams();
    }

    public final function __get($name) {
        $this->{$name} =& Core::Get()->getClass($name, $this->_file);
        return $this->{$name};
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
