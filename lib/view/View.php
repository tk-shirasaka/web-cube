<?php
class View extends Common {
    protected   $type   = "Html";

    public function init() {
        $this->{$this->type}->view();
    }
}
