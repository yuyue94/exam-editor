require([
	'jquery',
	'underscore',
	'backbone',
	'examEditor/mainView',
	'examEditor/optionalModulesView',
	'jqueryTmpl'
],function($, _, Backbone, MainView, OptionalModulesView){

	var MODULES_MAP = {
		title: {
			title: 'Title',
			viewName: 'TitleView'
		},
		description: {
			title: 'Description',
			viewName: 'DescriptionView'
		},
		hints: {
			icon: 'fa fa-lightbulb-o',
			title: 'Hints',
			viewName: 'HintsView'
		},
		solution: {
			icon: 'fa fa-key',
			title: 'Solution',
			viewName: 'SolutionView'
		},
		sampleCode: {
			icon: 'fa fa-code',
			title: 'Sample Code',
			viewName: 'SampleCodeView'
		},
		sampleCodeParams: {
			icon: 'fa fa-code',
			title: 'Sample Code',
			viewName: 'SampleCodeParamsView',
		},
		testCase: {
			icon: 'fa fa-flask',
			title: 'Test Case',	
			viewName: 'TestCaseView'
		},
		io: {
			icon: 'fa fa-inbox',
			title: 'Input And Output',
			viewName: 'InputAndOutputView'
		},
		testCaseParams: {
			icon: 'fa fa-flask',
			title: 'Test Case',	
			viewName: 'TestCaseParamsView'
		},
	};

	var ModuleModel = Backbone.Model.extend({
		defaults: {
			active: false,
			exist: false
		}
	});

	var ModulesCollection = Backbone.Collection.extend({
		model: ModuleModel,	
	});

	var ExamEditorView = Backbone.View.extend({
		el: '#exam-editor',
		events: {
			'click h3 #save-modules':'save',
			'click h3 #reset-modules':'reset',
			'click h3 #preview-modules':'preview',
			'click #change-mode': 'changeMode'
		},
		initialize: function(){
			_.bindAll(this, 'renderController', 'updateStorage', 'changeButtonState');

			this.problemId = this.getParasFromUrl().problemId || '';

			this.mode = 'simple';

			this.config = { // dataType暂时没用，之后考虑改为普通模块和特殊模块，维持扩展性和特异性
				title: {
					type: 'required',
					dataType: 'text'
				},
				description: {
					type: 'required',
					dataType: 'html'
				},
				sampleCodeParams: {
					type: 'required',
					dataType: 'code',
				},
				hints: {
					type: 'optional',
					dataType: 'hints',
				},
				solution: {
					type: 'optional',
					dataType: 'code',
					defaultData: ''
				},
				io: {
					type: 'optional',
					dataType: 'io'	
				},
				testCaseParams: {
					type: 'optional',
					dataType: 'code',
				}
			}
			this.initModules();
		},
		initConfig: function(modules){ 
			var isExpertMode = false;
			if (modules.constructor.name === 'Array') {
				var index = modules.findIndex(function(module){
					return module.id === 'sampleCode';
				});

				if (index !== -1) {
					isExpertMode = true;
				}
			} else {
				isExpertMode = modules.sampleCode ? true : false;
			}

			if (isExpertMode) {
				this.mode = 'expert';

				delete this.config.sampleCodeParams;
				delete this.config.testCaseParams;

				this.config.sampleCode = {
					type: 'required',
					dataType: 'code',
					defaultData: '%23-*-%20coding%3Autf-8%20-*-%0A%27%27%27%0Alog%20api%20example%3A%20log%28%27output%20is%3A%20%27%20+%20str%28output%29%29%0A%27%27%27%0Afrom%20log_api%20import%20log%0A%0Aclass%20Solution%28%29%3A%0A%09def%20solve%28self%29%3A%0A%09%09pass'
				}

				this.config.testCase = {
					type: 'optional',
					dataType: 'code',
					defaultData: '%23-*-%20coding%3Autf-8%20-*-%0A%27%27%27%0Ayou%20CAN%20NOT%20change%20the%20code%20unless%20there%20is%20a%20%27modify%20here%27%20signal%0A%27%27%27%0Aimport%20sys%0Aimport%20imp%0Aimport%20unittest%0Aimport%20numpy%20as%20np%0Afrom%20unittest%20import%20mc_unittest%0Afrom%20unittest%20import%20timeout%0A%0ACODE_PATH%20%3D%20%27%27%0A%0Aclass%20MTestCase%28unittest.TestCase%29%3A%0A%20%20%20%20%0A%20%20%20%20%23initial%20the%20test_class%20object%0A%20%20%20%20def%20setUp%28self%29%3A%0A%20%20%20%20%20%20%20%20unittest.TestCase.setUp%28self%29%0A%20%20%20%20%20%20%20%20test_module%20%3D%20imp.load_source%28%27module%27%2C%20CODE_PATH%29%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20here-------------------------%0A%20%20%20%20%20%20%20%20%23%20change%20to%20test_module.CLASS_NAME_IN_SAMPLE_CODE%2C%20default%20is%20Solution%0A%20%20%20%20%20%20%20%20self.test_class%20%3D%20test_module.Solution%28%29%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20end--------------------------%0A%0A%20%20%20%20%23destroy%20the%20test_class%20object%20%0A%20%20%20%20def%20tearDown%28self%29%3A%0A%20%20%20%20%20%20%20%20unittest.TestCase.tearDown%28self%29%0A%20%20%20%20%20%20%20%20self.test_class%20%3D%20None%0A%0A%20%20%20%20@timeout.timeout%28seconds%3D10%29%0A%20%20%20%20def%20test_case_1%28self%29%3A%0A%20%20%20%20%20%20%20%20%22%22%22score%3A60%22%22%22%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20here-------------------------%0A%20%20%20%20%20%20%20%20%23%20for%20example%3A%0A%20%20%20%20%20%20%20%20%23%20a%20%3D%201%0A%20%20%20%20%20%20%20%20%23%20b%20%3D%202%0A%20%20%20%20%20%20%20%20%23%20output%20%3D%20self.test_class.solve%28a%2C%20b%29%20%23solve%20is%20%20the%20function%20name%20in%20sample_code%0A%20%20%20%20%20%20%20%20%23%20expected_out%20%3D%203%0A%20%20%20%20%20%20%20%20%23%20self.assertEqual%28output%2C%20expected_output%2C%20%27The%20output%20is%20not%20correct%2C%20we%20expect%20%27%20+%20str%28expected_output%29%29%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20end--------------------------%0A%20%20%20%20%20%20%20%20pass%0A%20%20%20%20%0A%20%20%20%20@timeout.timeout%28seconds%3D10%29%0A%20%20%20%20def%20test_case_2%28self%29%3A%0A%20%20%20%20%20%20%20%20%22%22%22score%3A40%22%22%22%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20here-------------------------%0A%20%20%20%20%20%20%20%20%23%20see%20the%20example%20in%20test_case_1%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20end--------------------------%0A%20%20%20%20%20%20%20%20pass%0A%0A%20%20%20%20%23you%20can%20add%20more%20testcases%20here%0A%0Aif%20__name__%20%3D%3D%20%27__main__%27%3A%0A%20%20%20%20CODE_PATH%20%3D%20sys.argv%5B1%5D%0A%20%20%20%20SUB_ID%20%3D%20sys.argv%5B2%5D%0A%20%20%20%20del%20sys.argv%5B1%5D%0A%20%20%20%20del%20sys.argv%5B1%5D%0A%20%20%20%20mc%20%3D%20mc_unittest.MC_Unittest%28MTestCase%2CSUB_ID%29%0A%20%20%20%20mc.run_testcase%28%29'
				}
			} else {
				this.$('#change-mode').show();
			}
		},
		initModules: function(modules){
			this.modulesCollection = new ModulesCollection();

			if (modules) { // update的情况下不会存缓存
				this.initConfig(modules);
				_.each(this.config, function(module, id){
					var objFromDB = {};
					if (modules[id]){
						if (typeof modules[id] === 'object') {
							if (Object.keys(modules[id]).length > 0) {
								objFromDB.data = [modules[id]];
								objFromDB.exist = true;
							}
						} else {
							objFromDB.data = [modules[id]];
							objFromDB.exist = true;
						}
					}
					var obj = $.extend({id:id, data:[]}, MODULES_MAP[id], module, objFromDB);
					this.modulesCollection.add(new ModuleModel(obj));
				}.bind(this));

			} else if (sessionStorage.modules){ // 出新题的时候会缓存到sessionStorage 
				modules = JSON.parse(sessionStorage.modules);
				this.initConfig(modules);

				_.each(modules, function(module){
					this.modulesCollection.add(new ModuleModel(module));
				}.bind(this));
			} else {
				_.each(this.config, function(module, id){
					var obj = $.extend({id:id, data:[]}, MODULES_MAP[id], module);
					this.modulesCollection.add(new ModuleModel(obj));
				}.bind(this));

				this.$('#change-mode').show();
				this.updateStorage();
			}

			this.modulesCollection.on('change:exist', this.renderController);
			this.modulesCollection.on('change:active', this.renderController);

			this.modulesCollection.on('update:storage', this.updateStorage);
			this.modulesCollection.on('change:exist', this.updateStorage);
			this.modulesCollection.on('change:active', this.updateStorage);

			this.modulesCollection.on('update:buttonState', this.changeButtonState);

			this.mainView = new MainView({collection: this.modulesCollection});

			var models = this.modulesCollection.filter(function(model){
				return model.get('type') == 'optional'
			});
			this.OptionalModulesCollection = new Backbone.Collection(models);
			this.modulesView = new OptionalModulesView({collection: this.OptionalModulesCollection});

			this.listenTo(this.mainView.modulesControllerView, 'toggle:module', this.toggleModule);
			this.listenTo(this.modulesView, 'expand:main', this.expandMainView);
			this.listenTo(this.modulesView, 'compress:main', this.compressMainView);

			if (this.modulesView.findActiveModel()){ // will trigger 'expand:main'
				this.modulesView.expand();
			}

		},
		getParasFromUrl: function(){
			var query = location.search.slice(1,location.search.length);
			var paraStrList = query && query.split('&') || [];
			var paras = {};
			paraStrList.forEach(function(paraStr){
				var para = paraStr.split('=');
				paras[para[0]] = para[1];
			});
			return paras;
		},
		toggleModule: function(moduleKey){
			this.modulesView.toggleModule(moduleKey);
		},
		expandMainView: function(){
			this.mainView.expand();
		},
		compressMainView: function(){
			this.mainView.compress();
		},
		renderController: function(){
			this.mainView.renderController();
		},
		updateStorage: function(data){
			if (data) {
				sessionStorage.modules = JSON.stringify(data);
				return;
			}
			sessionStorage.modules = JSON.stringify(this.modulesCollection.toJSON());
		},
		changeButtonState: function(isValid){
			if (isValid){
				this.$('.btn.operation').removeClass('disabled');
			} else {
				this.$('.btn.operation').addClass('disabled');
			}
		},
		save: function(e){
			this.submit(e);
		},
		reset: function(){
			if (confirm('将清空数据，并刷新页面，确认操作？')){
				sessionStorage.clear();
				location.reload();
			}
		},
		formatModules: function(modules){
			var result = {};
			modules.filter(function(module){
				return module.type == 'required' || module.exist;
			}).forEach(function(module){
				result[module.id] = module.data[0];
			});
			return result;

		},
		submit: function(e, callback){
			var $target = $(e.currentTarget);
			var that = this;

			var modules = this.modulesCollection.toJSON();
			var result = this.formatModules(modules);

			var url = 'service/pythonLessonPreview.mvc';
			alert(JSON.stringify(result, null, 4));
		},
		changeMode: function(){
			var change = confirm('warning! after switching to expert mode, you cannot undo!');
			if (!change) {
				return;
			}

			var modules = this.modulesCollection.toJSON();
			var result = this.formatModules(modules);
			var that = this;

			var data = {};

			if (result.sampleCodeParams) {
				data.sampleCodeParams = result.sampleCodeParams;
			}

			if (result.testCaseParams) {
				data.testCaseParams = result.testCaseParams;
			}

			if (this.problemId) {
				data.problemId = this.problemId;
			} 

			var config = {
				sampleCode: {
					type: 'required',
					dataType: 'code',
					defaultData: '%23-*-%20coding%3Autf-8%20-*-%0A%27%27%27%0Alog%20api%20example%3A%20log%28%27output%20is%3A%20%27%20+%20str%28output%29%29%0A%27%27%27%0Afrom%20log_api%20import%20log%0A%0Aclass%20Solution%28%29%3A%0A%09def%20solve%28self%29%3A%0A%09%09pass'
				},
				testCase: {
					type: 'optional',
					dataType: 'code',
					defaultData: '%23-*-%20coding%3Autf-8%20-*-%0A%27%27%27%0Ayou%20CAN%20NOT%20change%20the%20code%20unless%20there%20is%20a%20%27modify%20here%27%20signal%0A%27%27%27%0Aimport%20sys%0Aimport%20imp%0Aimport%20unittest%0Aimport%20numpy%20as%20np%0Afrom%20unittest%20import%20mc_unittest%0Afrom%20unittest%20import%20timeout%0A%0ACODE_PATH%20%3D%20%27%27%0A%0Aclass%20MTestCase%28unittest.TestCase%29%3A%0A%20%20%20%20%0A%20%20%20%20%23initial%20the%20test_class%20object%0A%20%20%20%20def%20setUp%28self%29%3A%0A%20%20%20%20%20%20%20%20unittest.TestCase.setUp%28self%29%0A%20%20%20%20%20%20%20%20test_module%20%3D%20imp.load_source%28%27module%27%2C%20CODE_PATH%29%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20here-------------------------%0A%20%20%20%20%20%20%20%20%23%20change%20to%20test_module.CLASS_NAME_IN_SAMPLE_CODE%2C%20default%20is%20Solution%0A%20%20%20%20%20%20%20%20self.test_class%20%3D%20test_module.Solution%28%29%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20end--------------------------%0A%0A%20%20%20%20%23destroy%20the%20test_class%20object%20%0A%20%20%20%20def%20tearDown%28self%29%3A%0A%20%20%20%20%20%20%20%20unittest.TestCase.tearDown%28self%29%0A%20%20%20%20%20%20%20%20self.test_class%20%3D%20None%0A%0A%20%20%20%20@timeout.timeout%28seconds%3D10%29%0A%20%20%20%20def%20test_case_1%28self%29%3A%0A%20%20%20%20%20%20%20%20%22%22%22score%3A60%22%22%22%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20here-------------------------%0A%20%20%20%20%20%20%20%20%23%20for%20example%3A%0A%20%20%20%20%20%20%20%20%23%20a%20%3D%201%0A%20%20%20%20%20%20%20%20%23%20b%20%3D%202%0A%20%20%20%20%20%20%20%20%23%20output%20%3D%20self.test_class.solve%28a%2C%20b%29%20%23solve%20is%20%20the%20function%20name%20in%20sample_code%0A%20%20%20%20%20%20%20%20%23%20expected_out%20%3D%203%0A%20%20%20%20%20%20%20%20%23%20self.assertEqual%28output%2C%20expected_output%2C%20%27The%20output%20is%20not%20correct%2C%20we%20expect%20%27%20+%20str%28expected_output%29%29%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20end--------------------------%0A%20%20%20%20%20%20%20%20pass%0A%20%20%20%20%0A%20%20%20%20@timeout.timeout%28seconds%3D10%29%0A%20%20%20%20def%20test_case_2%28self%29%3A%0A%20%20%20%20%20%20%20%20%22%22%22score%3A40%22%22%22%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20here-------------------------%0A%20%20%20%20%20%20%20%20%23%20see%20the%20example%20in%20test_case_1%0A%20%20%20%20%20%20%20%20%23%20---------------------modify%20end--------------------------%0A%20%20%20%20%20%20%20%20pass%0A%0A%20%20%20%20%23you%20can%20add%20more%20testcases%20here%0A%0Aif%20__name__%20%3D%3D%20%27__main__%27%3A%0A%20%20%20%20CODE_PATH%20%3D%20sys.argv%5B1%5D%0A%20%20%20%20SUB_ID%20%3D%20sys.argv%5B2%5D%0A%20%20%20%20del%20sys.argv%5B1%5D%0A%20%20%20%20del%20sys.argv%5B1%5D%0A%20%20%20%20mc%20%3D%20mc_unittest.MC_Unittest%28MTestCase%2CSUB_ID%29%0A%20%20%20%20mc.run_testcase%28%29'
				}
			}
			_.each(config, function(module, id){
				var objFromStorage = {};
				var obj = $.extend({id:id, data:[]}, MODULES_MAP[id], module, objFromStorage);
				that.modulesCollection.add(new ModuleModel(obj));
			});

			var modules = that.modulesCollection.toJSON();

			modules = modules.filter(function(module){
				return module.id !== 'sampleCodeParams' && module.id !== 'testCaseParams';
			});

			that.updateStorage(modules);
			location.reload();
		}
	});

	new ExamEditorView();

});