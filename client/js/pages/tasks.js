import {lib} from '../lib.js'
import {Dev2App} from '../dev2app.js'

export default function(){
	//populate programs drop-down
	let populateServers=()=>lib.populateSelect(
		'#remote',
		Dev2App.config.pgServers.map(s=>[s.host+':'+s.port,s.description+' ('+s.port+')'])
	)
	let displayDateTime=ts=>{
		if(ts===null) return ''
		let d=new Date(ts)
		return d.toLocaleString(window.navigator.language)
		//return (Date.now()-d)<86400000?d.toLocaleTimeString(window.navigator.language):d.toLocaleDateString(window.navigator.language)
	}
	let populatePrograms=()=>
	lib
	.doAction('emp/getPrograms')
	.then(res=>lib.populateSelectFromData('#programs')(res[0]))
	.then(()=>$('#remote').triggerHandler('change'))
	let populateTasks=()=>
	//display tasks
	lib
	.doAction('emp/getTasks')
	.then(
		res=>{
			const rows=res[0]
			lib.reportApp(rows.length==0?'Задания не найдены':'Найдено заданий: '+rows.length);
			$('#headers').toggle(rows.length>0);
			let list=$('#tasks');
			list.children('div:not(:first-child)').remove();
			rows.forEach(
				r=>{
					$('<div/>',{class:'row pt-1 pb-1'})
					.append($('<span/>',{class:'col-1 my-auto'}).html(r.task_id))
					.append($('<span/>',{class:'col-3 my-auto'}).html(r.name))
					.append($('<span/>',{class:'col-2 my-auto'}).html(displayDateTime(r.started)))
					.append($('<span/>',{class:'col-2 my-auto'}).html(displayDateTime(r.finished)))
					.append($('<span/>',{class:'col-2 my-auto'}).html(r.status))
					.append(
						$('<span/>',{class:'col-2 text-right pr-0 my-auto'}).html(
							$(
								'<button/>',
								{
									class:'btn btn-secondary btn-sm show-results',
									'data-id':r.task_id,
									'data-toggle':'modal',
									'data-target':'#results'
								}
							)
							.html('Результаты')
							.prop('disabled',!(['finished','error'].includes(r.status)))
						)
					)
					.appendTo(list)
				}
			)
		}
	)
	$('#run-task').submit(
		e=>{
			e.preventDefault()
			//parse json
			let json=$('#params').val()
			try{
				json=json===''?null:JSON.parse(json)
			}
			catch(err){
				lib.reportError('error parsing parameters:\n'+err.message)
				return Promise.reject(err)
			}
			//host&port
			let hpArray
			if($('#remote').prop('disabled')){
				hpArray=[null,null]
			}
			else{
				hpArray=$('#remote').val().split(':')
			}
			//function parameters
			const pars={
				program_id:Number($('#programs').val()),
				params:json,
				host:hpArray[0],
				port:hpArray[1]
			}
			//call action
			return lib.doAction($(e.target).attr('action'),pars,false)
			.then(
				data=>{
					populateTasks()
					lib.reportApp('scheduled task #'+data[0][0])
				}
			)
			.catch(lib.reportError)
		}
	)
	//refresh
	$('#refresh').off().click(populateTasks)
	//show task results
	$('#tasks').off().on(
		'click',
		'.show-results',
		e=>{
			lib.doAction('emp/taskResults',{task_id:$(e.currentTarget).data('id')})
			.then(res=>$('#results-text').html(res[0]))
		}
	)
	//local/remote switch
	$('[name="local-remote"]').click(
		e=>{
			let isRemote=$('#is_remote').prop('checked')
			$('#remote').prop('disabled',!isRemote)
		}
	)
	//populate lists
	populateServers()
	populatePrograms()
	.then(populateTasks)
	.then(()=>$('[name="local-remote"]').triggerHandler('click'))
}
