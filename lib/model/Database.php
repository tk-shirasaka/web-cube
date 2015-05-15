<?php

class Database extends Common {
    public  $allow_instance = true;
    public  $source_type    = "Database";
    public  $eoq            = "";
    public  $isUpdate       = false;
    private $_init          = false;
    private $_config        = null;

    private final function _init() {
        $this->_init    = true;
        $this->Format;
        $this->Format   = (is_array($this->Format)) ? array_merge($this->{"Model.Database"}->Format, $this->Format) : $this->{"Model.Database"}->Format;
    }

    public function close() {
        $this->connect->close();
        $this->isUpdate = false;
    }

    public function init() {
        if (__CLASS__ !== $this->_name and !$this->_init) $this->_init();
    }

    public function execute($query) {
        $this->connect();
//        $this->_execute($query);

        if ($this->isUpdate) $this->_commit();
        $this->close();
    }

    public function setConfig($config) {
        $this->_config  = $config;
    }

    public function getFormat($type, $uses = []) {
        $format = (isset($this->Format[$type]["SQL"]["Normal"])) ? $this->Format[$type]["SQL"]["Normal"] : "";
        foreach ($uses as $use) {
            if ($format) $format .= " ";
            $format .= (isset($this->Format[$type]["SQL"][$use])) ? $this->Format[$type]["SQL"][$use] : "";
        }

        return $format. $this->eoq;
    }

    public function getSchema() {
        $format     = $this->getFormat("Show", ["Column"]);
        $columns    = [];

        foreach ($this->getTables() as $table) {
            $query      = sprintf($format, $table);
            $columns[$table]  = $this->execute($query);
        }
    }

    public function putSchema($schema) {
    }

    public function getTables() {
        $format = $this->getFormat("Show", ["Table"]);
        $query  = sprintf($format, $this->_config["Database"]);

        return $this->execute($query);
    }
}
