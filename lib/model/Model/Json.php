<?php
App::Uses("Model", "LocalFile");

class Json extends LocalFile {
    public  $allow_instance = true;

    private function _search($data, $conditions) {
        $ret    = ($conditions) ? [] : $data;
        foreach ($conditions as $key => $val) {
            if (empty($data[$key])) continue;
            if (is_array($val)) {
                $val = $this->_search($data[$key], $val);
                if ($val) $ret[$key] = $val;
            } else if (isset($data[$key][$val])) {
                $ret[$key] = $data[$key][$val];
            }
        }

        return $ret;
    }

    public function find($path, $conditions = []) {
        $ret    = parent::find($path, $conditions);
        if ($ret) $ret = json_decode($ret, true);
        if ($ret) $ret = $this->_search($ret, $conditions);

        return $ret;
    }

    public function save($path, $data, $conditions = []) {
    }

    public function delete($path, $data) {
    }
}
