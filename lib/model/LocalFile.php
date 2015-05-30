<?php

class LocalFile extends Common {
    public  $source_type    = "File";

    private function _mkPath($path) {
        $ret    = false;
        $path   = str_replace("/", DS, $path);
        $path   = ROOT. DS. $this->_config["Path"]. DS. $path;
        if (file_exists($path) and is_file($path)) $ret = $path;

        return $ret;
    }
    private function _get($path) {
        return ($path = $this->_mkPath($path)) ? file_get_contents($path) : false;
    }

    private function _put($path, $data) {
        return (file_put_contents($path, $data) !== false);
    }

    private function _rm($path) {
        return ($path = $this->_mkPath($path)) ? unlink($path) : false;
    }

    public function find($path, $conditions = []) {
        return $this->_get($path);
    }

    public function save($path, $data, $conditions = []) {
        $saved_data = $this->_get($path);

        return $this->_put($path, $data);
    }

    public function delete($path, $data) {
        $saved_data = $this->_get($path);

        return $this->_put($path, $data);
    }

    public function setConfig($object) {
        $this->_config  = $object->config[$object->uses];
    }
}
