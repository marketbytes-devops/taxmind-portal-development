import firebase, { ServiceAccount } from 'firebase-admin';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

import serviceAccount from '@/config/taxmind-c5d6c-firebase-adminsdk-fbsvc-b896771a70.json';
import logger from '@/logger';

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount as ServiceAccount),
});

export const verifyAuthToken = async (idToken: string) => {
  try {
    const decoded = await firebase.auth().verifyIdToken(idToken);
    console.log(decoded);
    return decoded;
  } catch (error) {
    logger.error((error as Error).message);
  }
};

type SendNotification = {
  topic?: string;
  tokens?: string[] | null;
  payload: MulticastMessage['notification'];
  data: MulticastMessage['data'];
};

export const sendNotification = async ({ topic, tokens, payload, data }: SendNotification) => {
  console.log({ topic, tokens, payload, data });
  try {
    if (topic) {
      const message = {
        topic: `${process.env.NODE_ENV}_${topic}`,
        notification: payload,
        data,
      };

      const response = await firebase.messaging().send(message);
      console.log(JSON.stringify(response, null, 2));
      logger.info('FCM Response: ', JSON.stringify(response, null, 2));
    }

    if (tokens && tokens.length) {
      const message = {
        tokens,
        notification: payload,
        data,
      };

      const response = await firebase.messaging().sendEachForMulticast(message);
      // console.log(JSON.stringify(response, null, 2));
      console.log(true, response);
      logger.info('FCM Rsponse: ', response);
    }
  } catch (error) {
    console.log(error);
    logger.error((error as Error).message);
  }
};

export const verifyFcmToken = async (fcmToken: string) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: 'Test',
        body: 'This is a dry run',
      },
    };

    // Perform a dry run
    const response = await firebase.messaging().send(message, true); // true for dry run
    console.log('Token is valid:', response);
    return response;
  } catch (error) {
    console.log(false, error);
    logger.error((error as Error).message);
  }
};

export const subscribeToTopic = async (fcmTokens: string[], topic: string) => {
  try {
    const response = await firebase
      .messaging()
      .subscribeToTopic(fcmTokens, `${process.env.NODE_ENV}_${topic}`);
    return response;
  } catch (error) {
    logger.error((error as Error).message);
  }
};

export const unsubscribeFromTopic = async (fcmTokens: string[], topic: string) => {
  try {
    const response = await firebase
      .messaging()
      .unsubscribeFromTopic(fcmTokens, `${process.env.NODE_ENV}_${topic}`);
    return response;
  } catch (error) {
    logger.error((error as Error).message);
  }
};

export default firebase;
