var infoBubble = new Class({

	Implements: Options,
	
	bubble: null,
	delay: null,
	elements: null,
	tipHeight: 10,
	visible: false,

	options: {
		fade: true,
		fxDuration: 250,
		hideDelay: 2500,
		marginBottom: 10,
		marginTop: -20,
		size: {
			height: 200,
			width: 250
		}
	},
	
	initialize: function(selector)
	{
		this.elements = $$(selector);
		
		this.attach();
		this.createBubble();
	},
	
	attach: function()
	{
		this.elements.each(function(el){
			el.addEvents({
				'click': function(e){
					e.stop();
				}.bind(this),
				'mouseleave': function(){
					this.hideBubble(el);
				}.bind(this),
				'mouseover': function(){
					this.showBubble(el);
				}.bind(this)
			});
		}, this);
	},
	
	createBubble: function()
	{
		this.bubble = new Element('div', {
			'class': 'infoBubble',
			styles: {
				height: this.options.size.height + this.tipHeight,
				marginTop: this.options.marginTop,
				opacity: 0,
				top: -1000,
				width: this.options.size.width
			}
		}).adopt(new Element('div', {
			'class': 'infoBubble-Bubble',
			styles: {
				height: this.options.size.height
			}
		})).inject(document.body);
		
		if(this.options.fade)
		{
			this.bubble.store('fxInstance', new Fx.Morph(this.bubble, {
				duration: this.options.fxDuration
			}));
		}
		
		this.bubbleContent = new Element('div', {
			'class': 'infoBubble-Content',
			styles: {
				height: this.options.size.height - (this.tipHeight * 2)
			}
		}).inject(this.bubble.getFirst('div'));
	},
	
	getContent: function(el)
	{
		this.bubbleContent.empty().addClass('loading');
		
		var href = el.get('href');

		if(href.substr(0, 1) == '#')
		{
			var id = href.substr(1);

			if($(id))
			{
				this.bubbleContent.adopt($(id).clone());
			}
			this.bubbleContent.removeClass('loading');
		}
		else
		{
			new Request.HTML({
				onSuccess: function(){
					this.bubbleContent.removeClass('loading')
				}.bind(this),
				update: this.bubbleContent,
				url: href	
			}).send();
		}
	},
	
	hideBubble: function()
	{
		this.delay = (function(){
			//if(this.options.fade)
			var fx = this.bubble.retrieve('fxInstance');
			fx.start({
				marginTop: this.options.marginTop,
				opacity: 0
			});
			this.visible = false;
		}.bind(this)).delay(this.options.hideDelay);
	},
	
	showBubble: function(el)
	{
		$clear(this.delay);

		var coordinates = el.getCoordinates();

		// TODO limit left 0, window.width
		var left = (coordinates.left + (coordinates.width/2).round() - (this.options.size.width/2).round());
		var top = (coordinates.top - this.options.size.height - this.tipHeight - this.options.marginBottom);

		this.bubble.setStyles({
			left: left,
			top: top
		});

		this.getContent(el);
		
		if(this.visible)
		{
			return;
		}

		if(this.options.fade)
		{
			var fx = this.bubble.retrieve('fxInstance');
			fx.start({
				marginTop: 0,
				opacity: 1
			});
			this.visible = true;
		}
		else
		{
			this.bubble.fade('show');	
		}
	}
	
});