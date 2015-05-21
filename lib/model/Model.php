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

        if (isset($this->config[$uses])) {
            $this->{$source}->setConfig($this);
        }

        if (__CLASS__ === $this->_name) {
            $this->{$uses}  = $this->{$source};

            $tables     = $this->{$source}->show("Table");
            $table_key  = (empty($tables)) ? "" : array_keys($tables[0])[0];
            $tables     = array_search_key($table_key, $tables);

            foreach ($this->{"Schema\\Master"} as $table => $val) {
                if (empty($tables) or array_search($table, $tables) === false) {
                    $this->putDefaultData($table);
                }
            }
        } else {
            App::Uses("Model", "Model");
            $this->{MST_DB}   = $this->{"Model.Model"}->{MST_DB};
            if ($uses !== MST_DB) $this->{$uses} = clone $this->{"Model.Model"}->{$source};
        }

        if (__CLASS__ === $this->_name) $this->page = $this->getPage();
    }

    public function init() {
        if (!$this->config) $this->_init();
    }

    public function putDefaultData($table) {
        $this->Master->create($table);
    }

    public function getPage($conditions = []) {
        if ($conditions) {
            $table  = isset($conditions["Table"]) ? $conditions["Table"] : [];
            $where  = isset($conditions["Where"]) ? $conditions["Where"] : [];
        } else if ($this->_params["Method"] === "POST" and isset($this->_params["Data"]["PageId"])) {
            $where  = ["id" => $this->_params["Data"]["PageId"]];
        } else {
            $where  = [
                "path" => implode("/", $this->_params["Path"]),
                "user" => $this->_params["User"],
            ];
        }
        if (empty($table)) $table = ["Page", "Parts", "PartsType"];

        return $this->{MST_DB}->find($table, ["Where" => $where]);
    }
}
