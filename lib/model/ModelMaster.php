<?php
App::Uses("Model",      "Model");
App::Uses("Utility",    "I18n");

class ModelMaster extends Model {
    public  $uses           = MST_DB;

    public function init() {
        parent::init();

        $this->_putDefault();
        $this->page = $this->getPage();
    }

    private function _putDefault() {
        if (empty($this->Source->show("Table"))) {
            foreach ($this->Schema as $table => $val) {
                $this->Source->create($table);
                if (empty($this->Default[$table])) continue;
 
                foreach ($this->Default[$table] as $record) {
                    foreach ($record as $field => $val) {
                        $val = trim($val);
                        if (substr($val, 0,1) === "{" and substr($val, -1,1) === "}") {
                            $separator  = "::";
                            $val        = preg_replace("/\{(.*)\}/", "$1", $val);
                            if (defined($val)) $val = constant($val);
                        }
                        $record[$field] = $val;
                    }
                    $this->Source->save($table, $record);
                }
            }
        }
    }

    public function getPage($conditions = []) {
        $ret = [];

        if ($conditions) {
            $table  = isset($conditions["Table"]) ? $conditions["Table"] : [];
            $where  = isset($conditions["Where"]) ? $conditions["Where"] : [];
        } else if ($this->_params["Method"] === "POST" and isset($this->_params["Data"]["PageId"])) {
            $where  = ["id" => $this->_params["Data"]["PageId"]];
        } else {
            $where  = [
                "path"      => implode("/", $this->_params["Path"]),
                "user"      => $this->_params["User"],
                "parent"    => ["Relation" => "IS NOT", "Value" => "NULL"],
            ];
        }
        if (empty($table)) $table = ["Page", "Parts"];

        $ret = $this->Source->find($table, ["Where" => $where]);
        if (empty($ret) and $this->_params["User"] === SYS_USER) {
            $where["user"]  = "System";
            $ret            = $this->Source->find($table, ["Where" => $where]);
        }
        return $ret;
    }
}
