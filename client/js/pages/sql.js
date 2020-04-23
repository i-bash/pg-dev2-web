import {lib} from '../lib.js'
		
export default function(){
	let connectionId
	//event handlers
	$('#connect').off().click(
		e=>lib.pgConnect('postgres@'+$("#server option:selected").val()+'/bookstore2')
		.then(id=>{connectionId=id;$("#sql").focus})
	)
	$('#disconnect').off().click(
		e=>lib.pgDisconnect(connectionId)
	)
	$('#run').off().click(
		e=>{
			if(connectionId===undefined){
				lib.reportError('not connected')
				return
			}
			lib.pgExec(connectionId,$('textarea#sql').val()/*.split('\n\n')*/)
			.then(d=>d?lib.actionMessage('secondary',JSON.stringify(d)):undefined)
		}
	);
	//init
	$("textarea#sql").val(
`do $$
	begin
		perform pg_sleep(2);
		raise notice '%',clock_timestamp()::text;
		perform pg_sleep(2);
		raise notice '%',clock_timestamp()::text;
		perform pg_sleep(1);
	end;
$$`)
}
