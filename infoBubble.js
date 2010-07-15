var infoBubble = new Class({

	Implements: Options,
	
	bubble: null,
	elements: null,
	tipHeight: 10,

	options: {
		fade: true,
		fxDuration: 250,
		hideDelay: 2500,
		margin: 10,
		size: {
			height: 250,
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
					//this.hideBubble(el);
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
				opacity: 0,
				width: this.options.size.width
			}
		}).set('tween', {
			duration: this.options.fxDuration
		}).adopt(new Element('div', {
			'class': 'infoBubble-Bubble',
			styles: {
				height: this.options.size.height
			}
		})).inject(document.body);
		
		this.bubbleContent = new Element('div', {
			'class': 'infoBubble-Content'
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
		(function(){
			this.bubble.fade(0);
		}.bind(this)).delay(this.options.hideDelay);
	},
	
	showBubble: function(el)
	{
		var coordinates = el.getCoordinates();

		// TODO limit left 0, window.width
		var left = (coordinates.left + (coordinates.width/2).round() - (this.options.size.width/2).round());
		
		var top = (coordinates.top - this.options.size.height - this.tipHeight - this.options.margin);

		this.bubble.setStyles({
			left: left,
			top: top
		});
		
		this.bubble.fade(this.options.fade ? 1 : 'show');
		
		this.getContent(el);
	}
	
});