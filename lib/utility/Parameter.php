<?php

class Parameter extends Common {
    private $_config        = null;

    private function _init() {
        $this->_config  = Core::Get()->getConfig();
        $this->_params   = [
            "Host"      => $_SERVER["HTTP_HOST"],
            "UA"        => $_SERVER["HTTP_USER_AGENT"],
            "Name"      => $_SERVER["SERVER_NAME"],
            "Addr"      => $_SERVER["SERVER_ADDR"],
            "From"      => $_SERVER["REMOTE_ADDR"],
            "Scheme"    => $_SERVER["REQUEST_SCHEME"],
            "Method"    => $_SERVER["REQUEST_METHOD"],
            "Path"      => explode("/", (strlen($_SERVER["QUERY_STRING"])) ? substr(str_replace($_SERVER["QUERY_STRING"], "", $_SERVER["REQUEST_URI"]), 0, -1) : $_SERVER["REQUEST_URI"]),
            "Time"      => $_SERVER["REQUEST_TIME"],
            "SSL"       => (strpos($_SERVER["REQUEST_SCHEME"], "https") !== false),
            "Locale"    => $this->_config["Configure"]["Locale"],
        ];
        parse_str($_SERVER["QUERY_STRING"], $this->_params["Query"]);
        array_shift($this->_params["Path"]);
        $this->_params["User"] = $this->_getUser($this->_params["Path"][0]);

        Core::Get()->setPropaty(["params" => $this->_params]);
    }

    private function _getUser($user) {
        $ret    = SYS_USER;
        if ($this->_config["Configure"]["MultiUser"] and $user) {
            $ret = $user;
        }

        return $ret;
    }

    public function init() {
        if (empty($this->_params)) $this->_init();
    }
}
