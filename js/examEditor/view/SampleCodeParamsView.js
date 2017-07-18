define([
	'examEditor/util',
	'highlight'
],function(Util, hljs){

	hljs.configure({
		tabReplace: '    ', // 4 spaces
	});

	var ParamInput = Backbone.Model.extend({});

	var ParamInputView = Backbone.View.extend({
		events: {
			'keyup .param-input': 'updateParam',
			'click .delete-param': 'deleteParam'
		},
		render: function(){
			this.reservedwords = [
				'and', 'as', 'assert',
				'break', 'class', 'continue',
				'def', 'del', 'elif',
				'else', 'except', 'exec',
				'for', 'finally', 'from',
				'global', 'if', 'import',
				'in', 'is', 'lambda',
				'not', 'or', 'pass',
				'print', 'raise', 'return',
				'try', 'while', 'with',
				'yield'
			];
			this.$el = $('#sample-code-param-tmpl').tmpl(this.model.toJSON());
			this.validateData(this.model.get('param'));
			this.delegateEvents(this.events);
			return this.$el;
		},
		updateParam: function(e){
			var $target = $(e.currentTarget);
			var data = $target.val();
			var isValid = this.validateData(data);
			if (isValid){
				this.model.set('param', data);
				this.trigger('update:param');
			}
		},
		validateData: function(data){
			var identifierReg = /\b[a-zA-Z_]\w*\b/;
			if (data && data.length !== 0 && identifierReg.test(data) && this.reservedwords.indexOf(data) === -1) { // 检验标识符
				this.$('.param-input').addClass('valid').removeClass('invalid');
				return true;
			} else {
				this.$('.param-input').addClass('invalid').removeClass('valid');
				return false;
			}

		},
		deleteParam: function(){
			this.trigger('delete:param', this.cid);
		}

	});
	return {
		constructView: function(BaseView){
			return BaseView.extend({
				events: {
					'click .add-param': 'addParam'
				},
				initialize: function(){
					BaseView.prototype.initialize.call(this);
					this.createEditor();
				},
				updateToGlobal: function(){
					var params = this.paramsViews.map(function(view){
						return view.model.get('param') || '';
					}) || [];
					this.renderPreviewCode(params);

					this.model.get('data').pop();
					this.model.get('data').push(params);
					this.model.trigger('update:storage');

					this.$el.data('view', this);
					this.trigger('update:paramsNameList');
				},
				createEditor: function(){
					var id = this.$('.module-wrapper').attr('id');
					var that = this;

					this.params = this.model.get('data')[0] || [];
					this.paramsViews = [];

					this.params.forEach(function(param){
						that.createParamView(param);
					});

					this.render(id);
					this.updateToGlobal();
				},
				render: function(id){
					var html = $('#sample-code-params-tmpl').tmpl();
					this.$('#'+id).html(html);
					this.renderParams();
				},
				renderParams: function(){
					var that = this;
					this.$('.current-params').html('');
					this.paramsViews.forEach(function(view){
						that.$('.current-params').append(view.render());
					});
				},
				renderPreviewCode: function(params){
					var tempParams = params.slice(0);
					tempParams.unshift('self');

					var sampleCodeStr = 'class Solution:\n\tdef solve(' + tempParams.join(',') + '):\n\t\tpass';
					this.$('#sample-code-params-preview code').html(sampleCodeStr);
					hljs.highlightBlock(this.$('#sample-code-params-preview code').get(0));
				},
				addParam: function(){
					this.createParamView('');
					this.renderParams();
					this.updateToGlobal();
				},
				deleteParam: function(cid){
					var index = this.paramsViews.findIndex(function(view){
						return view.cid === cid;
					});
					var view = this.paramsViews.splice(index, 1)[0];
					view.remove();
					this.updateToGlobal();
				},
				createParamView: function(param){
					var model = new ParamInput({param: param});
					var view = new ParamInputView({model: model});

					this.listenTo(view, 'update:param', this.updateToGlobal);
					this.listenTo(view, 'delete:param', this.deleteParam);

					this.paramsViews.push(view);
				}

			});
		}
	}
})