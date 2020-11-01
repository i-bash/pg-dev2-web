import {lib} from '../lib.js'
import {Dev2App} from '../dev2app.js'

export default function(){
	let displayCartItem=r=>{
		let outOfStock=r.qty>r.onhand_qty;
		$('<div/>',{class:'row book mt-3 mb-3'})
		.data(r)
		//cover
		.append(
			$('<span/>',{class:'col-2 text-center'})
			.append(
				$('<img/>',{src:'img/book.png',class:'cover mw-100'})
				.data('id',r.book_id)
			)
		)
		//authors, title
		.append(
			$('<div/>',{class:'col-6'})
			.append($('<div/>',{class:'text-truncate'}).html(r.title))
			.append(
				$('<div/>',{class:'text-truncate'})
				.html(
					r.authors_list.map(
						author=>author.last_name+' '+author.first_name[0]+'.'+(author.last_name?' '+author.last_name[0]+'.':'')
					).join(', ')
				)
			)
		)
		//price
		.append(
			$('<div/>',{class:'col-1 text-right text-nowrap p-1'})
			.append($('<div/>',{class:''}).html(r.price+' ₽'))
		)
		//quantity
		.append(
			$('<div/>',{class:'col-2 text-nowrap text-right'})
			.append(
				$('<span/>',{class:'align-middle p-2 mr-1 qty'})
				.html(r.qty)
				.addClass(outOfStock?'bg-danger text-white':'')
				.prop('title','На складе '+r.onhand_qty+' книг')
				.attr('data-toggle','tooltip')
				.attr('data-placement','top')
			)
			.append(
				$('<button/>',{class:'change-qty btn btn-sm btn-outline-dark mr-1'})
				.data('change',-1)
				.html('&ndash;')
				.prop('disabled',r.qty<=1)
			)
			.append(
				$('<button/>',{class:'change-qty btn btn-sm btn-outline-dark'})
				.data('change',1)
				.html('+')
			)
		)
		//remove button
		.append(
			$('<div/>',{class:'col-1'})
			.append(
				$('<button/>',{type:'button',class:'btn btn-secondary btn-sm from-cart'}).html('&times;')
			)
		)
		.appendTo($('#books'))
		;
	}
	//display books in cart
	let displayCart=res=>{
		let rows=res[0]
		$('#totals').toggle(rows.length>0)
		$('#books').empty()
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
	//change item quantity
	.on(
		'click',
		'button.change-qty',
		e=>{
			let row=$(e.currentTarget).parents('.book')
			let change=$(e.currentTarget).data().change
			//let newQty=$(row).data().qty+change
			lib.doAction(
				'web/toCart',
				{
					auth_token:sessionStorage.getItem('authToken'),
					book_id:row.data().book_id,
					qty:change
				}
			)
			//row.data.qty=newQty
			//row.find('.qty').html(newQty)
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
