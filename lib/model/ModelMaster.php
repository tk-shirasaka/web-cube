<?php
App::Uses("Model", "Model");

class ModelMaster extends Model {
    public  $uses           = MST_DB;

    public function init() {
        parent::init();

        $tables     = $this->Source->show("Table");
        $table_key  = (empty($tables)) ? "" : array_keys($tables[0])[0];
        $tables     = array_search_key($table_key, $tables);

        foreach ($this->Schema as $table => $val) {
            if (empty($tables) or array_search($table, $tables) === false) {
                $this->putDefaultData($table);
            }
        }
        $this->page = $this->getPage();
    }

    public function putDefaultData($table) {
        $this->Source->create($table);
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
