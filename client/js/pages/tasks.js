import {lib} from '../lib.js'

export default function(){
	//populate tasks drop-down
	let populatePrograms=()=>lib.doAction('emp/getPrograms').then(res=>lib.populateSelectFromData('#programs')(res[0]))
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
						.append($('<span/>',{class:'col-2 my-auto'}).html(r.started))
						.append($('<span/>',{class:'col-2 my-auto'}).html(r.finished))
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
					;
				}
			);
		}
	)
	lib.rpcForm(
		'#run-task',
		data=>{
			populateTasks();
			lib.alert('scheduled task #'+rows[0].run_program);
		},
		f=>{
			let json=$('#params').val();
			try{
				JSON.parse(json);
				return true;
			}
			catch(e){
				lib.alert('error parsing parameters:\n'+e.message);
				return false;
			}
		}
	);
	$('#refresh').off().click(populateTasks);
	$('#tasks').off().on(
		'click',
		'.show-results',
		e=>{
			lib.doAction('emp/taskResults',{task_id:$(e.currentTarget).data('id')})
			.then(res=>$('#results-text').html(res[0]))
		}
	);
	$('[data-toggle="tooltip"]').tooltip();
	populatePrograms().then(populateTasks);
}
