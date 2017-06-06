<?php
class Pg{
	public $sql=[];
	private $connection=null;
	
	/** create database connection
	 */
	public function connect($role='postgres'){
		$connectParams=DATA_SOURCE;
		$connectParams['user']=$role;
		$connectParams['password']=$role; //assume password to be the same as user name
		$connectString=implode(
			' ',
			array_map(
				function($key,$value){
					return $key.'=\''.addslashes($value).'\'';
				},
				array_keys($connectParams),
				$connectParams
			)
		);
		$this->connection = pg_connect($connectString);
	}
	/** close database connection
	 */
	public function close(){
		if($this->connection){
			pg_close($this->connection);
		}
	}
	
	/** SQL select
	 * @param sql
	 * @param params - integer-indexed array of values for parameters
	 * @return function value
	 */
	public function query($sql,$params=[],$displaySql=true){
		if($displaySql){
			$this->sql[]=$sql;
		}
		pg_send_query_params(
			$this->connection,
			$sql,
			array_map(
				function($v){
					switch(gettype($v)){
						case 'boolean':
							return $v?'true':'false';
						default:
							return $v;
					}
				},
				$params
			)
		);
		$result=pg_get_result($this->connection);
		if($notice=pg_last_notice($this->connection)){
			$this->notice=$notice;
		}
		if(pg_result_error($result)===''){
			$rows=pg_fetch_all($result);
			if($rows===false){
				$res=[];
			}
			else{
				$res=array_map(function($r){return (object)$r;},(array)$rows);
			}
			pg_free_result($result);
			return $res;
		}
		else{
			$error=(object)[];
			foreach(
				[
					'severity'=>PGSQL_DIAG_SEVERITY,
					'code'=>PGSQL_DIAG_SQLSTATE,
					'message'=>PGSQL_DIAG_MESSAGE_PRIMARY,
					'detail'=>PGSQL_DIAG_MESSAGE_DETAIL, 
					'hint'=>PGSQL_DIAG_MESSAGE_HINT,
					'position'=>PGSQL_DIAG_STATEMENT_POSITION
				]
				as $fld=>$num
			){
				$error->{$fld}=pg_result_error_field($result,$num);
			}
			pg_free_result($result);
			throw new PgException($error);
		}
	}
	/** execute stored function
	 * @param name
	 * @param params - associative array of values for function parameters
	 * @return function value
	 */
	public function execFunction($name, $params=[]){
		//$this->checkFunctionExistence($name);
		$sql=
			'select '.$name.'('.
				(
					count($params)?
						PHP_EOL.chr(9).
						implode(','.PHP_EOL.chr(9),array_map(function($parName,$parNum){return $parName.'=>$'.($parNum+1);},array_keys($params),array_keys(array_keys($params)))).
						PHP_EOL
					:''
				).
			') result'
		;
		return $this->query($sql,array_values($params),true);
	}
	/**
	 * @param name - relation name
	 */
	public function checkRelationExistence($name){
		try{
			$res=$this->query(
				"select pg_catalog.pg_table_is_visible($1::regclass) ok",
				[$name],
				false
			);
			return $res[0]->ok=='t';
		}
		catch(PgException $e){
			throw new PgObjectMissingException('relation',$name);
		}
	}
	/**
	 * @param name - function name
	 */
	public function checkFunctionExistence($name){
		try{
			$res=$this->query(
				"select pg_catalog.pg_function_is_visible($1::regproc) ok",
				[$name],
				false
			);
			return $res[0]->ok=='t';
		}
		catch(PgException $e){
			throw new PgObjectMissingException('function',$name);
		}
	}
}
