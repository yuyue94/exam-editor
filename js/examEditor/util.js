define([
	'jquery',
	'wangEditor',
	'backbone',
	'ace/ace',
	'ace/ext/language_tools',
	'ace/autocomplete/util',
	'ace/snippets',
	'ace/autocomplete',
	'ace/autocomplete/text_completer',
	'ace/lib/lang',
	'ace/config',

],function($, WangEditor, Backbone, ace){

	return {
		createWangEditor: function(id, html, menus){
			menus = menus || [
				'bold',
				'underline',
				'eraser',
				'|',
				'unorderlist',
				'orderlist',
				'|',
				'link',
				'unlink',
				'table',
				'|',
				'insertcode'
			];

			var editor = new WangEditor(id);
			editor.config.menus = menus;
			editor.create();

			editor.$txt.html(html);
			return editor;
		},
		createCodeEditor: function(id, code, mode){
			mode = mode || 'python';

			var editor = ace.edit(id);

			editor.setTheme('ace/theme/clouds');
			editor.getSession().setMode('ace/mode/'+mode);

			editor.setOptions({
				enableBasicAutocompletion: true,
				enableSnippets: true,
				enableLiveAutocompletion: true,
			});


			editor.setValue(code);
			editor.focus();
			// editor.gotoLine(editor.session.getLength() + 1); //Go to end of document
			return editor;
			},
		createTextEditor: function(id, value){
			var html = $('#text-editor-tmpl').tmpl({value: value});
			$('#'+id).html(html);
			return $(html);
		},
		createHintsEditor: function(id, total){
			var html = $('#hints-editor-tmpl').tmpl({total: total});
			$('#'+id).html(html);
			return $(html);
		},
		createIOEditor: function(id, data){
			var html = $('#io-editor-tmpl').tmpl(data);
			$('#'+id).html(html);
			return $(html);
		},
		initViewConstructors: function(models, BaseView){ // 暂时弃用，可能之后考虑common类和特别类
			var viewConstructors = {};
			var Util = this;
			models.forEach(function(model){
				var module = model.toJSON();
				viewConstructors[module.id] = BaseView.extend({
					initialize: function(){
						BaseView.prototype.initialize.call(this);
						this.createEditor();
					},
					createEditor: function(){
						var id = this.$('.module-wrapper').attr('id');
						var that = this;
						switch(module.dataType){
							case 'html': {
								this.updateToGlobal = function(){
									this.model.get('data').pop();
									this.model.get('data').push(this.editor.$txt.html());
									this.model.trigger('update:storage');
								};

								this.value = this.model.get('data')[0] || '<p><br></p>';
								this.editor = Util.createWangEditor(id, this.value);
								this.updateToGlobal();

								this.editor.onchange = function(){
									that.updateToGlobal();
								};
								break;
							}
							case 'code': {
								this.updateToGlobal = function(){
									this.model.get('data').pop();
									this.model.get('data').push(this.editor.getValue());
									this.model.trigger('update:storage');
								};

								this.value = this.model.get('data')[0] || unescape(this.model.get('defaultData')) || '';
								this.editor = Util.createCodeEditor(id, this.value);
								this.updateToGlobal();

								this.editor.getSession().on('change', function(){
									that.updateToGlobal();
								});
								break;
							}
							case 'text': {
								this.updateToGlobal = function(){
									this.model.get('data').pop();
									this.model.get('data').push(this.editor.val());
									this.model.trigger('update:storage');
								};

								this.validateInput = function(){
									var input = this.editor.val();
									var reg = /^[_#&]|[;,.$]+/; // title不能是这样的
									return input.length > 0 && !reg.test(input);
								};

								this.toggleValid = function(isValid){
									if (isValid){
										this.editor.addClass('valid');
									} else {
										this.editor.removeClass('valid');
									}
								}

								this.value = this.model.get('data')[0] || '';
								this.editor = Util.createTextEditor(id, this.value);
								this.toggleValid(this.validateInput());
								this.updateToGlobal();

								this.editor.on('keyup', function(){
									var isValid = that.validateInput();
									that.toggleValid(isValid);
									that.updateToGlobal();
								});

								break;
							}
							case 'hints': {
								this.createHintView = function(hint){
									var model = new HintModel({hint: hint});
									var view = new HintEditorView({model: model});

									that.listenTo(view, 'up:hint', that.upHint);
									that.listenTo(view, 'delete:hint', that.deleteHint);
									that.listenTo(view, 'update:hint', that.updateToGlobal);

									that.hintsViews.push(view);
									that.updateToGlobal();
								};

								this.render = function(){
									this.$('.current-hints').html('');
									this.hintsViews.forEach(function(view){
										that.$('.current-hints').append(view.render());
									})
								};

								this.upHint = function(cid){
									var index = this.hintsViews.findIndex(function(view){
										return view.cid === cid;
									});
									var view = this.hintsViews.splice(index, 1)[0];
									this.hintsViews.unshift(view);
									this.render();
									this.updateToGlobal();
								};

								this.deleteHint = function(cid){
									var index = this.hintsViews.findIndex(function(view){
										return view.cid === cid;
									});
									var view = this.hintsViews.splice(index, 1)[0];
									view.remove();
									this.updateToGlobal();
								};

								this.updateToGlobal = function(){
									var hints = this.hintsViews.map(function(view){
										return view.model.get('hint') || '';
									}) || [];

									this.model.get('data').pop();
									this.model.get('data').push(hints);
									this.model.trigger('update:storage');
								};

								this.editor = Util.createHintsEditor(id);
								this.hints = this.model.get('data')[0] || [];
								this.hintsViews = [];

								this.hints.forEach(function(hint, i){
									that.createHintView(hint, i);
								});

								this.render();
								this.updateToGlobal();

								this.$('.add-hints').on('click', function(){
									that.createHintView('', that.hintsViews.length);
									that.render();
								});
								break;

							}
							case 'io': {
								this.updateToGlobal = function(){
									this.model.get('data').pop();
									this.model.get('data').push(this.result);
									this.model.trigger('update:storage');
								};


								this.result = this.model.get('data')[0] || {
									inputExample: '',
									inputDescription: '',
									outputExample: '',
									outputDescription: ''
								};
								Util.createIOEditor(id, this.result);
								this.updateToGlobal();

								this.$('.form-input').on('keyup', function(e){
									var $target = $(e.currentTarget);
									var key = $target.attr('io-type');
									that.result[key] = $target.val();
									that.updateToGlobal();
								});
								break;
							}
						}
					}
				});
			});
			return viewConstructors;
		}
	}	
})