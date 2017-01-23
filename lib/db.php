<?php
class PG{
	private $db = null;
	
	/** create database connection
	 */
	function __construct(){
		$this->db = new PDO(DSN);
	}
	
	/** execute stored function
	 * @param functionName
	 * @param params - 0-based array of values for function parameters
	 * @return function value
	 */
	function execFunction($functionName, $params){
		$sql='select '.$functionName.'('.implode(',',array_fill(0,count($params),'?')).') result';
		$stmt=$this->db->prepare($sql);
		foreach($params as $i=>$parValue){
			$stmt->bindValue($i+1,$parValue);
		}
		$stmt->execute($params);
		$res=$stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();
		return $res[0]['result'];
	}
}

