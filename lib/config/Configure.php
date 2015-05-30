<?php
App::Uses("Config", "Config");
App::Uses("Config", "Data");
App::Uses("Config", "Router");

class Configure extends Common {

    private $_init          = false;

    private function _chkConfig($config) {
        $ret1   = true;
        $ret2   = true;
        foreach ($config as $key => $val1) {
            if (!($ret1 and $ret2)) break;
            $keys1  = array_keys($this->Default[$key]);
            $keys2  = ($key === "Data") ? array_keys($this->Default["Data"]["Master"]) : null;

            if (!(array_intersect($keys1, (array_keys($val1))) === $keys1)) $ret1 = false;
            if (!$keys2) continue;
            foreach ($val1 as $val2) {
                if (!(array_intersect($keys2, (array_keys($val2))) === $keys2)) {
                    $ret2 = false;
                    break;
                }
            }
        }
        return ($ret1 and $ret2);
    }

    private function _init() {
        if (!$this->_init) {
            $this->_init = true;
            $Configure  = $this->Default["Configure"];
            $Data       = $this->Default["Data"];
            $Routing    = $this->Default["Routing"];
            if (isset($this->{"Config.Config"}->config))    $Configure  = array_merge($Configure,   $this->{"Config.Config"}->config);
            if (isset($this->{"Config.Data"}->config))      $Data       = array_merge($Data,        $this->{"Config.Data"}->config);
            if (isset($this->{"Config.Router"}->config))    $Routing    = array_merge($Routing,     $this->{"Config.Router"}->config);
 
            if ($this->_chkConfig(compact("Configure", "Data", "Routing"))) {
                Core::Get()->setPropaty(compact("Configure"));
                Core::Get()->setPropaty(compact("Data"));
                Core::Get()->setPropaty(compact("Routing"));
            }
        }
    }

    public function init() {
        $this->_init();
    }
}
