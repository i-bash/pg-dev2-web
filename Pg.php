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
	 * @param params - associative array of values for function parameters
	 * @return function value
	 */
	public function execFunction($name, $params){
		if(!$this->objectExists('function',$name)){
			throw new PgObjectMissingException('function',$name);
		};
		$this->sql=
			'select '.$name.' ('.
				PHP_EOL.chr(9).
				implode(','.PHP_EOL.chr(9),array_map(function($parName){return $parName.'=>:'.$parName;},array_keys($params))).
			PHP_EOL.') result'
		;
		$stmt=$this->connection->prepare($this->sql);
		$types=[
			'boolean'=>PDO::PARAM_BOOL,
			'integer'=>PDO::PARAM_INT,
			'string'=>PDO::PARAM_STR
		];
		foreach($params as $parName=>$parValue){
			$type=gettype($parValue);
			if(array_key_exists($type,$types)){
				$stmt->bindValue(':'.$parName,$parValue,$types[$type]);
			}
			else{
				throw new Exception('Unknown type of parameter value: '.$type);
			}
		}
		$stmt->execute();
		$res=$stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();
		return $res;
	}
	/**
	 * @param kind - table, view, function
	 * @param name - relation name
	 */
	private function objectExists($kind,$name){
		switch($kind){
			case 'function':
				$res=$this->query(
					"select pg_catalog.pg_function_is_visible(:name::regproc)",
					['name'=>$name]
				);
				return $res[0];
			case 'table':
			case 'view':
				$res=$this->query(
					"select pg_catalog.pg_table_is_visible(:name::regclass) ok",
					['name'=>$name]
				);
				return $res[0]->ok;
			default:
				throw new RuntimeException('Internal error. Unknown kind of database object: '.$kind);
		}
	}
}
