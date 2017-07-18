define([
	'jquery',
	'backbone',
	'examEditor/requiredModulesView',
	'examEditor/util',
	'jqueryTmpl'
],function($, Backbone, RequiredModulesView, Util){

	var MainView = Backbone.View.extend({
		el: '#main-wrapper',
		initialize: function(options){
			this.state = 'large'; // enum: [large, middle, small]
			// this.basicEditorView = new BasicEditorView();
			this.modulesControllerView = new ModulesControllerView({state: this.state, collection: this.collection});
			this.initRequiredModulesView();
		},
		initRequiredModulesView: function(){
			var models = this.collection.filter(function(model){
				return model.get('type') == 'required';
			})
			this.requiredModulesView = new RequiredModulesView({collection: new Backbone.Collection(models)});
		},
		expand: function(){
			if (this.state == 'small') {
				this.$el.removeClass('fake-hide');
				this.setState('middle');
				return;
			}

			if (this.state == 'middle') {
				this.$el.removeClass('col-md-6').addClass('col-md-12');
				this.setState('large');
			}
		},
		compress: function(){
			if (this.state == 'middle') {
				this.$el.addClass('fake-hide');
				this.setState('small');
				return;
			}

			if (this.state == 'large') {
				this.$el.removeClass('col-md-12').addClass('col-md-6');
				this.setState('middle');
			}
		},
		setState: function(state){
			this.state = state;
			this.renderController();
		},
		renderController: function(){
			this.modulesControllerView.render(this.state);
		}
	});

	var ModulesControllerView = Backbone.View.extend({
		el: '#modules-controller',
		events: {
			'click li':'toggleModule'
		},
		initialize: function(options){
			var state = options && options.state || 'large';
			this.render(state);	
		},
		render: function(state){
			var modules = this.collection.toJSON().filter(function(module){
				return module.type === 'optional';
			})
			var html = $('#modules-controller-tmpl').tmpl({modules: modules, state: state});
			this.$el.html(html);
		},
		toggleModule: function(e){
			var $target = $(e.currentTarget);
			var moduleId = $target.attr('module-id');
			this.trigger('toggle:module', moduleId);
		}
	});

	return MainView;

})