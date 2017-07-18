define([
	'examEditor/util',
],function(Util){
	return {
		constructView: function(BaseView){
			return BaseView.extend({
				initialize: function(){
					BaseView.prototype.initialize.call(this);
					this.createEditor();
				},
				updateToGlobal: function(){
					this.model.get('data').pop();
					this.model.get('data').push(this.editor.getValue());
					this.model.trigger('update:storage');
				},
				createEditor: function(){
					var id = this.$('.module-wrapper').attr('id');
					var that = this;

					this.value = this.model.get('data')[0] || unescape(this.model.get('defaultData')) || '';
					this.editor = Util.createCodeEditor(id, this.value);
					this.updateToGlobal();

					this.editor.getSession().on('change', function(){
						that.updateToGlobal();
					});
				}	
			});
		}
	}
})
