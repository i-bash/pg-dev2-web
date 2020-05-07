import {lib} from '../lib.js'
import {Dev2App} from '../dev2app.js'

export default function(){
	//populate programs drop-down
	let populateServers=()=>lib.populateSelect(
		'#remote',
		Dev2App.config.pgServers.map(s=>[s.host+':'+s.port,s.host+':'+s.port])
	)

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
					.append($('<span/>',{class:'col-2 my-auto'}).html(r.started?r.started.substr(0,19):''))
					.append($('<span/>',{class:'col-2 my-auto'}).html(r.finished?r.finished.substr(0,19):''))
					.append($('<span/>',{class:'col-2 my-auto'}).html(r.status))
					.append(
						$('<span/>',{class:'col-1 my-auto'}).html(
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
	lib.rpcForm(
		'#run-task',
		data=>{
			populateTasks();
			lib.reportApp('scheduled task #'+data[0][0])
		},
		f=>{
			let json=$('#params').val()
			try{
				return Promise.resolve(JSON.parse(json))
			}
			catch(e){
				lib.reportError('error parsing parameters:\n'+e.message)
				return Promise.reject(e)
			}
		}
	)
	$('#refresh').off().click(populateTasks)
	$('#tasks').off().on(
		'click',
		'.show-results',
		e=>{
			lib.doAction('emp/taskResults',{task_id:$(e.currentTarget).data('id')})
			.then(res=>$('#results-text').html(res[0]))
		}
	)
	$('[data-toggle="tooltip"]').tooltip()
	$('#is_remote').click(
		e=>{
			let isRemote=$(e.target).prop('checked')
			$('#remote').toggle(isRemote)
			//pass host and port only for remote instance
			$('#host,#port').each((i,e)=>$(e).attr('name',isRemote?e.id:''))
		}
	)
	$('#remote').change(
		e=>{
			let hpArray=$('#remote').val().split(':')
			$('#host').val(hpArray[0])
			$('#port').val(hpArray[1])
		}
	)
	populateServers()
	populatePrograms()
	.then(populateTasks)
	.then(
		()=>{
			$('#is_remote').triggerHandler('click');
		}
	)
}
