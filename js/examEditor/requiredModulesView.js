define([
	'jquery',
	'backbone',
	'examEditor/viewConstructors',
	'jqueryTmpl'
],function($, Backbone, ViewConstructors){

	var RequiredModuleView = Backbone.View.extend({
		initialize: function(){
			this.$el.show();
		}	
	});

	var RequiredModulesView = Backbone.View.extend({
		el: '#required-modules-wrapper',
		initialize: function(){
			this.viewConstructors = ViewConstructors.init(this.collection.models, RequiredModuleView);
			this.modulesMap = {};
			this.render();
		},
		render: function(){
			var that = this;
			this.collection.each(function(moduleModel){
				var moduleId = moduleModel.get('id');

				var $dom = $('#module-tmpl').tmpl(moduleModel.toJSON());
				that.$el.append($dom);

				var id = moduleId+'-module';
				var View = that.viewConstructors[moduleId];
				that.modulesMap[moduleId] = new View({el:'#'+id, model: moduleModel});
			});
		}

	});
	return RequiredModulesView;
});