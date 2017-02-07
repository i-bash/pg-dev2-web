<?php
class Pg{
	public $sql;
	private $connection=null;
	
	/** create database connection
	 */
	public function connect($role=null){
		$this->connection = new PDO(DSN,$role,$role); //assume password is the same as role name
		$this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	}
	
	/** SQL select
	 * @param sql
	 * @param params - associative array of values for parameters
	 * @param $checkKind - type of relation to check for existence (table, view, function)
	 * @param $checkName - name of relation to check for existence
	 * @return function value
	 */
	public function query($sql,$params=[],$checkKind=null,$checkName=null){
		if($checkKind && $checkName){
			if(!$this->objectExists($checkKind,$checkName)){
				throw new PgObjectMissingException($checkKind,$checkName);
			}
		}
		$this->sql=$sql;
		$stmt=$this->connection->prepare($this->sql);
		//foreach($params as $i=>$parValue){
		//	$stmt->bindValue($i+1,$parValue);
		//}
		$pars=array_combine(
			array_map(
				function($v){return ':'.$v;},
				array_keys($params)
			),
			array_values($params)
		);
		$stmt->execute($pars);
		$res=$stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();
		return array_map(function($r){return (object)$r;},$res);
	}
	/** execute stored function
	 * @param name
	 * @param params - 0-based array of values for function parameters
	 * @return function value
	 */
	public function execFunction($name, $params){
		if(!$this->objectExists('function',$name)){
			throw new PgObjectMissingException('function',$name);
		};
		$this->sql='select '.$name.'('.implode(',',array_fill(0,count($params),'?')).') result';
		$stmt=$this->connection->prepare($this->sql);
		foreach($params as $i=>$parValue){
			$stmt->bindValue($i+1,$parValue);
		}
		$stmt->execute();
		$res=$stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();
		return $res[0]['result'];
	}
	/**
	 * @param kind - table, view, function
	 * @param name - relation name
	 */
	private function objectExists($kind,$name){
		switch($kind){
			case 'function':
				$res=$this->query(
					"
						select oid
						from pg_catalog.pg_proc
						where proname=:name
							and pg_catalog.pg_function_is_visible(oid)
					",
					['name'=>$name]
				);
				return count($res)>0;
			case 'table':
			case 'view':
				$res=$this->query(
					"
						select oid
						from pg_catalog.pg_class
						where relname=:name
							and relkind=:kind
							and pg_catalog.pg_table_is_visible(oid)
					",
					['name'=>$name,'kind'=>substr($kind,0,1)]
				);
				return count($res)>0;
			default:
				throw new RuntimeException('Internal error. Unknown kind of database object: '.$kind);
		}
	}
}
