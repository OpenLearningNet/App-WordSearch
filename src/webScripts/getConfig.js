var existingConfiguration = (OpenLearning.page.getData(request.user).data || {}).configuration;

response.writeJSON({
	configuration: existingConfiguration,
	success: true
});
