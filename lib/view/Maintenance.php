<?php
class Maintenance extends View {

    public function ajaxPartsRender() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");

        $this->Viewer->view($parts["Parts"]["type"], $parts);
    }

    public function ajaxPageRender() {
        $this->auto_render  = false;
        $page               = $this->getParams("Request");
        $page               = $this->{"Model.Master"}->getPage(["Where" => $page]);

        echo json_encode($page);
    }
}
