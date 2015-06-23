<?php
class Maintenance extends View {

    public function ajaxPartsRender() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");

        $this->Viewer->view($parts["Parts"]["type"], $parts);
    }
}
