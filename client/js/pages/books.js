import {lib} from '../lib.js'

export default function(){
	//gen pseudo-random based on string hash (-0.5 .. 0.5)
	String.prototype.hashRandom = function(){return this.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)/2**31};
	//generate book order price
	let genPrice=book=>{
		let price=Math.round(
			book.pages*1.5         //1.5 rub/page
			*(1+book.title.hashRandom()) //0.5 to 1.5
			*(0.8+0.4*Math.random())     //0.8..1.2
		);
		return price;
	}
	//display books
	lib.rpcForm(
		'#catalog',
		data=>{
			let rows=data[0]
			lib.reportApp(rows.length==0?'Книги не найдены':'Найдено книг: '+rows.length)
			$('#headers').toggle(rows.length>0);
			let list=$('#books')
			let now=new Date().toISOString().substr(0,16) //yyyy-MM-ddThh:mm:ss
			list.children('div:not(:first-child)').remove()
			rows.forEach(
				r=>{
					let price=genPrice(r)
					console.log(r.authors_list)
					$('<div/>',{class:'row book'})
						.append(
							$('<span/>',{class:'col-5 my-auto'})
							.html(
								r.title
								+' '
								+r.authors_list
								.map(
									a=>
									a.last_name
									+' '
									+a.first_name.substr(0,1)+'.'
									+(a.middle_name?' '+a.middle_name.substr(0,1)+'.':'')
								)
								.join(', ')
							)
						)
						.append(
							$('<span/>',{class:'col-7'})
							.append(
								$('<div/>',{class:'row'})
								.append($('<span/>',{class:'col-2 text-right'}).html(r.onhand_qty))
								.append($('<button/>',{class:'col-4 btn btn-primary btn-sm'}).attr('data-action','order-book').html('Заказать'))
								.append($('<span/>',{class:'col-2 text-right'}).html(r.price))
								.append($('<button/>',{class:'col-4 btn btn-primary btn-sm'}).attr('data-action','set-price').html('Установить'))
							)
							.append(
								$('<form/>',{class:'d-none form-inline',action:'emp/orderBook'})
								.append($('<input/>',{name:'book_id',type:'hidden'}).val(r.book_id))
								.append($('<input/>',{name:'price',type:'hidden'}).val(price))
								.append(
									$('<ul/>',{class:'container'})
									.append(
										$('<li/>',{class:'row form-group'})
										.append($('<span>',{class:'col-6'}).html('В наличии'))
										.append($('<span>',{class:'col-6 text-right'}).html(r.onhand_qty))
									)
									.append(
										$('<li/>',{class:'row form-group'})
										.append($('<span>',{class:'col-6'}).html('Со склада'))
										.append(
											$(
												'<input/>',
												{
													name:'qty',
													type:'number',
													min:'1',
													class:'form-control form-control-sm col-6 text-right',
													required:'required',
													value:1
												}
											)
										)
									)
								)
								.append(
									$('<div/>',{class:'w-100'})
									.append($('<button/>',{class:'btn btn-primary btn-sm float-left'}).html('Заказать').attr('data-action','order-book'))
									.append($('<button/>',{type:'reset',class:'btn btn-primary btn-sm float-right cancel'}).html('&times;'))
								)
							)
							.append(
								$('<form/>',{class:'d-none form-inline',action:'emp/setPrice'})
								.append($('<input/>',{name:'book_id',type:'hidden'}).val(r.book_id))
								.append(
									$('<ul/>',{class:'container'})
									.append(
										$('<li/>',{class:'row form-group'})
										.append($('<span>',{class:'col-5'}).html('Текущая цена'))
										.append($('<span>',{class:'col-7 text-right'}).html(r.price))
									)
									.append(
										$('<li/>',{class:'row form-group'})
										.append($('<span>',{class:'col-5'}).html('Новая цена'))
										.append(
											$(
												'<input/>',
												{
													name:'price',
													type:'number',
													min:'0',
													class:'form-control form-control-sm col-7 text-right',
													required:'required',
													value:price
												}
											)
										)
									)
									.append(
										$('<li/>',{class:'row form-group'})
										.append($('<span>',{class:'col-5'}).html('С'))
										.append(
											$(
												'<input/>',
												{
													name:'at',
													type:'datetime-local',
													min:now,
													class:'form-control form-control-sm col-7 text-right',
													required:'required',
													value:now
												}
											)
										)
									)
								)
								.append(
									$('<div/>',{class:'w-100'})
									.append($('<button/>',{class:'btn btn-primary btn-sm float-left'}).html('Установить').attr('data-action','set-price'))
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
				?'Киниги заказаны'
				:'Отпускная цена установлена'
			);
			$(form).find('button[type="reset"]').trigger('click');
			$('#catalog').trigger('submit');
		}
	);
	//event handlers
	$('#books')
	.off()
	.on(
		'click',
		'.row.book>span:nth-child(2)>div.row>button',
		e=>{
			let button=$(e.currentTarget)
			button.parent().addClass('d-none')
			button.parent().siblings('form')
			.find('button[data-action="'+button.data('action')+'"]')
			.parents('form')
			.removeClass('d-none')
			.find('input[name!="book_id"]').focus().select()
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
	);
}
