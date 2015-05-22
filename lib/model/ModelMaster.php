<?php
App::Uses("Model",      "Model");
App::Uses("Utility",    "I18n");

class ModelMaster extends Model {
    public  $uses           = MST_DB;

    public function init() {
        parent::init();

        if (empty($this->Source->show("Table"))) $this->_putDefault();
        $this->page = $this->getPage();
    }

    private function _putDefault($table) {
        foreach ($this->Schema as $table => $val) {
            $this->Source->create($table);
            if (empty($this->Default[$table])) continue;

            foreach ($this->Default[$table] as $record) {
                foreach ($record as $field => $val) {
                    $val = trim($val);
                    if ($val === "NULL") {
                    } else if (substr($val, 0,1) === "{" and substr($val, -1,1) === "}") {
                        $separator  = "::";
                        $val        = preg_replace("/\{(.*)\}/", "$1", $val);
                        $val        = explode($separator, $val);
                        if (count($val) === 1) {
                            $val    = constant($val[0]);
                        } else if (count($val) === 2) {
                            $val    = $val[0]::${$val[1]};
                        }
                    }
                }
            }
        }
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
