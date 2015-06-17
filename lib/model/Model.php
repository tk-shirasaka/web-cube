<?php

class Model extends Common {
    public  $uses           = null;
    public  $config         = [];
    public  $page           = [];

    private final function _init() {
        if (!$this->config and __CLASS__ !== $this->getName()) {
            $config         = Core::Get()->getConfig("Data");
            if (isset($config[$this->uses])) {
                $uses           = App::GetUses($this->getFile(), "Model");
                $this->config   = $config[$this->uses];
                $source         = $this->config["Source"];
                if ($this->{$source}) {
                    $this->Source   = clone $this->{$source};
                    $this->Source->setConfig($this);
                }
            }
        }
    }

    public function init() {
        $this->_init();
    }
}
