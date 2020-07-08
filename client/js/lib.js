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
	
	/** get session info */
	static getSessionInfo(){
		return {
			authToken:sessionStorage.getItem('authToken'),
			userName:sessionStorage.getItem('userName')
		}
	}
	/** set session info */
	static setSessionInfo(authToken,userName){
		sessionStorage.setItem('authToken',authToken)
		sessionStorage.setItem('userName',userName)
	}
	/** remove session info */
	static resetSessionInfo(){
		sessionStorage.removeItem('authToken')
		sessionStorage.removeItem('userName')
	}

	/** messages in action pane
	 * - style - one of bootstrap alert styles
	 * - text - message text
	 * - additionalClasses - list of additional classes for alert div separated by space
	 */
	static actionMessage(style,text){
		let actionPane=$('#action')
		let scroller=actionPane.parent()
		actionPane
		.append(
			$(
				'<div/>',
				{class:'alert alert-'+style+' w-100 m-0 p-1 mb-1'}
			)
			.text(text)
		)
		scroller[0].scrollTo(
			{
				top:$(actionPane)[0].scrollHeight-scroller[0].clientHeight,
				behavior:'smooth'
			}
		)
		//.parent().scrollTop($(actionPane).prop('scrollHeight')-$(actionPane).parent().prop('clientHeight'))
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
	static reportConninfo(server,user,conninfo){
		lib.actionMessage(
			'light',
			user+'@'+server+' '+'(pid '+conninfo.pid+')'
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
	static pgExec(connectionId,sql,params=[],beSilent=false){
		let started=Date.now()
		return Promise.resolve(
			beSilent||
			lib.reportCommand(
				sql+(params&&params.length?'\n'+JSON.stringify(params):'')
			)
		)
		.then(()=>lib.wspg.pgexec(connectionId,sql,params))
		.then(
			res=>{
				beSilent||
				lib.reportSuccess(
					res.command===undefined
					?'ok'
					:res.command
						+(res.rowCount===null?'':' '+res.rowCount)
						+' '+res.time+'ms/'+(Date.now()-started)+'ms'
				)
				return res.rows;
			}
		)
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
	static doAction(action,params={},reportErrors=true){
		let time=Date.now()
		console.log('starting action '+action)
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
				//lib.reportSuccess('reusing connection "'+pgConn+'"')
			)
		)
		.then(()=>
			Promise.resolve(
				connectionId=lib.pgConnections[pgConn].id
			)
		)
		//get connection properties
		.then(
			d=>
			lib.pgExec(
				connectionId,
				`select pg_backend_pid() pid, set_config('application_name','dev2app',true)`,
				undefined,
				true
			)
			.then(res=>lib.reportConninfo(pgServer,pgUser,res[0]))
		)
		//tracing
		if(lib.tracing){
			connectPromise=connectPromise.then(
				d=>{
					switch(pgUser){
						case 'web':
							return lib.pgExec(
								connectionId,
								`select webapi.trace($1)`,
								[lib.getSessionInfo().authToken??null]
							)
						case 'emp':
							return lib.pgExec(
								connectionId,
								`select empapi.trace()`
							)
					}
				}
			)
		}
		
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
		.then(
			//finally return a promise resolved with the results
			d=>{
				console.log('completed action '+action+' in '+(Date.now()-time)+'ms');
				return Promise.resolve(results)
			},
			//or return rejected promise
			e=>{
				reportErrors&&lib.reportError(e)
				return Promise.reject(e)
			}
		)
		
	}

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
	 * each option is an array [value,text,data] (value and text are required)
	 * or just a plain text
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
					.then(()=>lib.doAction($(form).attr('action'),pars,false))
					.then(callbackAfter?(payload=>callbackAfter(payload,form)):Promise.resolve)
					.catch(lib.reportError)
			}
		)
		//lib.clearPanes();
	}
}
