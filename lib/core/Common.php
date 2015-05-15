<?php

class Common {
    public      $allow_instance = false;
    private     $_exists        = false;
    protected   $_name          = null;
    protected   $_file          = null;
    protected   $_params        = [];

    private final function __construct() {
        $info           = new ReflectionClass($this);
        $name           = $info->name;
        $this->_name    = $name;
        $this->_file    = $info->getFileName();
        $this->_params  = Core::Get()->getParams();
    }

    public final function __get($name) {
        $this->{$name} =& Core::Get()->getClass($name, $this->_file);
        return $this->{$name};
    }

    public static final function Get() {
        $class      = get_called_class();
        $instance   = new $class;
        return $instance->chkInstance() ? $instance : false;
    }

    public final function chkInstance() {
        $name   = $this->_name;
        $ret    = ($this->allow_instance and !$this->_exists);
        if ($ret) $this->_exists = true;

        return $ret;
    }
}
