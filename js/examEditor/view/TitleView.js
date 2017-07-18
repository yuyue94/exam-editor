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
					this.model.get('data').push(this.editor.val());
					this.model.trigger('update:storage');
				},
				validateInput: function(){
					var input = this.editor.val();
					var reg = /^[_#&]|[;,.$]+/; // title不能是这样的
					return input.length > 0 && !reg.test(input);
				},
				toggleValid: function(isValid){
					if (isValid){
						this.editor.addClass('valid').removeClass('invalid');
					} else {
						this.editor.removeClass('valid').addClass('invalid');
					}
					this.model.trigger('update:buttonState', isValid);
				},
				createEditor: function(){
					var id = this.$('.module-wrapper').attr('id');
					var that = this;

					this.value = this.model.get('data')[0] || '';
					this.editor = Util.createTextEditor(id, this.value);
					this.toggleValid(this.validateInput());
					this.updateToGlobal();

					this.editor.on('keyup', function(){
						var isValid = that.validateInput();
						that.toggleValid(isValid);
						that.updateToGlobal();
					});
				}	
			});
		}
	}
})