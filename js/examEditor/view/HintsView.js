define([
	'underscore',
	'examEditor/util',
],function(_, Util){

	var HintModel = Backbone.Model.extend({});

	var HintEditorView = Backbone.View.extend({
		events: {
			'keyup .form-input': 'updateHint',
			'click .up-hint': 'upHint',
			'click .delete-hint': 'deleteHint'
		},
		render: function(){
			this.$el = $('#hint-editor-tmpl').tmpl(this.model.toJSON());
			this.delegateEvents(this.events);
			return this.$el;
		},
		upHint: function(){
			this.trigger('up:hint', this.cid);
		},
		deleteHint: function(){
			this.trigger('delete:hint', this.cid);
		},
		updateHint: function(e){
			var $target = $(e.currentTarget);
			this.model.set('hint', $target.val());
			this.trigger('update:hint');
		}
	});

	return {
		constructView: function(BaseView){
			return BaseView.extend({
				events: {
					'click .add-hints':'addHint'
				},
				initialize: function(){
					_.bindAll(this, 'upHint', 'updateToGlobal', 'deleteHint');

					BaseView.prototype.initialize.call(this);
					this.createEditor();
				},
				createEditor: function(){
					var id = this.$('.module-wrapper').attr('id');
					var that = this;

					this.hints = this.model.get('data')[0] || [];
					this.hintsViews = [];

					this.editor = Util.createHintsEditor(id, this.hints.length);

					this.hints.forEach(function(hint){
						that.createHintView(hint);
					});

					this.render();
					this.updateToGlobal();
				},
				render: function(){
					var that = this;
					this.$('.current-hints').html('');
					this.hintsViews.forEach(function(view){
						that.$('.current-hints').append(view.render());
					});
				},
				updateToGlobal: function(){
					var hints = this.hintsViews.map(function(view){
						return view.model.get('hint') || '';
					}) || [];

					this.model.get('data').pop();
					this.model.get('data').push(hints);
					this.model.trigger('update:storage');
				},
				createHintView: function(hint){
					var model = new HintModel({hint: hint});
					var view = new HintEditorView({model: model});

					this.listenTo(view, 'up:hint', this.upHint);
					this.listenTo(view, 'delete:hint', this.deleteHint);
					this.listenTo(view, 'update:hint', this.updateToGlobal);

					this.hintsViews.push(view);
					this.updateToGlobal();
				},
				upHint: function(cid){
					var index = this.hintsViews.findIndex(function(view){
						return view.cid === cid;
					});
					var view = this.hintsViews.splice(index, 1)[0];
					this.hintsViews.unshift(view);
					this.render();
					this.updateToGlobal();
				},
				deleteHint: function(cid){
					var index = this.hintsViews.findIndex(function(view){
						return view.cid === cid;
					});
					var view = this.hintsViews.splice(index, 1)[0];
					view.remove();
					this.updateTotalNum();
					this.updateToGlobal();
				},
				addHint: function(){
					this.createHintView('');
					this.render();
					this.updateTotalNum();
				},
				updateTotalNum: function(){
					var total = this.hintsViews.length;
					var plural = total > 1 ? 'hints' : 'hint';
					this.$('.hints-num span.total').text(total);
					this.$('.hints-num span.plural').text(plural);
				}
			});
		}
	}
})