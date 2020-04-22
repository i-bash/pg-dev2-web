import {WsPg} from './wspg.js';

let log=(message,type)=>{
	$('<div/>',{class:type}).html(message).appendTo($('#log'));
}

let wspg = new WsPg('localhost:8080')
wspg.wserror=e=>{log('socket error','error');chkCmd()}
wspg.pgnotice=data=>log('notice: '+data)

$('button').click(
	e=>{
		switch(e.target.id){
		case 'ws-stop':
			wspg.wsstop().then(e=>{log('ws server stopped');chkCmd();})
		break;
		case 'ws-connect':
			wspg.wsconnect().then(e=>{log('connected to ws server');chkCmd();})
		break;
		case 'ws-disconnect':
			wspg.wsdisconnect().then(e=>{log('disconnected from ws server');chkCmd();})
		break
		case 'db-connect':
			wspg
			.pgconnect($('#connect-string').val())
			.then(e=>{log('connected to db '+$('#connect-string').val());chkCmd()})
			.catch(e=>{console.log(e);log('can\'t connect')})
		break
		case 'db-disconnect':
			wspg.pgdisconnect().then(e=>{log('disconnected from db');chkCmd()})
		break
		case 'db-exec':
			wspg.pgexec($('#sql').val())
			.then(
				data=>{
					log(data.command+' '+(data.rowCount==null?'':data.rowCount))
					for(const r of data.rows){log(JSON.stringify(r))}
				}
			)
			.catch(e=>{log(e.err)})
		break
		default:
			alert('unknown action: '+e.target.id)
			return undefined
		}
	}
);

let chkCmd=()=>{
	let isConnected=wspg.wsconnected();
	$('#connected').prop("checked",isConnected);
	$('#ws-stop').prop('disabled',!isConnected);
	$('#ws-connect').prop('disabled',isConnected);
	$('#ws-disconnect').prop('disabled',!isConnected);
	
	$('#db-connect').prop('disabled',!isConnected);
	$('#db-disconnect').prop('disabled',!isConnected);
	$('#db-exec').prop('disabled',!isConnected);
}

//handlers
$(window)
.off()
.on('load',chkCmd);
.on('unload',wspg.disconnect);

$('#sql').val(
`do $$
begin
	raise notice '%',pg_sleep(1)||'It is '||now()::text;
end;
$$`
)
