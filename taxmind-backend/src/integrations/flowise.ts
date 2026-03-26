import Axios, { InternalAxiosRequestConfig } from 'axios';

import logger from '@/logger';

const authRequestInterceptor = (config: InternalAxiosRequestConfig) => {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  const token = process.env.FLOWISE_AUTH_TOKEN;

  if (token) {
    config.headers.Authorization = token;
  }

  return config;
};

export const flowiseApi = Axios.create({
  baseURL: process.env.FLOWISE_BASE_URL,
});

flowiseApi.interceptors.request.use(authRequestInterceptor);
flowiseApi.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error(error);
    logger.error(JSON.stringify(error));
    return Promise.reject(error);
  }
);

type Response = {
  text: string;
  question: string;
  chatId: string;
  chatMessageId: string;
  sessionId: string;
  memoryType: string;
};

export const generatePersonalityTraitDescription = async (username: string, trait: string) => {
  const question = `Teacher's name: ${username}, Trait: ${trait}`;
  const response = (await flowiseApi.post(`/prediction/${process.env.FLOWISE_CHATFLOW_ID}`, {
    question,
  })) as Response;
  // console.log(response);
  return response.text;
};
