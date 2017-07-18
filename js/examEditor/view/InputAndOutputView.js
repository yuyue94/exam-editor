define([
	'examEditor/util',
],function(Util){
	return {
		constructView: function(BaseView){
			return BaseView.extend({
				events: {
					'keyup .form-input': 'saveResult'
				},
				initialize: function(){
					BaseView.prototype.initialize.call(this);
					this.createEditor();
				},
				updateToGlobal: function(){
					this.model.get('data').pop();
					this.model.get('data').push(this.result);
					this.model.trigger('update:storage');
				},
				createEditor: function(){
					var id = this.$('.module-wrapper').attr('id');
					var that = this;

					this.result = this.model.get('data')[0] || {
						inputExample: '',
						inputDescription: '',
						outputExample: '',
						outputDescription: ''
					};
					Util.createIOEditor(id, this.result);
					this.updateToGlobal();
				},
				saveResult: function(e){
					var $target = $(e.currentTarget);
					var key = $target.attr('io-type');
					this.result[key] = $target.val();
					this.updateToGlobal();
				}	
			});
		}
	}
})
