import {lib} from '../lib.js'
import {Dev2App} from '../dev2app.js'

export default function(){
	let displayCartItem=r=>{
		let qty=
			$('<input/>',{class:'col-1 text-right qty form-control form-control-sm position-static',type:'number',min:'1'})
			.val(r.qty)
		;
		if(r.qty>r.onhand_qty){
			qty
			.addClass('bg-danger text-white')
			.prop('title','На складе '+r.onhand_qty+' книг')
			.attr('data-toggle','tooltip')
			.attr('data-placement','top')
		}
		$('<div/>',{class:'row'})
		.data(r)
		.append(
			$('<span/>',{class:'col-2'})
			.append(
				$('<a/>',{href:'#'}).append($('<img/>',{src:'img/book.png',class:'cover w-50'}).data('id',r.book_id))
			)
		)
		.append(
			$('<span/>',{class:'col-6'})
			.html(
				r.title+
				'. '+
				r.authors_list.map(
					author=>author.last_name+' '+author.first_name[0]+'.'+(author.last_name?' '+author.last_name[0]+'.':'')
				).join(', ')
			)
		)
		.append($('<span/>',{class:'col-1 text-right'}).html(r.price))
		.append(qty)
		.append(
			$('<span/>',{class:'col-2'})
			.append(
				$('<button/>',{type:'button',class:'btn btn-secondary btn-sm from-cart'}).html('Убрать')
			)
		)
		.appendTo($('#books'))
		;
	}
	//display books in cart
	let displayCart=res=>{
		let rows=res[0]
		$('#headers,#totals').toggle(rows.length>0)
		$('#books').children('div:not(:first-child)').remove()
		rows.forEach(displayCartItem)
		$('[data-toggle="tooltip"]').tooltip()
		Dev2App.displayCartInfo(res); //in header
		lib.reportApp(rows.length==0?'Корзина пуста':'В корзине книг: '+rows.length)
		Dev2App.getCovers('img.cover')
	}
	//refresh cart
	let refreshCart=()=>lib.doAction('web/getCart',{auth_token:sessionStorage.getItem('authToken')}).then(displayCart)
	
	//event handlers
	$('#books')
	.off()
	.on('show load ','img',alert)
	.on('click','img',e=>{lib.displayPage('book')})
	//change item quantity
	.on(
		'change',
		'input.qty',
		e=>{
			let row=$(e.currentTarget).closest('.row')
			let newValue=$(e.currentTarget).val()
			let diff=newValue-row.data().qty
			console.info(diff)
			row.data.qty=newValue
			lib.doAction(
				'web/toCart',
				{auth_token:sessionStorage.getItem('authToken'),book_id:row.data().book_id,qty:diff}
			)
			.then(refreshCart)
			.then(lib.reportApp('Количество книг изменено'))
		}
	)
	//remove item from cart
	.on(
		'click',
		'button.from-cart',
		e=>{
			lib.doAction(
				'web/fromCart',
				{auth_token:sessionStorage.getItem('authToken'),book_id:$(e.currentTarget).closest('.row').data().book_id}
			)
			.then(refreshCart)
			.then(lib.reportApp('Книга удалена из корзины'))
		}
	);
	//buttons
	$('#buy').click(
		()=>{
			lib.doAction(
				'web/checkout',
				{auth_token:sessionStorage.getItem('authToken')}
			)
			.then(refreshCart)
			.then(lib.reportApp('Вы купили книги'))
			//lib.displayPage('shop')
		}
	);
	$('#to-shop').click(()=>{lib.displayPage('shop')});
	
	//init
	refreshCart();
}
