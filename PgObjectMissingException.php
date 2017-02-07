<?php
class PgObjectMissingException extends RuntimeException{
	function __construct($type,$name){
		$this->message=ucfirst($type).' '.$name.' does not exist';
	}
}
