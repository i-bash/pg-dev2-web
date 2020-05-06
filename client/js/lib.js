import WsPg from './wspg-client.js';
import actions from './actions.js'

export class lib{
	static wspg
	static pgConnections=[]
	static tracing=false

	static die=lastWord=>{throw lastWord}
	static log=(message,type)=>{
		$('<div/>',{class:'alert alert-light w-100 m-0 p-0'}).html(JSON.stringify(message)).appendTo($('#action'))
	}
	/**
	 * app init
	 */
	static initConnection(hostPort,onclose){
		//connect to websocket server
		lib.wspg = new WsPg(hostPort,onclose)
		lib.wspg.pgnotice=lib.reportNotice
		return lib.wspg.wsconnect()
	}
	/**
	 * is client still connected to the server?
	 */
	static isConnected(){return lib.wspg.wsconnected()}
	
	/** messages in action pane
	 * - style - one of bootstrap alert styles
	 * - text - message text
	 * - additionalClasses - list of additional classes for alert div separated by space
	 */
	static actionMessage(style,text){
		let actionPane=$('#action')
		actionPane
		.append(
			$(
				'<p/>',
				{class:'alert alert-'+style+' w-100 m-0 p-1 mb-1'}
			)
			.html(text)
		)
		//.parent().animate({scrollTop:$(actionPane)[0].scrollHeight},'1')
	}
	static reportError(e){
		let message=
			e&&e.err&&e.err.message&&typeof(e.err.message)=='string'?e.err.message
			:e&&e.err&&typeof(e.err)=='string'?e.err
			:typeof(e)=='string'?e:'internal application error'
			lib.actionMessage(
				'danger',message//.replace(/\n\s*\^/,'').replace(/\n/g,'<br/>')
			)
			console.error(e)
	}
	static reportCommand(text){
		lib.actionMessage('primary',text);
	}
	static reportSuccess(text){
		lib.actionMessage('success',text);
	}
	static reportNotice(text){
		lib.actionMessage('warning','notice: '+text);
	}
	static reportApp(text){
		lib.actionMessage('secondary',text);
	}
	static reportConninfo(conninfo){
		lib.actionMessage(
			'light',
			conninfo.user+'@'+conninfo.host+':'+conninfo.port+' '+'('+conninfo.pid+')'
		)
	}

	/** connect to db
	 * returns connection id
	 */
	static pgConnect(connectString){
		return lib.wspg.pgconnect('postgresql://'+connectString)
		.then(
			d=>{
				lib.reportSuccess('connected to '+connectString)
				return Promise.resolve(d)
			}
		)
		.catch(e=>{lib.reportError(e);return Promise.reject(e)})
	}
	static pgDisconnect(connectionId){
		return lib.wspg.pgdisconnect()
		.then(d=>lib.reportSuccess('disconnected'))
		.catch(e=>{lib.reportError(e);return Promise.reject(e)})
	}
	static pgExec(connectionId,sql,params){
		return Promise.resolve(lib.reportCommand(sql))
		.then(()=>lib.wspg.pgexec(connectionId,sql,params))
		.then(
			res=>{
				lib.reportSuccess(res.command===undefined?'ok':res.command+(res.rowCount===null?'':' '+res.rowCount));
				return res.rows;
			}
		)
		.catch(e=>{lib.reportError(e);return Promise.reject(e)})
	}

	/**server action
	 * @param action - name of server action
	 * 		action properties:
	 * 			type - sql or function
	 * 			text - sql command or function name
	 * @param params - parameters, must an object for function and array for sql
	 * @param callback - function(data)
	 * @return promise
	 */
	static doAction(action,params={}){
		//check action for existence
		if(!actions[action]){
			console.error('Unknown action: '+action);
			return Promise.reject('internal application error');
		}
		const pgConn=actions[action].conn
		const pgServer=$("#server option:selected").val()
		const pgUser=actions[action].conn??'postgres';
		const connectString=pgUser+':'+pgUser+'@'+pgServer+'/'+'bookstore2'
		let connectionId
		//$('#loader').removeClass('invisible').addClass('visible');
		let results=[] //array the promise will be resolved with
		
		let connectPromise=(
			//if connected to nothing or other host:port
			(
				lib.pgConnections[pgConn]===undefined
				||
				lib.pgConnections[pgConn].server!=pgServer
			)
			//reconnect
			?lib
			.pgConnect(connectString)
			.then(cid=>
				Promise.resolve(lib.pgConnections[pgConn]={id:cid,server:pgServer})
			)
			//reuse connection
			:Promise.resolve(
				lib.reportSuccess('reusing connection "'+pgConn+'"')
			)
		)
		.then(()=>
			Promise.resolve(
				connectionId=lib.pgConnections[pgConn].id
			)
		)
		//get connection properties and turn on tracing
		.then(
			d=>
			lib.pgExec(
				connectionId,
				'select pg_backend_pid() pid, user, inet_server_addr() host, inet_server_port() port, current_database() dbname'
				+(lib.tracing?', trace()':'')
			)
			.then(res=>lib.reportConninfo(res[0]))
		)
		
		//commands
		let commands=
		actions[action].commands
		.map(
			cmd=>{
				let sql,pars
				switch(cmd.type){
				case 'sql':
					sql=cmd.text
					pars=params
				break;
				case 'function':
					sql='select to_json(f.*) from '+cmd.text+' ('+
					Object.keys(params).map((key,ind)=>key+'=>$'+(ind+1)).join(',')
					+') f'
					pars=Object.values(params)
				break;
				default:
					return d=>Promise.reject('invalid command type: '+cmd.type)
				}
				return d=>lib
				.pgExec(connectionId,sql,pars)
				.then(res=>Promise.resolve(res.map(r=>r.to_json)))
			}
		)
		
		return commands.reduce(
			(prev,cur)=>
			//promise to run command and push its result to results array
			prev.then(cur).then(
				res=>
				res===undefined||results.push(res)
			),
			connectPromise //promise to connect at the beginning
		)
		.then(d=>Promise.resolve(results))//finally return a promise resolved with the results
	}

/*
			()=>$.ajax({
				method:'post',
				url:'server.php?'+$.param(
					{
						connectString:Object.entries(connectData).map(entry=>entry[0]+'='+entry[1]).join(' '),
						action:action,
						trace:$('#trace').prop('checked')
					}
				),
				data:params,
				success:res=>{
					if(res.conninfo){
						$('<div/>',{class:'alert alert-light w-100 m-0 p-0'})
						.html(res.conninfo.user+'@'+res.conninfo.host+':'+res.conninfo.port+' ('+res.conninfo.pid+')')
						.appendTo(actionPane)
						;
					}
					if(res.sql&&res.sql.length){
						let sqlText=res.sql.map(
							s=>{
								return s.trimLeft().replace(/\n/g,'<br/>').replace(/\t/g,'&nbsp;&nbsp;&nbsp;').replace(/\s/g,' ');
							}
						)//.reverse()
						.join(lib.separator);
						$('<div/>',{class:'sql alert alert-info w-100 m-0 p-2'}).html(sqlText).appendTo(actionPane);
					}
					if(res.notices){
						res.notices.forEach(
							notice=>{
								$('<p/>',{class:'alert alert-warning w-100 m-0 p-2'}).html(notice).appendTo(actionPane);
							}
						);
					}
					//res.info.forEach(
					//	info=>{
					//		$('<p/>',{class:'alert alert-success w-100'}).html(info).appendTo(actionPane);
					//	}
					//);
					if(res.err===null){
						if(callback!==undefined){
							callback(res.data,callbackData);
						}
					}
					else{
						$('<p/>',{class:'alert alert-danger w-100 m-0 p-2'}).html(res.err.message.replace(/\n\s*\^/,'').replace(/\n/g,'<br/>')).appendTo(actionPane);
					}
				},
				error:e=>{
					alert('Unexpected server error');
					console.error(e);
				},
				complete:()=>{
					$('#loader').addClass('invisible').removeClass('visible');
					$(actionPane).parent().animate({scrollTop:$(actionPane)[0].scrollHeight});
					Dev2App.chkCmd();
				}
			})
		);
*/
	/**
	 * clear contents of sql, success, error, notice panels
	 */
	static clearPanes(){
		$('#action').empty();
		$('#conninfo').empty();
	}
	/**
	 * display app page
	 */
	static displayPage(page){
		//lib.clearPanes();
		return	$.ajax('pages/'+page+'.html',{dataType:'html'})
		.then(
			html=>{
				$('#page').hide().html(html).fadeIn().removeClass().addClass(page)
				return (async ()=>{
					(await import('./pages/'+page+'.js')).default()
				})()
			}
			,
			()=>{$('#page').html('Page "'+page+'" not found');}
		)
	}
	/**
	 * clear app page pane
	 */
	static clearPage(page){
		lib.clearPanes()
		$('#page').empty()
	}
	/**populate select from array of options
	 */
	static populateSelect(selector,options){
		let dropdown = $(selector)
		options.forEach(
			option=>{
				let element=$("<option />")
				.val(Array.isArray(option)?option[0]:option)
				.text(Array.isArray(option)?option[1]:option)
				if(Array.isArray(option)&&option[2]!==undefined){
					element.data(option[2])
				}
				dropdown.append(element)
			}
		)
	}
	//populate select from data - use as callback
	static populateSelectFromData(selector){
		return rows=>lib.populateSelect($(selector),rows.map(Object.values))
	}
	/** have form(s) perform action on submit
	 * callbackAfter(payload,form) returns Promise
	 * callbackBefore returns Promise
	 */
	static rpcForm(selector,callbackAfter,callbackBefore){
		$(document).off('submit',selector);
		$(document).on(
			'submit',
			selector,
			function(e){
				e.preventDefault();
				const form=this;
				const pars=Object.fromEntries(
					$(form)
					.serializeArray()
					.map(nv=>[nv.name,nv.value])
				)
				return (callbackBefore?callbackBefore():Promise.resolve())
					.then(()=>lib.doAction($(form).attr('action'),pars))
					.then(callbackAfter?(payload=>callbackAfter(payload,form)):Promise.resolve)
					.catch(lib.reportError)
			}
		)
		//lib.clearPanes();
	}
}
