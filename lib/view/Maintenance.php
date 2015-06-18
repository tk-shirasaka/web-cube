<?php
class Maintenance extends View {

    public function ajaxPartsRender() {
        $this->auto_render  = false;
        $parts              = [
            "Parts" => $this->getParams("Request")
        ];
        $parts["id"]        = $parts["_id"];
        $parts["type"]      = "Block";

        $this->Viewer->view($parts["type"], $parts);
    }
}
