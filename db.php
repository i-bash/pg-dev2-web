<?php
class pdoDbException extends PDOException {
	public function __construct(PDOException $e) {
		if(strstr($e->getMessage(), 'SQLSTATE[')) {
			preg_match('/SQLSTATE\[(\w+)\] \[(\w+)\] (.*)/', $e->getMessage(), $matches);
print_r($e->errorInfo);
print_r($matches);exit;
			$this->code = ($matches[1] == 'HT000' ? $matches[2] : $matches[1]);
			$this->message = $matches[3];
		}
	}
}

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
		try{
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
		catch(PDOException $e){
			throw new pdoDbException($e);
			echo('<br/>');
		}
	}
	/** execute stored function
	 * @param functionName
	 * @param params - 0-based array of values for function parameters
	 * @return function value
	 */
	function execFunction($functionName, $params){
		try{
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
		catch(PDOException $e){
			throw new pdoDbException($e);
			echo('<br/>');
		}
	}
}

