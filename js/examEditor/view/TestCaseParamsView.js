define([
	'underscore',
	'examEditor/util',
	'highlight'
], function(_, Util, hljs){

	hljs.configure({
		tabReplace: '    ', // 4 spaces
	});

	var TestCase = Backbone.Model.extend({});
	var TestCaseView = Backbone.View.extend({
		events: {
			'click .delete-test-case': 'deleteTestCase',
			'change .test-case-method-block select': 'updateMethod',
			'keyup .test-case-score-block input': 'updateScore',
			'keyup .test-case-message-block input': 'updateMessage',
			'click .toggle-preview-code': 'togglePreviewCode'
		},
		initialize: function(options){
			_.bindAll(this, 'updateTestCaseInput', 'updateToGlobal');
			this.paramMethods = options && options.paramMethods;
			this.paramsNameList = options && options.paramsNameList;
			this.listenTo(this.model, 'change:method change:score change:input change:output change:msg', this.updateToGlobal);
			this.typeMap = {
				num: ['&nbsp','&nbsp','number'],
				list: ['[', ']', 'Array'],
				// tuple: ['[', ']', 'Array'],
				str: ['\"', '\"', 'string'],
				dict: ['{', '}', 'Object']
			};
			this.$el = $('<div class="test-case-block clearfix"></div>');
		},
		deleteTestCase: function(){
			this.trigger('delete:testCase', this.cid);
		},
		updateToGlobal: function(){
			this.updatePreviewCode();
			this.trigger('update:testCase');
		},
		render: function(){
			this.findCurrentMethod();
			this.$el.html($('#test-case-param-tmpl').tmpl({testCase: this.model.toJSON(), paramMethods: this.paramMethods}));
			this.renderInputTextEditor();
			this.renderOutputTextEditor();
			this.delegateEvents(this.events); // 每次add后会重新render，需要在这里重新绑定事件
			return this.$el;
		},
		renderInputTextEditor: function(){
			var that = this;
			var $block = this.$el.find('.test-case-input-block');
			$block.find('form').html('');
			this.testCaseInputViews = [];
			this.paramsNameList.forEach(function(paramName, i){
				var value = that.model.get('input')[i] || ''; // 用于新增了参数，默认是str
				var type = that.findType(value);
				var model = new Backbone.Model({
					limit: null,
					typeName: type,
					typeMarks: type && that.typeMap[type] || ['',''],
					value: value,
					typeMap: that.typeMap,
					paramName: that.paramsNameList[i],
					io: 'input'
				});

				var view = new TestCaseTextEditorView({model: model});
				that.testCaseInputViews.push(view);
				that.listenTo(view, 'update:data', that.updateTestCaseInput);
				$block.find('form').append(view.render());
			});
		},
		renderOutputTextEditor: function(){
			var $block = this.$el.find('.test-case-output-block');
			$block.find('form').html('');
			var type = this.findType(this.model.get('output'));
			if ($block.length > 0){
				var model = new Backbone.Model({
					limit: this.currentMethod.limit || null,
					typeName: type,
					typeMarks: type && this.typeMap[type] || ['',''],
					value: this.model.get('output'),
					typeMap: this.typeMap,
					io: 'output'
				});

				this.testCaseOutputView = new TestCaseTextEditorView({model: model});
				this.listenTo(this.testCaseOutputView, 'update:data', this.updateTestCaseInput);
				$block.find('form').append(this.testCaseOutputView.render());
			}
		},
		findType: function(value){
			if (value === null || value === undefined) {
				return null;
			}
			if (typeof value !== 'object') {
				if (typeof value === 'number') {
					return 'num';
				} else if (typeof value === 'string') {
					return 'str';
				} else {
					alert('find type error!!')
				}
			} else {
				if (value.constructor.name === 'Array') {
					return 'list';
				} else if (value.constructor.name === 'Object') {
					return 'dict';
				} else {
					alert('find type error!!')
				}
			}
		},
		findCurrentMethod: function(){
			var that = this;

			this.currentMethod = this.paramMethods.find(function(method){
				return method.name === that.model.get('method');
			});

			this.model.set({
				paramsNum: this.currentMethod.paramsNum,
			});

		},
		updateTestCaseInput: function(io){
			if (io === 'input') {
				var input = [];
				this.testCaseInputViews.forEach(function(view){
					input.push(view.model.get('value'));
				});
				this.model.set('input', input);
			} else { // io === 'output'
				var output = this.testCaseOutputView.model.get('value');
				this.model.set('output', output);
			}
		},
		updateMethod: function(e){
			var $target = $(e.currentTarget);
			var method = $target.val();

			this.model.set('method', method);
			this.setDefaultOutput();
			this.render();
			this.updatePreviewCode();
		},
		updateScore: function(e){
			var $target = $(e.currentTarget);
			var scoreStr = $target.val();
			var score = scoreStr.length > 0 ? Number(scoreStr) : NaN;
			if (!Number.isNaN(score) && score >= 0 && score <= 100){
				$target.removeClass('invalid').addClass('valid');
				this.model.set('score', score);
			} else {
				$target.addClass('invalid').removeClass('valid');
			}
		},
		updateMessage: function(e){
			var $target = $(e.currentTarget);
			this.model.set('msg', $target.val());
		},
		setDefaultOutput: function(){
			var that = this;
			var currentMethod = this.paramMethods.find(function(method){
				return method.name === that.model.get('method');
			});
			var paramsNum = currentMethod.paramsNum;

			var defaultData = null;
			if (paramsNum === 2){ // 单参数时无output
				var limit = currentMethod.limit;
				switch(limit){
					case 'str': defaultData = ''; break;
					case 'num': defaultData = 0; break;
					case 'list': defaultData = []; break;
					case 'dict': defaultData = {}; break;
					default: defaultData = ''; // 无限制时默认为str类型的空字符串
				}
			}
			this.model.set('output', defaultData);
		},
		updatePreviewCode: function(){
			var that = this;
			var score = this.model.get('score');
			var input = this.model.get('input');
			var output = this.model.get('output');
			var method = this.model.get('method');
			var msg = this.model.get('msg');

			var scoreCode = '\t\"\"\"score:' + score + '\"\"\"\n';

			var inputCode = this.paramsNameList.reduce(function(prevParam, nextPram, i){
				return prevParam + '\t' + nextPram + ' = ' + that.formatString(input[i]) + '\n';
			}, '');

			var outputCode = '\toutput = self.test_class.solve('+ this.paramsNameList.join(',') +')\n'; 

			var expectedOutputCode = output !== null && '\texpected_out = ' + this.formatString(output) + '\n' || '';

			var methodParamList = ['output', '""', '\"' + msg + '\"'];

			output !== null && methodParamList.splice(1, 1 ,'expected_out');

			var methodCode = '\tself.' + method + '(' + methodParamList.join(',') + ')';

			var code = 	'def test_case(self):\n' + 
						scoreCode +
						inputCode + 
						outputCode + 
						expectedOutputCode +
						methodCode; 

			this.$('.test-case-code-preview-block pre code').html(code);
			hljs.highlightBlock(this.$('.test-case-code-preview-block pre code').get(0));
		},
		formatString: function(data){
			var type = this.findType(data);
			if (type === 'list' || type === 'dict') {
				return JSON.stringify(data);
			} else if (type === 'str'){
				return '\"' + data +'\"';
			} 
			return data;
		},
		togglePreviewCode: function(){
			this.$('.test-case-code-preview-block').toggle();	
		}
	});
	var TestCaseTextEditorView = Backbone.View.extend({
		events: {
			'change select':'changeType',
			'keyup input.editor':'updateData'
		},
		initialize: function(){
			this.model.set('dataStr', this.getDataStr(this.model.get('typeName'), this.model.get('value')));
			this.$el = $('<div class="form-group clearfix"></div>');
		},
		render: function(){
			var html = $('#test-case-text-editor-tmpl').tmpl(this.model.toJSON());
			this.$el.html(html); 
			this.delegateEvents(this.events);
			return this.$el;
		},
		changeType: function(e){
			var $target = $(e.currentTarget);
			var type = $target.val();
			this.model.set({
				typeName: type,
				typeMarks: this.model.get('typeMap')[type]
			});
			this.render();
			this.updateData(null);
		},
		getDataStr: function(type, value){
			if (type === 'list' || type === 'dict'){
				return JSON.stringify(value).slice(1, -1);
			} else {
				return value + '';
			}
		},
		updateData: function(e){
			var data = null;
			var dataStr = null;

			if (e) {
				var $target = $(e.currentTarget);
				dataStr = $target.val();
				this.model.set('dataStr', dataStr);
			} else {
				dataStr = this.model.get('dataStr');
			}

			var type = this.model.get('typeName');
			var typeMarks = this.model.get('typeMarks');

			try {
				if (type === 'str') {
					data = dataStr;
				} else if (type === 'num') {
					data = dataStr.length === 0 ? NaN : Number(dataStr); // Numer('')为0 但是parseInt('')为NaN
				} else {
					data = JSON.parse(typeMarks[0] + dataStr + typeMarks[1]);
				} 
			} catch(err) {
				data = null;
			} finally {
				var isValid = this.validateData(data);
				if (isValid){
					this.model.set('value', data);
					this.trigger('update:data', this.model.get('io'));
				}
			}
		},
		validateData: function(data){
			if (data === undefined || data === null || Number.isNaN(data)){
				this.$('input.editor').addClass('invalid').removeClass('valid');
				return false;
			} else {
				this.$('input.editor').removeClass('invalid').addClass('valid');
				return true;
			}
		}
	});

	return {
		constructView: function(BaseView){
			return BaseView.extend({
				events: {
					'click .add-test-case': 'addTestCase',
				},
				initialize: function(options){
					BaseView.prototype.initialize.call(this);

					_.bindAll(this, 'renderTestCasesUseNewParamsNameList');

					this.paramsNameList = [];
					this.getParamsNameList();
					this.bindParamsNameListChangeEvent();
					this.getParamMethods();

				},
				getParamsNameList: function(){
					var $sampleCode = $('#sampleCodeParams-module');
					if ($sampleCode.length > 0){ // 还是要保证sampleCode在testCase之前生成
						var view = $sampleCode.data('view');
						this.paramsNameList = view.model.get('data')[0] || [];
					} else {  
						this.paramsNameList = [];
					}
				},
				bindParamsNameListChangeEvent: function(){ // 绑定事件
					var $sampleCode = $('#sampleCodeParams-module');
					if ($sampleCode.length > 0){ // 还是要保证sampleCode在testCase之前生成，或者在那边再加上触发机制
						var view = $sampleCode.data('view');
						this.listenTo(view, 'update:paramsNameList', this.renderTestCasesUseNewParamsNameList);
					}
				},
				renderTestCasesUseNewParamsNameList: function(){
					var that = this;
					this.getParamsNameList();
					if (this.testCaseViews) {
						this.testCaseViews.forEach(function(view){
							var input = view.model.get('input');
							if (view.paramsNameList.length > that.paramsNameList.length) { // 删除了参数
								input.pop();
							} else { // 增加了参数
								input.push('');
							}
							view.model.set('input', input); // 这样做为了触发updateToGlobal

							view.paramsNameList = that.paramsNameList;

							view.render();
							view.updatePreviewCode();
							view.updateToGlobal(); // 按理说我绑定了input的change事件啊，应该不用这句的。。。
						});
					}
				},
				getParamMethods: function(){
					this.paramMethods = [{ name: 'assertTrue', paramsNum: 1, limit: null },
					{ name: 'assertFalse', paramsNum: 1, limit: null },
					{ name: 'assertIsNone', paramsNum: 1, limit: null },
					{ name: 'assertIsNotNone', paramsNum: 1, limit: null },
					{ name: 'assertEqual', paramsNum: 2, limit: null },
					{ name: 'assertNotEqual', paramsNum: 2, limit: null },
					{ name: 'assertIs', paramsNum: 2, limit: null },
					{ name: 'assertIsNot', paramsNum: 2, limit: null },
					{ name: 'assertIn', paramsNum: 2, limit: 'list' },
					{ name: 'assertNotIn', paramsNum: 2, limit: 'list' },
					{ name: 'assertIsInstance', paramsNum: 2, limit: null },
					{ name: 'assertNotIsInstance', paramsNum: 2, limit: null },
					{ name: 'assertAlmostEqual', paramsNum: 2, limit: null },
					{ name: 'assertNotAlmostEqual', paramsNum: 2, limit: null },
					{ name: 'assertGreater', paramsNum: 2, limit: null },
					{ name: 'assertGreaterEqual', paramsNum: 2, limit: null },
					{ name: 'assertLess', paramsNum: 2, limit: null },
					{ name: 'assertLessEqual', paramsNum: 2, limit: null },
					{ name: 'assertRegexpMatches', paramsNum: 2, limit: null },
					{ name: 'assertNotRegexpMatches', paramsNum: 2, limit: null },
					{ name: 'assertItemsEqual', paramsNum: 2, limit: null },
					{ name: 'assertDictContainsSubset', paramsNum: 2, limit: 'dict' },
					{ name: 'assertMultiLineEqual', paramsNum: 2, limit: 'str' },
					{ name: 'assertSequenceEqual', paramsNum: 2, limit: 'str' },
					{ name: 'assertListEqual', paramsNum: 2, limit: 'list' },
					{ name: 'assertDictEqual', paramsNum: 2, limit: 'dict' }]

					this.createEditor();
				},
				updateToGlobal: function(){
					var testCaseList = this.testCaseViews.map(function(view){
						return view.model.toJSON();
					}) || [];

					console.log(testCaseList);

					this.model.get('data').pop();
					this.model.get('data').push(testCaseList);
					this.model.trigger('update:storage');
				},
				createEditor: function(){
					var id = this.$('.module-wrapper').attr('id');
					var that = this;

					this.testCaseList = this.model.get('data')[0] || [];
					this.testCaseViews = [];

					this.testCaseList.forEach(function(testCase){
						that.createTestCaseView(testCase);
					});

					this.render(id);
					this.updateToGlobal();
				},
				createTestCaseView: function(testCase){
					var model = new TestCase(testCase);
					var view = new TestCaseView({model:model, paramMethods:this.paramMethods, paramsNameList:this.paramsNameList});

					this.listenTo(view, 'update:testCase', this.updateToGlobal);
					this.listenTo(view, 'delete:testCase', this.deleteTestCase);

					this.testCaseViews.push(view);
				},
				render: function(id){
					var html = $('#test-case-params-tmpl').tmpl({'total':this.testCaseViews.length});
					this.$('#'+id).html(html);
					this.renderParams();
				},
				renderParams: function(){
					var that = this;
					this.$('.current-test-cases').html('');
					this.testCaseViews.forEach(function(view){
						that.$('.current-test-cases').append(view.render());
						view.updatePreviewCode();
					});
				},
				addTestCase: function(){
					var input = [];
					this.paramsNameList.forEach(function(){
						input.push('');
					});

					var testCase = {
						method: 'assertEqual', 
						score: 0,
						input: input,
						output: '',
						msg: ''
					};
					this.createTestCaseView(testCase);
					this.renderParams();
					this.updateTotalNum();
					this.updateToGlobal();
				},
				deleteTestCase: function(cid){
					var index = this.testCaseViews.findIndex(function(view){
						return view.cid === cid;
					});

					var view = this.testCaseViews.splice(index, 1)[0];
					view.remove();
					this.updateTotalNum();
					this.updateToGlobal();
				},
				updateTotalNum: function(){
					var total = this.testCaseViews.length;
					var plural = total > 1 ? 'cases' : 'case';
					this.$('.test-cases-num span.total').text(total);
					this.$('.test-cases-num span.plural').text(plural);
				}

			})
		}
	}
})