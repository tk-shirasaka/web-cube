<?php

class Model extends Common {
    public  $allow_instance = true;
    public  $uses           = "Master";
    public  $config         = [];

    private final function _init() {
        $this->config   = Core::Get()->getConfig("Data");
        $uses           = $this->uses;
        $source         = $this->config[$uses]["Source"];

        if (__CLASS__ === $this->_name) {
            $this->{$uses}  = $this->{$source};
        } else {
            App::Uses("Model", "Model");
            $this->{$uses}  = clone $this->{"Model.Model"}->{$source};
        }

        if (isset($this->config[$uses])) {
            $this->{$uses}->setConfig($this->config[$uses]);
        }

        if ($this->{$source}->source_type === "Database" and !$this->{"Schema.{$uses}"}) file_put_contents($this->_sub_dir. DS. "Schema.{$uses}.json", json_encode($this->{$source}->getSchema()));;
    }

    public function init() {
        if (!$this->config) $this->_init();
    }
}
