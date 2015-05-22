<?php

class Model extends Common {
    public  $allow_instance = true;
    public  $uses           = null;
    public  $config         = [];
    public  $page           = [];

    private final function _init() {
        if (!$this->config and __CLASS__ !== $this->_name) {
            $config         = Core::Get()->getConfig("Data");
            if (isset($config[$this->uses])) {
                $uses           = App::GetUses($this->_file, "Model");
                $this->config   = $config[$this->uses];
                $source         = $this->config["Source"];

                foreach ($uses["Model"] as $use_model) {
                    if (!$this->{$use_model}->{$source}) continue;
                    $this->Source = clone $this->{$use_model}->{$source};
                    $this->Source->setConfig($this);
                }
            }
        }
    }

    public function init() {
        $this->_init();
    }
}
