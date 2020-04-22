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
			lib.reportApp(rows.length==0?'Книги не найдены':'Найдено книг: '+rows.length);
			$('#headers').toggle(rows.length>0);
			let list=$('#books');
			list.children('div:not(:first-child)').remove();
			rows.forEach(
				r=>{
					let price=genPrice(r);
					$('<div/>',{class:'row book'})
						.append($('<span/>',{class:'col-6 my-auto'}).html(r.title+' '+r.authors_list.length))
						.append(
							$('<span/>',{class:'col-4 container'})
							.append(
								$('<div/>',{class:'row'})
								.append($('<span/>',{class:'col-6 text-right'}).html(r.onhand_qty))
								.append($('<button/>',{class:'col-4 btn btn-primary btn-sm order'}).html('Заказать'))
							)
							.append(
								$('<form/>',{class:'order-book row d-none',action:'emp/orderBook'})
								.append($('<input/>',{name:'qty',type:'number',min:'1',class:'col-3 text-right',required:'required',value:'1'}))
								.append($('<input/>',{name:'book_id',type:'hidden'}).val(r.book_id))
								.append($('<input/>',{name:'price',type:'hidden'}).val(price))
								.append($('<span/>',{class:'col-3 text-right'}).html(price))
								.append($('<button/>',{class:'col-4 btn btn-primary btn-sm'}).html('Заказать'))
								.append($('<button/>',{type:'reset',class:'col-2 btn btn-primary btn-sm cancel'}).html('&times;'))
							)
						)
						.append($('<span/>',{class:'col-2 text-right'}).html(r.price))
						.appendTo(list)
					;
				}
			);
		}
	);
	lib.rpcForm(
		'.book form.order-book',
		(data,form)=>{
			lib.alert('books have been ordered');
			$(form).children('button[type="reset"]').trigger('click');
			$('#catalog').trigger('submit');
		}
	);
	
	//event handlers
	$('#books')
	.off()
	.on(
		'click',
		'button.order',
		e=>{
			let orderButton=$(e.currentTarget);
			orderButton.parent().addClass('d-none');
			orderButton.parent().siblings('form.row').removeClass('d-none');
			orderButton.parent().siblings('form.row').find('input[name="qty"]').focus().select();
		}
	)
	.on(
		'click',
		'button.cancel',
		e=>{
			let cancelButton=$(e.currentTarget);
			cancelButton.parent().addClass('d-none');
			cancelButton.parent().siblings('div.row').removeClass('d-none');
		}
	);
}
