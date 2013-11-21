var submissionData = (OpenLearning.activity.getSubmission(request.user) || {});
var submission = submissionData.submission || {};

var responseJSON = {
	success: true,
	url: submissionData.url
};

if (request.args['page'] === 'true') {
	responseJSON.content = submission.content;
	responseJSON.file = submission.file;
	responseJSON.files = submission.files;
}

responseJSON.metadata = submission.metadata;

response.writeJSON(responseJSON);
