define([
	'examEditor/view/TitleView',
	'examEditor/view/DescriptionView',
	'examEditor/view/SampleCodeView',
	'examEditor/view/SampleCodeParamsView',
	'examEditor/view/TestCaseParamsView',
	'examEditor/view/HintsView',
	'examEditor/view/SolutionView',
	'examEditor/view/TestCaseView',
	'examEditor/view/InputAndOutputView'
],function(){
	return {
		init: function(models, BaseView){
			var viewConstructors = {};
			var Util = this;
			models.forEach(function(model){
				var module =  model.toJSON();
				var viewName = model.get('viewName');
				var ViewProxy = require('examEditor/view/'+viewName);
				viewConstructors[module.id] = ViewProxy.constructView(BaseView);
			});
			return viewConstructors;
		}
	}
})