import {lib} from '../lib.js'

export default function(){
	//gen pseudo-random based on string hash (-0.5 .. 0.5)
	String.prototype.hashRandom = function(){return this.split('').reduce((a,b)=>{a=a*31+b.charCodeAt(0);return a&a},0)/2**32};
	//generate book order price
	let genPrice=book=>{
		let price=Math.round(
			book.pages*1.5               //1.5 rub/page
			*(1+book.title.hashRandom()) //0.5..1.5
			*(0.8+0.4*Math.random())     //0.8..1.2
		);
		return price;
	}
	//get timezone offset string
	let timeOffset=new Date().getTimezoneOffset() //minutes
	let tzOffset=
		(timeOffset>0?'-':'+')+
		('0'+Math.trunc(Math.abs(timeOffset)/60)).substr(-2)+
		':'+
		('0'+timeOffset%60).substr(-2)
	//display books
	lib.rpcForm(
		'#catalog',
		data=>{
			let rows=data[0]
			$('#headers').toggle(rows.length>0)
			lib.reportApp(rows.length==0?'Книги не найдены':'Найдено книг: '+rows.length)
			let list=$('#books')
			list.children('div:not(:first-child)').remove()
			rows.forEach(
				r=>{
					let price=genPrice(r)
					$('<div/>',{class:'row book'})
					.append(
						$('<span/>',{class:'col-6 my-auto'})
						.append($('<div/>',{class:'text-truncate'}).html(r.title))
						.append(
							$('<div/>',{class:'text-truncate'})
							.html(
								r.authors_list.map(
									a=>a.last_name+' '+a.first_name[0]+'.'+(a.middle_name?' '+a.middle_name[0]+'.':'')
								).join(', ')
							)
						)
					)
					.append(
						$('<span/>',{class:'col-6'})
						.append(
							$('<div/>',{class:'row'})
							.append($('<span/>',{class:'col-2 text-right'}).html(r.onhand_qty))
							.append(
								$('<span/>',{class:'col-4'})
								.append($('<button/>',{class:'btn btn-secondary btn-sm'}).attr('data-action','order-book').html('Заказать'))
							)
							.append($('<span/>',{class:'col-2 text-right'}).html(r.price))
							.append(
								$('<span/>',{class:'col-4'})
								.append($('<button/>',{class:'btn btn-secondary btn-sm'}).attr('data-action','set-price').html('Установить'))
							)
						)
						.append(
							$('<form/>',{class:'d-none form-inline p-2',action:'emp/orderBook'})
							.append($('<input/>',{name:'book_id',type:'hidden'}).val(r.book_id))
							.append($('<input/>',{name:'price',type:'hidden'}).val(price))
							.append(
								$('<ul/>',{class:'container'})
								.append(
									$('<li/>',{class:'row form-group'})
									.append($('<span>',{class:'col-10'}).html('В наличии на складе'))
									.append($('<span>',{class:'col-2 text-right'}).html(r.onhand_qty))
								)
								.append(
									$('<li/>',{class:'row form-group'})
									.append($('<span>',{class:'col-10'}).html('Заказать у поставщика'))
									.append(
										$(
											'<input/>',
											{
												name:'qty',
												type:'number',
												min:'1',
												class:'form-control form-control-sm col-2 text-right',
												required:'required',
												value:1
											}
										)
									)
								)
							)
							.append(
								$('<div/>',{class:'w-100'})
								.append(
									$('<button/>',{class:'btn btn-primary btn-sm float-left'})
									.html('Заказать по '+price+' ₽')
									.attr('data-action','order-book')
								)
								.append(
									$('<button/>',{type:'reset',class:'btn btn-primary btn-sm float-right cancel'})
									.html('&times;')
								)
							)
						)
						.append(
							$('<form/>',{class:'d-none form-inline p-2',action:'emp/setPrice'})
							.append($('<input/>',{name:'book_id',type:'hidden'}).val(r.book_id))
							.append(
								$('<ul/>',{class:'container'})
								.append(
									$('<li/>',{class:'row align-items-center'})
									.append($('<span/>',{class:'col-5'}).html('Цена издательства'))
									.append($('<span/>',{class:'col-7'}).html(price+' ₽'))
								)
								.append(
									$('<li/>',{class:'row align-items-center'})
									.append($('<span>',{class:'col-5'}).html('Текущая цена'))
									.append($('<span>',{class:'col-7'}).html(r.price+' ₽'))
								)
								.append(
									$('<li/>',{class:'row form-row align-items-center'})
									.append($('<span>',{class:'col-5'}).html('Новая цена'))
									.append(
										$(
											'<input/>',
											{
												name:'price',
												type:'number',
												min:'0',
												class:'form-control',
												required:'required',
												value:price*2
											}
										)
									)
									.append($('<span/>',{class:'ml-3'}).html('₽'))
								)
								.append(
									$('<li/>',{class:'row form-row align-items-center'})
									.append(
										$('<span/>',{class:'col-5'}).html('Действует с')
										.append($('<input/>',{type:'hidden',name:'at'}))
									)
									.append(
										$(
											'<input/>',
											{
												type:'date',
												required:true,
												class:'col-4 form-control'
											}
										)
									)
									.append(
										$(
											'<input/>',
											{
												type:'time',
												step:'60',
												class:'col-3 form-control',
												required:true
											}
										)
									)
								)
							)
							.append(
								$('<div/>',{class:'w-100'})
								.append($('<button/>',{class:'btn btn-primary btn-sm float-left'}).html('Установить цену').attr('data-action','set-price'))
								.append($('<button/>',{type:'reset',class:'btn btn-primary btn-sm float-right cancel'}).html('&times;'))
							)
						)
					)
					.appendTo(list)
				}
			);
		}
	);
	//rpc forms
	lib.rpcForm(
		'.book form',
		(data,form)=>{
			lib.reportApp(
				($(form).find('button[data-action]').attr('data-action'))=='order-book'
				?'Книги заказаны'
				:'Отпускная цена установлена'
			);
			$(form).find('button[type="reset"]').trigger('click');
			$('#catalog').trigger('submit');
		}
	);
	//event handlers
	$('[name="orderby"],[name="direction"]').off().change(()=>{$('#catalog').submit()})

	$('#books')
	.off()
	.on(
		'click',
		'.row.book>span:nth-child(2)>div.row button',
		e=>{
			let button=$(e.currentTarget)
			let form=button.parent().parent().siblings('form')
			button.parent().parent().addClass('d-none')
			form
			.find('button[data-action="'+button.data('action')+'"]')
			.parents('form')
			.removeClass('d-none')
			form.find('input[name!="book_id"]').focus().select()
			form.find('input[type="date"]').val(new Date().toLocaleDateString('fr-CA')) //yyyy-mm-dd
			form.find('input[type="time"]').val(new Date().toLocaleTimeString('ru-RU').substr(0,5)) //hh:mi
			form.find('input[type="time"]').trigger('input')
		}
	)
	.on(
		'click',
		'button.cancel',
		e=>{
			let cancelButton=$(e.currentTarget);
			cancelButton.parents('.row.book').find('form').addClass('d-none');
			cancelButton.parents('form').siblings('div.row').removeClass('d-none');
		}
	)
	.on(
		'input',
		'input[type="date"],input[type="time"]',
		e=>{
			let row=$(e.currentTarget).parents('li')
			row.find('[type="hidden"]').val(row.find('[type="date"]').val()+'T'+row.find('[type="time"]').val()+tzOffset)
		}
	)
}
