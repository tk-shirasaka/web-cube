<?php

class ErrorHandler extends Common {
    private $_debug_level   = null;

    private function _init() {
        if (!$this->_debug_level) {
            $this->_debug_level = Core::Get()->getConfig("Configure.Debug");
            set_error_handler([$this, "Error"]);
        }
    }

    private function _getMessage($debug, $message, $src, $line, $context) {
        $error  = $this->Error["level"][$debug];
        $date   = date(I18n::$TIME_FORMAT);
        $serial = serialize($context);
        Core::Get()->setPropaty(["error" => ["Level" => $error, "Place" => "{$src} : {$line}", "Message" => $message, "Context" => $serial]], true);
        return sprintf($this->Error["format"], $date, $error, $src, $line, $message, $serial);
    }

    private function _putMessage($message) {
    }

    public function init() {
        $this->_init();
    }

    public function Error($e_no, $e_str, $e_file, $e_line, $e_context) {
        switch ($e_no) {
        case E_ERROR        :
        case E_USER_ERROR   :
            $debug = 1;
            break;
        case E_WARNING      :
        case E_USER_WARNING :
            $debug = 2;
            break;
        case E_NOTICE       :
        case E_USER_NOTICE  :
            $debug = 3;
            break;
        default             :
            $debug = 4;
            break;
        }
        if ($debug <= $this->_debug_level) {
            $message = $this->_getMessage($debug, $e_str, $e_file, $e_line, $e_context);
            $this->_putMessage($message);
        }
    }
}
