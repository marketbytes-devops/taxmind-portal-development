import docusign from 'docusign-esign';
import { docusignConfig } from '../docusignConfig';

export const sendEnvelope = async (recipientEmail, recipientName, documentBase64, documentName) => {
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(docusignConfig.apiBasePath);
  apiClient.addDefaultHeader('Authorization', `Bearer ${docusignConfig.accessToken}`);

  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = 'Please sign this document';

  const document = new docusign.Document();
  document.documentBase64 = documentBase64;
  document.name = documentName;
  document.fileExtension = 'pdf';
  document.documentId = '1';

  envelopeDefinition.documents = [document];

  const signer = new docusign.Signer();
  signer.email = recipientEmail;
  signer.name = recipientName;
  signer.recipientId = '1';
  signer.routingOrder = '1';

  const signHere = new docusign.SignHere();
  signHere.documentId = '1';
  signHere.pageNumber = '1';
  signHere.recipientId = '1';
  signHere.tabLabel = 'SignHereTab';
  signHere.xPosition = '100';
  signHere.yPosition = '100';

  const tabs = new docusign.Tabs();
  tabs.signHereTabs = [signHere];
  signer.tabs = tabs;

  envelopeDefinition.recipients = new docusign.Recipients();
  envelopeDefinition.recipients.signers = [signer];
  envelopeDefinition.status = 'sent';

  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  const results = await envelopesApi.createEnvelope(docusignConfig.accountId, { envelopeDefinition });
  return results;
};