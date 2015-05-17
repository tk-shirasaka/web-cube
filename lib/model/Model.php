<?php

class Model extends Common {
    public  $allow_instance = true;
    public  $uses           = "Master";
    public  $config         = [];

    private final function _init() {
        $this->config   = Core::Get()->getConfig("Data");
        $source         = $this->config[$this->uses]["Source"];


        if (isset($this->config[$this->uses])) {
            $this->{$source}->setConfig($this->config[$this->uses]);
        }

        if ($this->{$source}->source_type === "Database" and !$this->{$this->uses}) file_put_contents($this->_sub_dir. DS. $this->uses. ".json", json_encode($this->{$source}->getSchema()));;
    }

    public function init() {
        if (!$this->config) $this->_init();
    }
}
