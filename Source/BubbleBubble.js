/*
---
description: tooltip-like bubble to show images, inline content or ajax content

license: MIT-style

author:
- Johannes Fischer

requires:
- core/1.4: *
- more/1.4: Assets
- more/1.4: Fx.Elements

provides:
- BubbleBubble

...
*/

var BubbleBubble = new Class({

	Implements: Options,
	
	activeEl: null,
    bubble: null,
    delay: null,
    elements: null,
    linkType: null,
	position: null,
    tipHeight: 11,
    visible: false,

	options: {
        animate: true,
		contentMargin: 10,
		contentSource: 'href',
		fxDuration: 250,
		hideDelay: 2500,
        hideOnClick: true, // TODO: inject close element (x) and close bubble when clicked
		margin: 10, // deistance to element in px
		offset: 20,
        position: 'top', // top, bottom, auto
		size: {
			height: 200,
			width: 250
		},
        showOnclick: false, // TODO: attach on click showBubble when true
		stopOnclick: true
	},
	
	initialize: function (selector, options)
	{
		this.setOptions(options);

        this.selector = selector;

		if (!this.options.animate) {
			this.options.contentMargin = 0;
		}

		if ($$(selector).length > 0) {
			this.attach();
			this.createBubble();
		}
	},
	
	attach: function ()
	{
        if (this.options.stopOnclick) {
            document.body.addEvent('click:relay(' +  this.selector + ')', function (event, target) {
                event.preventDefault();
            });
        }

        document.body.addEvent('mouseleave:relay(' +  this.selector + ')', function (event, target) {
            this.hideBubble();
        }.bind(this));

        document.body.addEvent('mouseover:relay(' +  this.selector + ')', function (event, target) {
            this.setLinkType(target);
			this.showBubble(target);
        }.bind(this));
	},
    
    calculatePosition: function (position, coordinates, bubbleSize)
    {
        var new_coordinates = {};
		
		if (bubbleSize === undefined || bubbleSize === null) {
			bubbleSize = this.bubble.getSize();
		}

        if (position.test('bottom|top')) {
			new_coordinates.left = (coordinates.left + (coordinates.width / 2) - (bubbleSize.x / 2)).round();
        } else if (position.test('left|right')) {
			new_coordinates.top = (coordinates.top + (coordinates.height / 2) - (bubbleSize.y / 2)).round();
		}

        if (position === 'bottom') {
            new_coordinates.top = coordinates.bottom + this.options.margin + this.tipHeight;
        } else if (position === 'left') {
			new_coordinates.left = coordinates.left - bubbleSize.x - this.options.margin - this.tipHeight; // not acurate
		} else if (position === 'right') {
            new_coordinates.left = coordinates.right + this.options.margin + this.tipHeight;
        } else if (position === 'top') {
			new_coordinates.top = coordinates.top - bubbleSize.y - this.options.margin - this.tipHeight; // not acurate
        }

        return new_coordinates;
    },
	
	clearDelay: function ()
	{
		window.clearInterval(this.delay);
	},
	
	createBubble: function ()
	{
		this.bubbleContainer = new Element('div.BubbleBubble', {
			styles: {
				height: this.options.size.height + this.tipHeight + (this.options.contentMargin * 2),
				opacity: 0,
				width: this.options.size.width + (this.options.contentMargin * 2)
			}
		}).inject(document.body);

		this.bubble = new Element('div.BubbleBubble-Bubble', {
			events: {
				'mouseleave': function () {
					this.hideBubble();
				}.bind(this),
				'mouseover': function () {
					this.clearDelay();
				}.bind(this)
			},
			styles: {
				height: this.options.size.height + (this.options.contentMargin * 2)
			}
		}).inject(this.bubbleContainer);

		if (this.options.animate) {
			this.bubbleContainer.store('fxInstance', new Fx.Morph(this.bubbleContainer, {
				duration: this.options.fxDuration
			}));
		}
		
		this.bubbleContent = new Element('div.BubbleBubble-Content', {
			styles: {
				height: this.options.size.height
			}
		}).inject(this.bubble);
	},
	
	getContent: function (el)
	{     
        var id,
		    image,
		    target;

		this.bubbleContent.addClass('loading');

		target = el.get(this.options.contentSource);
		
		if (target === null) {
			return;
		}

		if (this.linkType === 'inline')	{
			this.resetBubble();

			id = target.substr(target.indexOf('#') + 1);

			if (document.id(id)) {
				this.setContent(document.id(id).get('html'));
			}
		} else if (this.linkType === 'image') {
			image = el.retrieve('image');

			if (!image) {
				image = new Asset.image(el.get(this.options.contentSource), {
					onload: function () {
						this.insertImage(el, image);
						el.store('image', image);
					}.bind(this)
				});
			} else {
				this.insertImage(el, image);
			}
		} else {
			this.resetBubble(true);

			if (el.retrieve('responseHTML'))
			{
				this.setContent(el.retrieve('responseHTML'));
			}
			else
			{
				new Request.HTML({
					onSuccess: function (responseTree, responseElements, responseHTML) {
						el.store('responseHTML', responseHTML);
						this.bubbleContent.removeClass('loading');
					}.bind(this),
					update: this.bubbleContent,
					url: target	
				}).send();
			}
		}
	},
	
	getOffsetStyles: function ()
	{
		return {
			offset: this.position.test('left|top') ? this.options.offset * -1 : this.options.offset,
			position: this.position.test('left|right') ? 'left' : 'top'
		};
	},
	
	hideBubble: function ()
	{
		var margin,
		    styles;

		styles = {
			opacity: 0
		};

		margin = this.getOffsetStyles();

		styles['margin-' + margin.position] = margin.offset;

		this.delay = (function () {
            if (this.options.animate === true) {  
                this.bubbleContainer.retrieve('fxInstance').start(styles).chain(function () {
                    this.reset();
                }.bind(this));
            } else {
                this.bubbleContainer.fade('hide');
                this.reset();
            }
		}.bind(this)).delay(this.options.hideDelay);
	},
	
	insertImage: function (el, image)
	{
        var fade = false,
            fn = false,
            loaded = el.retrieve('image'),
            imageSize;
		
    	image.setStyle('opacity', 0);

		this.bubbleContent.empty().adopt(image);
	
		imageSize = image.getSize();

        if (!loaded) {
            fade = true;
        }

		this.resizeBubble(el, imageSize.y, imageSize.x, fade);	
	},
	
    reset: function ()
    {
        this.activeEl = null;
        this.resetBubble();
        this.bubbleContainer.setStyle('display', 'none');
		this.visible = false;
    },
    
	resetBubble: function ()
	{
        // resets to default size
		this.bubbleContainer.setStyles({
			height: this.options.size.height + this.tipHeight + (this.options.contentMargin * 2),
			width: this.options.size.width + (this.options.contentMargin * 2)
		});

		this.bubble.setStyle('height', this.options.size.height + (this.options.contentMargin * 2));

		this.bubbleContent.setStyle('height', this.options.size.height).empty().addClass('loading');
	},
	
	resizeBubble: function (el, height, width, fade)
	{
		var bubbleSize,
		    coordinates,
            left,
			new_coordinates,
			new_size,
            position,
            top;

		bubbleSize = this.bubble.getSize();
		coordinates = el.getCoordinates();

		if (height === bubbleSize.y && width === bubbleSize.x)
		{
			if (fade !== undefined && fade === true) {
                this.bubbleContent.getFirst().fade(1);
            } else {
                this.bubbleContent.getFirst().setStyle('opacity', 1);
            }
			return;
		}
		new_size = {
			x: width + (this.options.contentMargin * 2),
			y: height + (this.options.contentMargin * 2)
		};

        new_coordinates = this.calculatePosition(this.options.position, coordinates, new_size);

		new Fx.Elements($$(this.bubbleContainer, this.bubble, this.bubbleContent), {
            duration: this.options.fxDuration,
			onComplete: function () {
				this.bubble.setStyle('height', height + (this.options.contentMargin * 2));
				this.bubbleContent.setStyle('height', height).removeClass('loading');

				if (fade !== undefined && fade === true) {
					this.bubbleContent.getFirst().fade(1);
				} else {
                    this.bubbleContent.getFirst().setStyle('opacity', 1);
                }
			}.bind(this)
		}).start({
			'0': {
				height: height + this.tipHeight + (this.options.contentMargin * 2),
				left: new_coordinates.left,
				top: new_coordinates.top,
				width: width + (this.options.contentMargin * 2)
			},
			'1': {
				height: height + (this.options.contentMargin * 2)
			},
			'2': {
				height: height
			}
		});
	},
	
	setBubbleContent: function (content)
	{
		this.bubbleContent.removeClass('loading').adopt(content);	
	},
	
	setContent: function (html)
	{
		this.resetBubble();

		this.bubbleContent.removeClass('loading').set('html', html);
	},
	
	setLinkType: function (el)
	{
		var target = el.get(this.options.contentSource);

		if (target.indexOf('#') > -1) {
			this.linkType = 'inline';
		} else if (target.test('.gif|.jpeg|.jpg|.png')) {
			this.linkType = 'image';
		} else {
			this.linkType = 'ajax';
		}
	},
    
    setPosition: function (el)
    {
		var position = this.options.position;

        ['bottom', 'left', 'right', 'top'].each(function (p) {
			if (el.hasClass('bubble-' + p)) {
				position = p;
            }
            if(this.bubbleContainer.hasClass('BubbleBubble-' + p)) {
				this.bubbleContainer.removeClass('BubbleBubble-' + p);
            }
        }, this);

        this.bubbleContainer.addClass('BubbleBubble-' + position);

		return position;
    },
	
	showBubble: function (el)
	{
        var bubblePosition,
            coordinates,
			margin,
			new_coordinates,
            size,
			styles;
		
		this.position = this.setPosition(el);

		this.bubbleContainer.setStyles({
			display: 'block',
			margin: 0
		});
		
		this.clearDelay();
		
		if (this.activeEl === el) {
			return;
		}
		this.activeEl = el;

		coordinates = el.getCoordinates();

		size = null;

		if (this.visible && this.linkType === 'image') {
			size = this.bubbleContent.getSize();
		}

        new_coordinates = this.calculatePosition(this.position, coordinates, size);

		this.bubbleContainer.setStyles({
			left: new_coordinates.left,
			top: new_coordinates.top
		});

		this.getContent(el);

		if (this.visible) {
			return;
		}

		if (this.options.animate) {
			styles = {
				opacity: [0, 1]
			};

			margin = this.getOffsetStyles();

			styles['margin-' + margin.position] = [margin.offset, 0];

			this.bubbleContainer.retrieve('fxInstance').start(styles);
			this.visible = true;
		} else {
			this.bubbleContainer.fade('show');	
		}
	}
	
});