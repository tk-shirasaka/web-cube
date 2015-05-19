<?php

class Model extends Common {
    public  $allow_instance = true;
    public  $uses           = MST_DB;
    public  $config         = [];
    public  $page           = [];

    private final function _init() {
        $this->config   = Core::Get()->getConfig("Data");
        $uses           = $this->uses;
        $source         = $this->config[$uses]["Source"];

        if (__CLASS__ === $this->_name) {
            $this->{$uses}  = $this->{$source};
        } else {
            App::Uses("Model", "Model");
            $this->{MST_DB}   = $this->{"Model.Model"}->{MST_DB};
            if ($uses !== MST_DB) $this->{$uses} = clone $this->{"Model.Model"}->{$source};
        }

        if (isset($this->config[$uses])) {
            $this->{$source}->setConfig($this);
        }

        if (__CLASS__ === $this->_name) $this->getParts();
    }

    public function init() {
        if (!$this->config) $this->_init();
    }

    public function getParts() {

        if ($this->_params["Method"] === "POST" and isset($this->_params["Data"]["PageId"])) {
            $where  = ["id" => $this->_params["Data"]["PageId"]];
        } else {
            $where  = [
                "path" => implode("/", $this->_params["Path"]),
                "user" => $this->_params["User"],
            ];
        }
        $this->page = $this->{MST_DB}->find(["Page", "Parts"], ["Where" => $where]);
    }
}
