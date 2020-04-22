<?php
class Pg{
	public $sql=[];
	private $connection=null;
	public $info;
	public $notices=[];
	
	/** open database connection
	 */
	public function connect($connectString){
		$this->connection=pg_connect($connectString);
	}
	/** is it connected?
	 */
	public function isConnected(){
		return $this->connection!==null;
	}
	
	/** close database connection
	 */
	public function close(){
		pg_close($this->connection);
	}
	/** begin transaction
	 */
	public function begin(){
		//$this->query('begin');
		$this->info=(object)[
			'host'=>pg_host(),
			'port'=>pg_port(),
			'user'=>pg_version()['session_authorization'],
			'dbname'=>pg_dbname(),
			'pid'=>$this->execFunction('pg_backend_pid',[],false)->rows[0]->pg_backend_pid//.'/'.pg_get_pid($this->connection)
		];

	}
	/** begin transaction
	 */
	public function end(){
		//$this->query('end');
	}
	/** SQL select
	 * @param sql
	 * @param params - integer-indexed array of values for parameters
	 * @return function value
	 */
	public function query($sql,$params=[],$displaySql=true){
		//if($displaySql){
			$this->sql[]=$sql;
		//}
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
		if($notices=pg_last_notice($this->connection,PGSQL_NOTICE_ALL)){
			$this->notices=array_merge($this->notices,$notices);
		}
		if(pg_result_error($result)===''){
			$cols=array_map(
				function($r) use($result){return pg_field_name($result,$r);},
				pg_num_fields($result)?range(0,pg_num_fields($result)-1):[]
			);
			$rows=pg_fetch_all($result);
			if(pg_num_rows($result)===0){
				$rows=[];
			}
			else{
				$rows=array_map(function($r){return (object)$r;},(array)$rows);
			}
			pg_free_result($result);
			return (object)['columns'=>$cols,'rows'=>$rows];
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
					'position'=>PGSQL_DIAG_STATEMENT_POSITION,
					'function'=>PGSQL_DIAG_SOURCE_FUNCTION
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
	public function execFunction($name, $params=[],$displaySql=true){
		$sql=
			'select * from '.$name.' ('.
				(
					count($params)?
						PHP_EOL.chr(9).
						implode(','.PHP_EOL.chr(9),array_map(function($parName,$parNum){return $parName.'=>$'.($parNum+1);},array_keys($params),array_keys(array_keys($params)))).
						PHP_EOL
					:''
				).
			')'
		;
		return $this->query($sql,array_values($params),$displaySql);
	}
	public function execFunctionJson($name, $params=[]){
		$sql=
			'select to_json(f.*) from '.$name.' ('.
				(
					count($params)?
						' '.
						implode(', ',array_map(function($parName,$parNum){return $parName.'=>$'.($parNum+1);},array_keys($params),array_keys(array_keys($params)))).
						' '
					:''
				).
			') f'
		;
		$result=$this->query($sql,array_values($params),true);
		
		$result->rows=array_map(
			function($r){
				return json_decode($r->to_json);
			},
			$result->rows
		);
		return $result;
	}
}
