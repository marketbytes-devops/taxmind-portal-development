# Use Node.js image
FROM 084828565317.dkr.ecr.eu-west-1.amazonaws.com/node-22.18.0:latest AS build-stage

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy package.json files
COPY package.json package-lock.json ./
RUN npm install

# Copy source
COPY . .

# Accept Firebase secret as build arg
ARG FIREBASE_SERVICE_ACCOUNT

# # Create Firebase config file from build arg
RUN mkdir -p src/config && echo "$FIREBASE_SERVICE_ACCOUNT" > src/config/taxmind-c5d6c-firebase-adminsdk-fbsvc-b896771a70.json

# Build app
RUN npm run build

# Remove Firebase config (security)
RUN rm -f src/config/taxmind-c5d6c-firebase-adminsdk-fbsvc-b896771a70.json

EXPOSE 5000

CMD ["node", "dist/index.js"]
