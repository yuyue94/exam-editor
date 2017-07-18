define([
	'jquery',
	'backbone',
	'examEditor/viewConstructors',
	'jqueryTmpl'
],function($, Backbone, ViewConstructors){

	var OptionalModuleView = Backbone.View.extend({
		initialize: function(){
			this.model.set('exist',true);
		},
		show: function(){
			this.model.set('active', true);
			this.$el.addClass('active');
		},
		hide: function(){
			this.model.set('active', false);
			this.$el.removeClass('active');
		},
		destroy: function(){
			this.model.set({
				exist: false,
				active: false
			});
			this.model.get('data').pop();
		},
		getId: function(){
			return this.model.get('id');
		},
	});

	var OptionalModulesView = Backbone.View.extend({
		el: '#optional-modules-wrapper',
		initialize: function(options){
			this.state = 'small'; // enum: [large, middle, small]
			this.modulesMap = {};
			this.viewConstructors = ViewConstructors.init(this.collection.models, OptionalModuleView);
			this.modulesToolsView = new ModulesToolsView({state: this.state});

			this.collection.forEach(function(model){
				if (model.get('exist')){
					this.addModule(model.get('id'));
				}	
			}.bind(this));

			this.listenTo(this.modulesToolsView, 'expand:modules', this.expand);
			this.listenTo(this.modulesToolsView, 'compress:modules', this.compress);
			this.listenTo(this.modulesToolsView, 'delete:currentModule', this.deleteCurrentModule);
		},
		toggleModule: function(moduleId){
			if (moduleId in this.modulesMap){
				var moduleView = this.modulesMap[moduleId];
				var currentModel = this.findActiveModel();
				var currentKey = currentModel && currentModel.get('id') || null;
				if (currentKey){
					if (moduleId == currentKey){
						this.compress();		
					} else {
						this.hideActiveView();
						moduleView.show();
					}
				} else {
					moduleView.show();
					this.expand();
				}
			} else {
				this.addModule(moduleId);
				this.toggleModule(moduleId);
			}
		},
		addModule: function(moduleId){
			var moduleModel = this.collection.get(moduleId);

			var $dom = $('#module-tmpl').tmpl(moduleModel.toJSON());
			this.$el.append($dom);

			var id = moduleId+'-module';
			var View = this.viewConstructors[moduleId];
			this.modulesMap[moduleId] = new View({el:'#'+id, model: moduleModel});
		},
		setState: function(state){
			this.state = state;
			this.renderTools();
		},
		renderTools: function(){
			this.modulesToolsView.render(this.state);
		},
		findActiveModel: function(){
			return this.collection.find(function(model){
				return model.get('active') === true;
			});
		},
		findActiveView: function(){
			var currentModel = this.findActiveModel();
			var currentId = currentModel && currentModel.get('id') || null;
			var currentView = this.modulesMap[currentId];
			return currentView;
		},
		hideActiveView: function(){
			var currentView = this.findActiveView();
			currentView && currentView.hide();
		},
		deleteCurrentModule: function(){
			var currentView = this.findActiveView();
			var currentId = currentView.getId();
			delete this.modulesMap[currentId];
			currentView.destroy();
			currentView.$el.remove();

			if (Object.keys(this.modulesMap).length === 0){ // 不存在则最小化
				if (this.state == 'large'){
					this.compress();
				}
				this.compress();
			} else { // 删除当前后跳到存在的第一个
				var moduleId = this.collection.find(function(model){
					return model.get('exist') === true;
				}).get('id');
				var moduleView = this.modulesMap[moduleId];
				moduleView.show();
			}
		},
		expand: function(){
			if (this.state == 'small') {
				this.$el.show();
				this.trigger('compress:main');
				this.setState('middle');
				return;
			}

			if (this.state == 'middle') {
				this.$el.removeClass('col-md-6').addClass('col-md-12');
				this.trigger('compress:main');
				this.setState('large');
			}
		},
		compress: function(){
			if (this.state == 'middle'){ 
				this.$el.hide();
				this.trigger('expand:main');
				this.setState('small');
				this.hideActiveView();
				return;
			}

			if (this.state === 'large'){
				this.$el.removeClass('col-md-12').addClass('col-md-6');	
				this.trigger('expand:main');
				this.setState('middle');
			}
		}
	});

	var ModulesToolsView = Backbone.View.extend({
		el: '#modules-tools',
		events: {
			'click li.expand-tool':'expand',
			'click li.compress-tool': 'compress',
			'click li.delete-tool': 'deleteModule'
		},
		initialize: function(options){
			var state = options && options.state || 'small';
			this.tools = [
				{
					title: 'expand',
					icon: 'fa fa-expand'
				},
				{
					title: 'compress',
					icon: 'fa fa-compress'
				},
				{
					title: 'delete',
					icon: 'fa fa-trash'
				}
			];
			this.render(state);
		},
		render: function(state){
			var html = $('#modules-tools-tmpl').tmpl({tools: this.tools, state: state});
			this.$el.html(html);
		},
		expand: function(){
			this.trigger('expand:modules');
		},
		compress: function(){
			this.trigger('compress:modules');
		},
		deleteModule: function(){
			this.trigger('delete:currentModule');
		}	
	});

	return OptionalModulesView; 

});
