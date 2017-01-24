<?php
class PG{
	public $sql;
	private $connection=null;
	
	/** create database connection
	 */
	function connect(){
		$role = $_SESSION['role']??'postgres';
		$this->connection = new PDO(DSN,$role,$role); //assume password is the same as role name
		$this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	}
	
	/** SQL select
	 * @param sql
	 * @param params - 0-based array of values for parameters
	 * @return function value
	 */
	function query($sql,$params=[]){
		$this->sql=$sql;
		$stmt=$this->connection->prepare($this->sql);
		foreach($params as $i=>$parValue){
			$stmt->bindValue($i+1,$parValue);
		}
		$stmt->execute();
		$res=$stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();
		return array_map(function($r){return (object)$r;},$res);
	}
	/** execute stored function
	 * @param functionName
	 * @param params - 0-based array of values for function parameters
	 * @return function value
	 */
	function execFunction($functionName, $params){
		$this->sql='select '.$functionName.'('.implode(',',array_fill(0,count($params),'?')).') result';
		$stmt=$this->connection->prepare($this->sql);
		foreach($params as $i=>$parValue){
			$stmt->bindValue($i+1,$parValue);
		}
		$stmt->execute();
		$res=$stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();
		return $res[0]['result'];
	}
}
